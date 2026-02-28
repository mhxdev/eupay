import SafariServices
import SwiftUI
import UIKit

/// The result of a checkout session.
public enum CheckoutResult: Sendable {
    /// Payment completed — contains the Stripe Checkout Session ID.
    case completed(sessionId: String)
    /// User cancelled the checkout.
    case cancelled
}

/// Presents the Stripe Checkout page to the user.
///
/// Supports three modes:
/// - `.inAppSafari` — SFSafariViewController (recommended default)
/// - `.externalSafari` — Opens Safari.app
/// - `.bottomSheet` — WKWebView in a sheet (Phase 2)
///
/// ## Universal Link Handling (iOS 16+)
///
/// Use the SwiftUI `onOpenURL` modifier in your app's root scene to handle
/// checkout return URLs:
///
/// ```swift
/// @main
/// struct MyApp: App {
///     var body: some Scene {
///         WindowGroup {
///             ContentView()
///                 .onOpenURL { url in
///                     CheckoutSheet.handleReturnURL(url)
///                 }
///         }
///     }
/// }
/// ```
///
/// Or use the convenience modifier:
///
/// ```swift
/// ContentView()
///     .eupayCheckoutReturnHandler()
/// ```
@MainActor
public enum CheckoutSheet {

    /// Open the checkout URL in the configured mode.
    ///
    /// Returns when the user completes payment or cancels (via Universal Link callback).
    @discardableResult
    static func open(
        url: URL,
        mode: EUPayConfig.CheckoutMode,
        presenting viewController: UIViewController
    ) async throws -> CheckoutResult {
        switch mode {
        case .inAppSafari:
            return await openInAppSafari(url: url, from: viewController)
        case .externalSafari:
            await UIApplication.shared.open(url)
            return await waitForUniversalLink()
        case .bottomSheet:
            // Phase 2: WKWebView bottom sheet
            // For now, fall back to in-app Safari
            return await openInAppSafari(url: url, from: viewController)
        }
    }

    // MARK: - In-App Safari

    private static func openInAppSafari(url: URL, from vc: UIViewController) async -> CheckoutResult {
        return await withCheckedContinuation { continuation in
            var didResume = false
            let safariVC = SFSafariViewController(url: url)
            safariVC.preferredControlTintColor = .systemBlue
            safariVC.dismissButtonStyle = .cancel

            // Listen for Universal Link return
            var observer: NSObjectProtocol?
            observer = NotificationCenter.default.addObserver(
                forName: .EUPayCheckoutReturn,
                object: nil,
                queue: .main
            ) { notification in
                guard !didResume else { return }
                didResume = true

                if let obs = observer {
                    NotificationCenter.default.removeObserver(obs)
                }

                safariVC.dismiss(animated: true) {
                    let result = notification.userInfo?["result"] as? CheckoutResult ?? .cancelled
                    continuation.resume(returning: result)
                }
            }

            // Handle user manually dismissing Safari VC
            let delegate = SafariDismissDelegate {
                guard !didResume else { return }
                didResume = true

                if let obs = observer {
                    NotificationCenter.default.removeObserver(obs)
                }

                continuation.resume(returning: .cancelled)
            }

            // Store delegate to keep it alive (associated object)
            objc_setAssociatedObject(safariVC, &AssociatedKeys.delegate, delegate, .OBJC_ASSOCIATION_RETAIN)
            safariVC.delegate = delegate

            vc.present(safariVC, animated: true)
        }
    }

    // MARK: - External Safari / Universal Link

    private static func waitForUniversalLink() async -> CheckoutResult {
        return await withCheckedContinuation { continuation in
            var didResume = false
            var observer: NSObjectProtocol?

            observer = NotificationCenter.default.addObserver(
                forName: .EUPayCheckoutReturn,
                object: nil,
                queue: .main
            ) { notification in
                guard !didResume else { return }
                didResume = true

                if let obs = observer {
                    NotificationCenter.default.removeObserver(obs)
                }

                let result = notification.userInfo?["result"] as? CheckoutResult ?? .cancelled
                continuation.resume(returning: result)
            }
        }
    }

