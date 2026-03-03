import Foundation
import StoreKit
import UIKit

/// Main entry point for the EuroPay iOS SDK.
///
/// Configure once at app launch, then use to fetch products, initiate purchases,
/// and check entitlements.
///
/// ```swift
/// // 1. Configure at launch
/// EuroPayKit.configure(EuroPayConfig(
///     apiKey: "europay_your_api_key",
///     appId: "your_app_id",
///     returnScheme: "europay-myapp://return",
///     checkoutMode: .inAppSafari
/// ))
///
/// // 2. Purchase a product
/// let transaction = try await EuroPayKit.shared!.purchase(
///     product: product,
///     userId: "user_123",
///     presenting: viewController
/// )
///
/// // 3. Check access
/// if EuroPayKit.shared!.hasAccess(to: "com.myapp.premium") {
///     showPremiumContent()
/// }
/// ```
@MainActor
public final class EuroPayKit: ObservableObject {

    // MARK: - Singleton

    /// The shared SDK instance. `nil` until ``configure(_:)`` is called.
    public static var shared: EuroPayKit?

    /// Initialize the SDK with your configuration. Call once at app launch.
    public static func configure(_ config: EuroPayConfig) {
        shared = EuroPayKit(config: config)
    }

    // MARK: - Properties

    private let config: EuroPayConfig
    private let network: NetworkClient
    private let entitlementEngine: EntitlementEngine

    /// Current active entitlements for the user. Updated by ``refreshEntitlements(userId:)``.
    @Published public private(set) var entitlements: [EuroPayEntitlement] = []

    /// Whether a network operation is in progress.
    @Published public private(set) var isLoading = false

    // MARK: - Init

    private init(config: EuroPayConfig) {
        self.config = config
        self.network = NetworkClient(config: config)
        self.entitlementEngine = EntitlementEngine()
    }

    // MARK: - Public API

    /// Check if this user is in the EU App Store (required for DMA compliance).
    ///
    /// Uses StoreKit 2's `Storefront.current` to detect the user's App Store region.
    /// Returns `false` for non-EU storefronts — your app should fall back to StoreKit
    /// for these users.
    public func isEUUser() async -> Bool {
        return await StoreRegion.isEUStorefront()
    }

    /// Check the user's region and return a result indicating whether EuroPay
    /// can be used, or if the app should fall back to StoreKit.
    ///
    /// Use this before showing any EU-specific purchase UI:
    ///
    /// ```swift
    /// switch await euPay.checkRegion() {
    /// case .supported:
    ///     showEuroPayPurchaseButton()
    /// case .notSupported:
    ///     showStoreKitPurchaseButton()
    /// }
    /// ```
    public func checkRegion() async -> RegionCheckResult {
        let isEU = await StoreRegion.isEUStorefront()
        return isEU ? .supported : .notSupported
    }

    /// Fetch products from the EuroPay catalog for this app.
    public func fetchProducts() async throws -> [EuroPayProduct] {
        let response: ProductsResponse = try await network.get("/products/\(config.appId)")
        return response.products
    }

    /// Initiate a purchase flow.
    ///
    /// This method:
    /// 1. Verifies the user is in an EU App Store region
    /// 2. Shows the DMA-mandated disclosure modal
    /// 3. Creates a Stripe Checkout session
    /// 4. Opens the checkout in SFSafariViewController
    /// 5. Polls for entitlement confirmation after payment
    ///
    /// - Parameters:
    ///   - product: The product to purchase
    ///   - userId: Your app's user identifier for this end-user
    ///   - userEmail: Pre-fill email on checkout (optional)
    ///   - presenting: The view controller to present checkout UI from
    /// - Returns: A transaction confirming the purchase
    /// - Throws: ``EuroPayError/regionNotSupported`` if not in EU,
    ///           ``EuroPayError/userCancelled`` if user dismisses
    public func purchase(
        product: EuroPayProduct,
        userId: String,
        userEmail: String? = nil,
        presenting: UIViewController
    ) async throws -> EuroPayTransaction {

        // 1. Check EU region
        guard await isEUUser() else {
            throw EuroPayError.regionNotSupported
        }

        // 2. Show DMA mandatory disclosure
        let userAccepted = await DMADisclosure.present(from: presenting)
        guard userAccepted else {
            throw EuroPayError.userCancelled
        }

        // 3. Create checkout session
        isLoading = true
        defer { isLoading = false }

        let returnUrl = "\(config.returnScheme)?session={CHECKOUT_SESSION_ID}"
        let cancelUrl = "\(config.returnScheme)?cancelled=true"

        var body: [String: Any] = [
            "productId": product.id,
            "userId": userId,
            "successUrl": returnUrl,
            "cancelUrl": cancelUrl,
            "locale": Locale.current.language.languageCode?.identifier ?? "de",
        ]
        if let email = userEmail {
            body["userEmail"] = email
        }

        let session: CheckoutSessionResponse = try await network.post(
            "/checkout/create",
            body: body
        )

        guard let checkoutURL = URL(string: session.checkoutUrl) else {
            throw EuroPayError.networkError(
                NSError(domain: "EuroPayKit", code: -1, userInfo: [
                    NSLocalizedDescriptionKey: "Invalid checkout URL"
                ])
            )
        }

        // 4. Open checkout (returns when user comes back via Universal Link)
        let result = try await CheckoutSheet.open(
            url: checkoutURL,
            mode: config.checkoutMode,
            presenting: presenting
        )

        guard case .completed(let sessionId) = result else {
            throw EuroPayError.userCancelled
        }

        // 5. Verify entitlement
        let transaction = try await verifyAndGrantEntitlement(
            sessionId: sessionId,
            userId: userId,
            product: product
        )

        // 6. Refresh local entitlements
        await refreshEntitlements(userId: userId)

        return transaction
    }

