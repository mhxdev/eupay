# Getting Started

Integrate EuroPayKit into your iOS app in under 15 minutes.

## Overview

This guide walks you through adding EuroPayKit to your project, configuring the SDK, handling checkout return URLs, and making your first purchase.

## Add the Package

Add EuroPayKit via Swift Package Manager in Xcode:

1. Go to **File > Add Package Dependencies...**
2. Enter `https://github.com/europay-io/europay-kit`
3. Select **Up to Next Major Version** from `1.0.0`

## Configure Info.plist

Add the required entitlements:

```xml
<!-- External Purchase Link entitlement (request from Apple) -->
<key>com.apple.developer.storekit.external-purchase-link</key>
<true/>

<!-- Associated Domains for checkout return -->
<key>com.apple.developer.associated-domains</key>
<array>
    <string>applinks:europay.io</string>
</array>
```

Also register a URL scheme in **Targets > Info > URL Types** (e.g., `europay-myapp`).

## Initialize the SDK

Configure EuroPayKit once at app launch:

```swift
import SwiftUI
import EuroPayKit

@main
struct MyApp: App {
    init() {
        EuroPayKit.configure(EuroPayConfig(
            apiKey: "europay_pk_your_api_key",
            appId: "app_your_app_id",
            returnScheme: "europay-myapp://return",
            checkoutMode: .inAppSafari
        ))
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
                .europayCheckoutReturnHandler()
        }
    }
}
```

The ``SwiftUI/View/europayCheckoutReturnHandler()`` modifier handles checkout return URLs automatically via the iOS 16+ scene-based `onOpenURL` lifecycle.

## Make a Purchase

```swift
let euPay = EuroPayKit.shared!

do {
    let products = try await euPay.fetchProducts()
    let transaction = try await euPay.purchase(
        product: products[0],
        userId: "user_123",
        presenting: viewController
    )
    print("Success: \(transaction.id)")
} catch EuroPayError.regionNotSupported {
    // Fall back to StoreKit for non-EU users
} catch EuroPayError.userCancelled {
    // User dismissed — do nothing
}
```

## Check Entitlements

Restore entitlements on app launch and check access:

```swift
await euPay.refreshEntitlements(userId: "user_123")

if euPay.hasAccess(to: "com.myapp.premium") {
    // Unlock premium content
}
```

## Next Steps

- Read <doc:DMACompliance> to understand Apple's legal requirements
- See ``EuroPayKit`` for the full API reference
- Check ``EuroPayError`` for all error cases and recovery strategies
