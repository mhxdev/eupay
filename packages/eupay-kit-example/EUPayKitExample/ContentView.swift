import SwiftUI
import EUPayKit

struct ContentView: View {
    @ObservedObject private var euPay = EUPayKit.shared!
    @State private var products: [EUPayProduct] = []
    @State private var regionStatus: RegionCheckResult?
    @State private var alertMessage: String?
    @State private var showAlert = false
    @State private var purchasedProductId: String?
    @State private var userId = "demo_user_1"

    var body: some View {
        NavigationStack {
            List {
                regionSection
                entitlementSection
                productSection
                portalSection
            }
            .navigationTitle("EUPayKit Demo")
            .task { await setup() }
            .refreshable { await setup() }
            .alert("EUPayKit", isPresented: $showAlert) {
                Button("OK") {}
            } message: {
                Text(alertMessage ?? "")
            }
        }
    }

    // MARK: - Sections

    private var regionSection: some View {
        Section("Region Status") {
            HStack {
                Image(systemName: regionIcon)
                    .foregroundStyle(regionColor)
                VStack(alignment: .leading) {
                    Text(regionTitle)
                        .font(.headline)
                    Text(regionSubtitle)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
        }
    }

    private var entitlementSection: some View {
        Section("Entitlements") {
            if euPay.entitlements.isEmpty {
                Label("No active entitlements", systemImage: "lock")
                    .foregroundStyle(.secondary)
            } else {
                ForEach(euPay.entitlements) { entitlement in
                    HStack {
                        Image(systemName: "checkmark.seal.fill")
                            .foregroundStyle(.green)
                        VStack(alignment: .leading) {
                            Text(entitlement.productId)
                                .font(.headline)
                            Text(entitlement.status.rawValue)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                            if let end = entitlement.currentPeriodEnd {
                                Text("Renews: \(end.formatted(date: .abbreviated, time: .omitted))")
                                    .font(.caption2)
                                    .foregroundStyle(.secondary)
                            }
                        }
                    }
                }
            }
        }
    }

    private var productSection: some View {
        Section("Products") {
            if euPay.isLoading {
                ProgressView("Processing...")
            }
            if products.isEmpty && !euPay.isLoading {
                Label("No products loaded", systemImage: "cart")
                    .foregroundStyle(.secondary)
            }
            ForEach(products) { product in
                Button {
                    Task { await purchase(product) }
                } label: {
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(product.name)
                                .font(.headline)
                                .foregroundStyle(.primary)
                            if let desc = product.description {
                                Text(desc)
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                            HStack(spacing: 8) {
                                Text(product.productType == .subscription ? "Subscription" : "One-time")
                                    .font(.caption2)
                                    .padding(.horizontal, 6)
                                    .padding(.vertical, 2)
                                    .background(.blue.opacity(0.1))
                                    .clipShape(Capsule())
                                if product.trialDays > 0 {
                                    Text("\(product.trialDays)-day trial")
                                        .font(.caption2)
                                        .padding(.horizontal, 6)
                                        .padding(.vertical, 2)
                                        .background(.green.opacity(0.1))
                                        .clipShape(Capsule())
                                }
                            }
                        }
                        Spacer()
                        Text(product.formattedPrice)
                            .font(.title3)
                            .fontWeight(.semibold)
                            .foregroundStyle(.primary)
                    }
                    .padding(.vertical, 4)
                }
                .disabled(euPay.isLoading || purchasedProductId == product.id)
            }
        }
    }

    private var portalSection: some View {
        Section("Account") {
            Button {
                Task { await openPortal() }
            } label: {
                Label("Manage Subscription", systemImage: "person.crop.circle")
            }
            .disabled(euPay.entitlements.isEmpty)
        }
    }

    // MARK: - Computed Properties

    private var regionIcon: String {
        switch regionStatus {
        case .supported: return "checkmark.circle.fill"
        case .notSupported: return "xmark.circle.fill"
        case nil: return "questionmark.circle"
        }
    }

    private var regionColor: Color {
        switch regionStatus {
        case .supported: return .green
        case .notSupported: return .orange
        case nil: return .gray
        }
    }

    private var regionTitle: String {
        switch regionStatus {
        case .supported: return "EU App Store Detected"
        case .notSupported: return "Non-EU Region"
        case nil: return "Checking Region..."
        }
    }

    private var regionSubtitle: String {
        switch regionStatus {
        case .supported: return "EUPay alternative payments available"
        case .notSupported: return "StoreKit fallback will be used"
        case nil: return "Detecting storefront via StoreKit 2"
        }
    }

    // MARK: - Actions

    private func setup() async {
        regionStatus = await euPay.checkRegion()
        await euPay.refreshEntitlements(userId: userId)
        do {
            products = try await euPay.fetchProducts()
        } catch {
            showError("Failed to load products: \(error.localizedDescription)")
        }
    }

    private func purchase(_ product: EUPayProduct) async {
        guard let vc = rootViewController else {
            showError("No root view controller available")
            return
        }

        do {
            let transaction = try await euPay.purchase(
                product: product,
                userId: userId,
                presenting: vc
            )
            purchasedProductId = product.id
            showError("Purchase succeeded!\nTransaction: \(transaction.id)")

        } catch EUPayError.regionNotSupported {
            // Non-EU user — demonstrate StoreKit fallback
            await purchaseWithStoreKit(product)

        } catch EUPayError.userCancelled {
            // User dismissed — no action needed
            return

        } catch {
            showError("Purchase failed: \(error.localizedDescription)")
        }
    }

    private func purchaseWithStoreKit(_ product: EUPayProduct) async {
        guard let appStoreId = product.appStoreProductId else {
            showError("No App Store product ID mapped for StoreKit fallback")
            return
        }

        showError(
            "Region not supported for EUPay.\n\n"
            + "In production, this would trigger a StoreKit purchase for product: \(appStoreId)"
        )

        // In a real app, you would call:
        // import StoreKit
        // let storeProducts = try await Product.products(for: [appStoreId])
        // let result = try await storeProducts.first!.purchase()
        // switch result {
        // case .success(let verification):
        //     let transaction = try verification.payloadValue
        //     await transaction.finish()
        // case .userCancelled: break
        // case .pending: break
        // @unknown default: break
        // }
    }

    private func openPortal() async {
        guard let vc = rootViewController else { return }
        do {
            try await euPay.openCustomerPortal(userId: userId, presenting: vc)
        } catch {
            showError("Portal error: \(error.localizedDescription)")
        }
    }

    private func showError(_ message: String) {
        alertMessage = message
        showAlert = true
    }

    private var rootViewController: UIViewController? {
        UIApplication.shared
            .connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .flatMap(\.windows)
            .first(where: \.isKeyWindow)?
            .rootViewController
    }
}

#Preview {
    ContentView()
}