    /// Restore/refresh entitlements from the server. Call on app launch.
    ///
    /// On success, updates ``entitlements`` and caches to Keychain.
    /// On failure, falls back to the cached entitlements.
    public func refreshEntitlements(userId: String) async {
        do {
            let remote: EntitlementsResponse = try await network.get(
                "/entitlements/\(userId)"
            )

            self.entitlements = remote.entitlements
            entitlementEngine.cache(entitlements: remote.entitlements)
        } catch {
            // Fall back to cached entitlements
            self.entitlements = entitlementEngine.cachedEntitlements()
        }
    }

    /// Check if the user has active access to a specific product.
    ///
    /// - Parameter appStoreProductId: The App Store product ID to check
    ///   (as mapped in the EuroPay dashboard)
    public func hasAccess(to appStoreProductId: String) -> Bool {
        return entitlements.contains {
            $0.appStoreProductId == appStoreProductId && $0.status == .active
        }
    }

    /// Open the Stripe Customer Portal for subscription management.
    ///
    /// The portal lets users update payment methods, cancel subscriptions,
    /// and view invoices.
    public func openCustomerPortal(
        userId: String,
        presenting: UIViewController
    ) async throws {
        let response: PortalResponse = try await network.post(
            "/portal",
            body: ["userId": userId, "returnUrl": config.returnScheme]
        )

        guard let portalURL = URL(string: response.url) else {
            throw EuroPayError.networkError(
                NSError(domain: "EuroPayKit", code: -1, userInfo: [
                    NSLocalizedDescriptionKey: "Invalid portal URL"
                ])
            )
        }

        try await CheckoutSheet.open(
            url: portalURL,
            mode: .inAppSafari,
            presenting: presenting
        )
    }

    // MARK: - Private

    private func verifyAndGrantEntitlement(
        sessionId: String,
        userId: String,
        product: EuroPayProduct
    ) async throws -> EuroPayTransaction {
        // Poll for entitlement (webhook processing may take a moment)
        for attempt in 1...5 {
            let response: EntitlementsResponse = try await network.get(
                "/entitlements/\(userId)"
            )

            if response.entitlements.contains(where: { $0.productId == product.id }) {
                return EuroPayTransaction(
                    id: sessionId,
                    productId: product.id,
                    status: .succeeded,
                    timestamp: Date()
                )
            }

            if attempt < 5 {
                try await Task.sleep(nanoseconds: UInt64(attempt) * 1_000_000_000)
            }
        }

        throw EuroPayError.verificationTimeout
    }
}

// MARK: - Region Check Result

/// The result of a region check via ``EuroPayKit/checkRegion()``.
public enum RegionCheckResult: Sendable {
    /// The user is in an EU App Store region — EuroPay purchases are available.
    case supported
    /// The user is NOT in the EU — fall back to native StoreKit for purchases.
    case notSupported
}

// MARK: - Error Types

/// Errors that can occur during EuroPay operations.
public enum EuroPayError: LocalizedError {
    /// The user's App Store region is not in the EU.
    /// Your app should fall back to StoreKit for non-EU users.
    case regionNotSupported

    /// The user cancelled the purchase (dismissed disclosure or checkout).
    case userCancelled

    /// Could not verify the purchase after payment.
    /// The entitlement may still be granted — check again later.
    case verificationTimeout

    /// A network error occurred.
    case networkError(Error)

    /// The requested product was not found.
    case invalidProduct

    public var errorDescription: String? {
        switch self {
        case .regionNotSupported:
            return "EuroPay is only available in the EU App Store. This user's storefront is outside the EU."
        case .userCancelled:
            return "Purchase cancelled"
        case .verificationTimeout:
            return "Could not verify purchase. Please check your entitlements."
        case .networkError(let e):
            return "Network error: \(e.localizedDescription)"
        case .invalidProduct:
            return "Product not found"
        }
    }

    public var recoverySuggestion: String? {
        switch self {
        case .regionNotSupported:
            return "Use StoreKit to process this purchase instead. Catch this error and call your StoreKit purchase flow."
        case .verificationTimeout:
            return "Call refreshEntitlements(userId:) later to check if the entitlement was granted."
        default:
            return nil
        }
    }
}
