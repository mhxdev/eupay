# EUPayKit Example App

A minimal SwiftUI demo showing how to integrate EUPayKit into an iOS app.

## What This Demo Shows

- **SDK Configuration** — Initializing EUPayKit at app launch
- **Region Detection** — Checking if the user is in an EU App Store region
- **Product Display** — Fetching and displaying products from the EUPay catalog
- **Purchase Flow** — Triggering a Stripe Checkout purchase via EUPayKit
- **Entitlement Status** — Displaying active entitlements after purchase
- **StoreKit Fallback** — Handling `.regionNotSupported` for non-EU users
- **Customer Portal** — Opening the Stripe Customer Portal for subscription management
- **URL Handling** — Using `.eupayCheckoutReturnHandler()` for checkout return URLs

## Running the Example

### Prerequisites

- Xcode 15+
- iOS 16+ simulator or device
- An EUPay account (or use test credentials)

### Steps

1. Open `Package.swift` in Xcode:
   ```bash
   cd packages/eupay-kit-example
   open Package.swift
   ```

2. Update the API key and app ID in `EUPayKitExampleApp.swift`:
   ```swift
   EUPayKit.configure(EUPayConfig(
       apiKey: "eupay_pk_test_YOUR_KEY",
       appId: "app_YOUR_APP_ID",
       returnScheme: "eupay-example://return",
       checkoutMode: .inAppSafari
   ))
   ```

3. Add the URL scheme `eupay-example` in **Targets > Info > URL Types**

4. Build and run on an iOS 16+ simulator or device

## Project Structure

```
eupay-kit-example/
├── Package.swift                   # SPM manifest (depends on local eupay-kit)
├── README.md
└── EUPayKitExample/
    ├── EUPayKitExampleApp.swift    # App entry point + SDK configuration
    └── ContentView.swift           # Main UI with all integration examples
```

## Key Integration Patterns

### Region-Aware Purchase Button

The example checks the region before purchase and falls back to StoreKit automatically:

```swift
do {
    let tx = try await euPay.purchase(product: product, userId: uid, presenting: vc)
} catch EUPayError.regionNotSupported {
    await purchaseWithStoreKit(product)
}
```

### Checkout Return URL Handling

Uses the convenience SwiftUI modifier on the root view:

```swift
WindowGroup {
    ContentView()
        .eupayCheckoutReturnHandler()
}
```