    // MARK: - Universal Link Handler

    /// Handle a return URL from Stripe Checkout.
    ///
    /// Call this from your app's scene-based URL handler. On iOS 16+, use the
    /// SwiftUI `onOpenURL` modifier on your root view:
    ///
    /// ```swift
    /// @main
    /// struct MyApp: App {
    ///     var body: some Scene {
    ///         WindowGroup {
    ///             ContentView()
    ///                 .onOpenURL { url in
    ///                     CheckoutSheet.handleReturnURL(url)
    ///                 }
    ///         }
    ///     }
    /// }
    /// ```
    ///
    /// For UIKit scene-based apps, call from
    /// `scene(_:openURLContexts:)`:
    ///
    /// ```swift
    /// func scene(_ scene: UIScene,
    ///            openURLContexts URLContexts: Set<UIOpenURLContext>) {
    ///     guard let url = URLContexts.first?.url else { return }
    ///     CheckoutSheet.handleReturnURL(url)
    /// }
    /// ```
    ///
    /// - Parameter url: The URL received by the app (custom scheme or Universal Link)
    /// - Returns: `true` if the URL was handled by EUPayKit, `false` otherwise
    @discardableResult
    public static func handleReturnURL(_ url: URL) -> Bool {
        let components = URLComponents(url: url, resolvingAgainstBaseURL: false)
        let queryItems = components?.queryItems ?? []

        let sessionId = queryItems.first(where: { $0.name == "session" })?.value
        let cancelled = queryItems.first(where: { $0.name == "cancelled" })?.value == "true"

        // Only handle URLs that contain our expected query parameters
        guard sessionId != nil || cancelled else {
            return false
        }

        let result: CheckoutResult = cancelled
            ? .cancelled
            : .completed(sessionId: sessionId ?? "")

        NotificationCenter.default.post(
            name: .EUPayCheckoutReturn,
            object: nil,
            userInfo: ["result": result]
        )
        return true
    }
}

// MARK: - SwiftUI View Modifier

/// A SwiftUI view modifier that automatically handles EUPay checkout return URLs.
///
/// Apply this to your root view instead of manually wiring up `onOpenURL`:
///
/// ```swift
/// @main
/// struct MyApp: App {
///     var body: some Scene {
///         WindowGroup {
///             ContentView()
///                 .eupayCheckoutReturnHandler()
///         }
///     }
/// }
/// ```
public struct EUPayCheckoutReturnHandler: ViewModifier {
    public func body(content: Content) -> some View {
        content
            .onOpenURL { url in
                CheckoutSheet.handleReturnURL(url)
            }
    }
}

extension View {
    /// Adds EUPay checkout return URL handling to this view.
    ///
    /// Attach this modifier to your root view in the `WindowGroup` scene.
    /// It automatically calls ``CheckoutSheet/handleReturnURL(_:)`` when the
    /// app receives a URL via the scene-based `onOpenURL` lifecycle.
    ///
    /// ```swift
    /// ContentView()
    ///     .eupayCheckoutReturnHandler()
    /// ```
    public func eupayCheckoutReturnHandler() -> some View {
        modifier(EUPayCheckoutReturnHandler())
    }
}

// MARK: - Notification Name

extension Notification.Name {
    /// Posted when the app receives a checkout return URL.
    static let EUPayCheckoutReturn = Notification.Name("EUPayCheckoutReturn")
}

// MARK: - Safari Dismiss Delegate

private enum AssociatedKeys {
    static var delegate = "EUPaySafariDelegate"
}

/// Detects when the user taps "Done" / swipes away the SFSafariViewController.
private final class SafariDismissDelegate: NSObject, SFSafariViewControllerDelegate {
    private let onDismiss: () -> Void

    init(onDismiss: @escaping () -> Void) {
        self.onDismiss = onDismiss
        super.init()
    }

    func safariViewControllerDidFinish(_ controller: SFSafariViewController) {
        onDismiss()
    }
}
