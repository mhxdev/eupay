# DMA Compliance

Understand the legal requirements for offering alternative payments to EU iOS users.

## Overview

The EU Digital Markets Act (DMA), Article 5(7), requires Apple to allow alternative payment processors for EU App Store users. EUPayKit implements the required compliance flows automatically, but your app must meet Apple's prerequisites.

## Apple's Requirements

Before submitting your app with EUPayKit:

1. **Enroll in Apple's alternative payments program** at developer.apple.com
2. **Request the External Purchase Link entitlement** — Apple must approve this for your app
3. **Acknowledge the Core Technology Fee** — Apple charges 3% on alternative payment transactions (vs. 30% standard)

## Mandatory Disclosure Modal

Under Apple's DMA implementation guidelines, you must display an informational modal before redirecting users to an external payment provider. EUPayKit handles this automatically via ``DMADisclosure``.

The disclosure informs users that:
- They are leaving Apple's payment system
- Apple is not responsible for the transaction
- The developer's privacy and refund policies apply
- Apple offers no buyer protection for external payments

This modal is presented in German (the primary EU market) and **cannot be dismissed without user action** — this is a legal requirement.

## EU Region Detection

EUPayKit uses StoreKit 2's `Storefront.current` to detect whether the user's App Store account is registered in one of the 27 EU member states. Alternative payments may **only** be offered to EU App Store users.

For non-EU users, ``EUPayKit/purchase(product:userId:userEmail:presenting:)`` throws ``EUPayError/regionNotSupported``. Your app should catch this error and fall back to native StoreKit:

```swift
do {
    let tx = try await euPay.purchase(product: p, userId: uid, presenting: vc)
} catch EUPayError.regionNotSupported {
    // This user is not in the EU — use StoreKit
    let products = try await Product.products(for: [p.appStoreProductId!])
    let result = try await products.first!.purchase()
    // Handle StoreKit result...
}
```

Or check proactively with ``EUPayKit/checkRegion()``:

```swift
switch await euPay.checkRegion() {
case .supported:
    showEUPayPurchaseButton()
case .notSupported:
    showStoreKitPurchaseButton()
}
```

## German Consumer Law

Under German law (§312g BGB), digital purchases carry a 14-day right of withdrawal unless the consumer waives it. EUPay handles Widerrufsrecht waiver consent in the checkout flow and confirmation email.

## GDPR

EUPay processes only the minimum data required for payment (email, Stripe Customer ID). All data is stored in EU-hosted infrastructure. The EUPay backend provides GDPR export and deletion endpoints.
