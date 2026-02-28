# Getting Started

Integrate EUPayKit into your iOS app in under 15 minutes.

## Overview

This guide walks you through adding EUPayKit to your project, configuring the SDK, handling checkout return URLs, and making your first purchase.

## Add the Package

Add EUPayKit via Swift Package Manager in Xcode:

1. Go to **File > Add Package Dependencies...**
2. Enter `https://github.com/eupay-io/eupay-kit`
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
    <string>applinks:eupay.io</string>
</array>
```

Also register a URL scheme in **Targets > Info > URL Types** (e.g., `eupay-myapp`).

## Initialize the SDK

Configure EUPayKit once at app launch:

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
                .eupayCheckoutReturnHandler()
        }
    }
}
```

The ``SwiftUI/View/eupayCheckoutReturnHandler()`` modifier handles checkout return URLs automatically via the iOS 16+ scene-based `onOpenURL` lifecycle.

## Make a Purchase

```swift
let euPay = EUPayKit.shared!

do {
    let products = try await euPay.fetchProducts()
    let transaction = try await euPay.purchase(
        product: products[0],
        userId: "user_123",
        presenting: viewController
    )
    print("Success: \(transaction.id)")
} catch EUPayError.regionNotSupported {
    // Fall back to StoreKit for non-EU users
} catch EUPayError.userCancelled {
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
- See ``EUPayKit`` for the full API reference
- Check ``EUPayError`` for all error cases and recovery strategies
