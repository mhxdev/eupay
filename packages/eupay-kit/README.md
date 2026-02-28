# EUPayKit

Drop-in iOS SDK for DMA-compliant alternative in-app purchases in the EU. Powered by Stripe.

[![Swift 5.9+](https://img.shields.io/badge/Swift-5.9+-orange.svg)](https://swift.org)
[![iOS 16+](https://img.shields.io/badge/iOS-16+-blue.svg)](https://developer.apple.com/ios/)
[![SPM Compatible](https://img.shields.io/badge/SPM-Compatible-brightgreen.svg)](https://swift.org/package-manager/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

EUPayKit handles EU region detection, Apple's mandatory DMA disclosure, Stripe Checkout presentation, and entitlement management — so you can offer alternative payments to EU users in under 15 minutes.

## Features

- **EU Region Detection** — Automatically detects EU App Store users via StoreKit 2
- **DMA Compliance** — Built-in disclosure modal required by Apple under DMA Article 5(7)
- **Stripe Checkout** — Presents Stripe-hosted checkout via SFSafariViewController
- **Entitlement Management** — Server-verified entitlements with Keychain-backed offline cache
- **StoreKit Fallback** — Clear `.regionNotSupported` error for non-EU users so you can fall back to native StoreKit
- **Zero Dependencies** — Uses only Foundation, StoreKit, UIKit, and SafariServices

## Requirements

- iOS 16.0+
- Swift 5.9+
- Xcode 15+
- An [EUPay](https://eupay.io) account with API key and app ID

## Installation

### Swift Package Manager

Add EUPayKit to your project in Xcode:

1. **File > Add Package Dependencies...**
2. Enter the repository URL:
   ```
   https://github.com/eupay-io/eupay-kit
   ```
3. Select **Up to Next Major Version** from `1.0.0`
4. Click **Add Package**

Or add it to your `Package.swift`:

```swift
dependencies: [
    .package(url: "https://github.com/eupay-io/eupay-kit", from: "1.0.0")
]
```

## Quick Start (15 Minutes)

### Step 1: Configure Info.plist

Add the required entitlements to your app's `Info.plist`:

```xml
<!-- Required: External Purchase Link entitlement (request from Apple) -->
<key>com.apple.developer.storekit.external-purchase-link</key>
<true/>

<!-- Required: Associated Domains for checkout return URL -->
<key>com.apple.developer.associated-domains</key>
<array>
    <string>applinks:eupay.io</string>
</array>
```

> **Important:** You must request the External Purchase Link entitlement from Apple through your developer account. This is required under Apple's DMA alternative payments program.

### Step 2: Register a URL Scheme

In your Xcode project under **Targets > Info > URL Types**, add a custom URL scheme (e.g., `eupay-myapp`). This is used for checkout return callbacks.

### Step 3: Configure the SDK

Initialize EUPayKit once at app launch:

```swift
import SwiftUI
import EUPayKit

@main
struct MyApp: App {
    init() {
        EUPayKit.configure(EUPayConfig(
            apiKey: "eupay_pk_your_api_key",
            appId: "app_your_app_id",
            returnScheme: "eupay-myapp://return",
            checkoutMode: .inAppSafari
        ))
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
                .onOpenURL { url in
                    CheckoutSheet.handleReturnURL(url)
                }
        }
    }
}
```

### Step 4: Fetch Products and Purchase

```swift
import SwiftUI
import EUPayKit

struct StoreView: View {
    @ObservedObject private var euPay = EUPayKit.shared!
    @State private var products: [EUPayProduct] = []
    @State private var error: String?

    var body: some View {
        List(products) { product in
            Button {
                Task { await purchase(product) }
            } label: {
                HStack {
                    VStack(alignment: .leading) {
                        Text(product.name)
                            .font(.headline)
                        if let desc = product.description {
                            Text(desc)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }
                    Spacer()
                    Text(product.formattedPrice)
                        .font(.headline)
                }
            }
        }
        .task { await loadProducts() }
    }

    private func loadProducts() async {
        do {
            products = try await euPay.fetchProducts()
        } catch {
            self.error = error.localizedDescription
        }
    }

    private func purchase(_ product: EUPayProduct) async {
        do {
            let rootVC = UIApplication.shared
                .connectedScenes
                .compactMap { $0 as? UIWindowScene }
                .flatMap(\.windows)
                .first(where: \.isKeyWindow)?
                .rootViewController

            guard let vc = rootVC else { return }

            let transaction = try await euPay.purchase(
                product: product,
                userId: "user_123",
                presenting: vc
            )
            print("Purchase succeeded: \(transaction.id)")

        } catch EUPayError.regionNotSupported {
            // Non-EU user — fall back to StoreKit
            await purchaseWithStoreKit(product)

        } catch EUPayError.userCancelled {
            // User dismissed — do nothing

        } catch {
            self.error = error.localizedDescription
        }
    }

    private func purchaseWithStoreKit(_ product: EUPayProduct) async {
        // Your StoreKit 2 purchase logic here
        guard let appStoreId = product.appStoreProductId else { return }
        // let storeProducts = try? await Product.products(for: [appStoreId])
        // ...
    }
}
```

### Step 5: Check Entitlements

```swift
// Restore entitlements on app launch
Task {
    await EUPayKit.shared?.refreshEntitlements(userId: "user_123")
}

// Check access anywhere in your app
if EUPayKit.shared?.hasAccess(to: "com.myapp.premium") == true {
    showPremiumContent()
}
```

## Universal Link Handling

EUPayKit uses URL callbacks to detect when a user returns from Stripe Checkout. Register the handler in your SwiftUI app's `WindowGroup`:

```swift
@main
struct MyApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
                .onOpenURL { url in
                    CheckoutSheet.handleReturnURL(url)
                }
        }
    }
}
```

For UIKit apps using `UISceneDelegate`:

```swift
func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
    guard let url = URLContexts.first?.url else { return }
    CheckoutSheet.handleReturnURL(url)
}
```

## StoreKit Fallback

EUPayKit only works for EU App Store users (DMA requirement). For non-EU users, the SDK throws `.regionNotSupported` so you can seamlessly fall back to native StoreKit:

```swift
do {
    let transaction = try await euPay.purchase(
        product: product,
        userId: userId,
        presenting: viewController
    )
} catch EUPayError.regionNotSupported {
    // User is not in the EU — use Apple's native StoreKit
    let storeProducts = try await Product.products(for: [product.appStoreProductId!])
    let result = try await storeProducts.first!.purchase()
    // Handle StoreKit result...
}
```

You can also check the region proactively before showing any EU-specific UI:

```swift
let isEU = await euPay.isEUUser()
if isEU {
    showEUPayPurchaseButton()
} else {
    showStoreKitPurchaseButton()
}
```

## Customer Portal

Let users manage their subscriptions, update payment methods, and view invoices:

```swift
try await euPay.openCustomerPortal(
    userId: "user_123",
    presenting: viewController
)
```

## API Reference

### EUPayKit

| Method | Description |
|--------|-------------|
| `configure(_:)` | Initialize the SDK (call once at launch) |
| `isEUUser()` | Check if user is in an EU App Store region |
| `fetchProducts()` | Fetch your product catalog |
| `purchase(product:userId:userEmail:presenting:)` | Start a purchase flow |
| `refreshEntitlements(userId:)` | Sync entitlements from server |
| `hasAccess(to:)` | Check if user has active access to a product |
| `openCustomerPortal(userId:presenting:)` | Open Stripe Customer Portal |

### EUPayConfig

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `apiKey` | `String` | — | Your EUPay publishable API key |
| `appId` | `String` | — | Your EUPay app ID |
| `baseURL` | `URL` | `https://api.eupay.io` | API base URL |
| `returnScheme` | `String` | — | URL scheme for checkout callbacks |
| `checkoutMode` | `CheckoutMode` | `.inAppSafari` | How to present checkout |

### EUPayError

| Case | Description |
|------|-------------|
| `.regionNotSupported` | User's App Store is not in the EU — fall back to StoreKit |
| `.userCancelled` | User dismissed the disclosure or checkout |
| `.verificationTimeout` | Could not verify purchase (may still be processing) |
| `.networkError(Error)` | Network request failed |
| `.invalidProduct` | Product not found |

### EUPayProduct

| Property | Type | Description |
|----------|------|-------------|
| `id` | `String` | EUPay product ID |
| `name` | `String` | Display name |
| `description` | `String?` | Product description |
| `productType` | `.oneTime` / `.subscription` | Product type |
| `appStoreProductId` | `String?` | Mapped App Store product ID (for StoreKit fallback) |
| `formattedPrice` | `String` | Localized price string (e.g., "9,99 \u20ac") |
| `trialDays` | `Int` | Free trial duration |

### EUPayEntitlement

| Property | Type | Description |
|----------|------|-------------|
| `id` | `String` | Entitlement ID |
| `productId` | `String` | Associated product ID |
| `status` | `.active` / `.expired` / `.cancelled` / `.paused` | Current status |
| `isActive` | `Bool` | Whether this entitlement grants access right now |
| `currentPeriodEnd` | `Date?` | When current billing period ends |
| `cancelAtPeriodEnd` | `Bool` | Whether subscription cancels at period end |

## Apple DMA Program Requirements

Before submitting your app, ensure you have:

1. **Enrolled in Apple's alternative payments program** at [developer.apple.com](https://developer.apple.com)
2. **Requested the External Purchase Link entitlement** from Apple
3. **Added Associated Domains** in your app's capabilities for `applinks:eupay.io`
4. **Registered a URL scheme** for checkout return callbacks
5. **Acknowledged the 3% Core Technology Fee** Apple charges on alternative payment transactions

## Architecture

```
┌──────────────────────────────────────┐
│           Your iOS App               │
│  ┌────────────────────────────────┐  │
│  │         EUPayKit SDK           │  │
│  │  - EU detection (StoreKit 2)  │  │
│  │  - DMA disclosure modal       │  │
│  │  - SFSafariViewController     │  │
│  │  - Entitlement cache          │  │
│  └──────────────┬─────────────────┘  │
└─────────────────┼────────────────────┘
                  │ HTTPS
┌─────────────────▼────────────────────┐
│        EUPay Backend API             │
│  - Stripe Checkout Sessions          │
│  - Entitlement management            │
│  - Webhook processing                │
└──────────────────────────────────────┘
```

## License

MIT License. See [LICENSE](LICENSE) for details.
