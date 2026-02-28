# ``EUPayKit``

Drop-in iOS SDK for DMA-compliant alternative in-app purchases in the EU.

## Overview

EUPayKit lets iOS developers offer Stripe-powered in-app purchases to EU App Store users under the Digital Markets Act (DMA). The SDK handles EU region detection, Apple's mandatory disclosure modal, Stripe Checkout presentation, and server-verified entitlement management.

For non-EU users, the SDK returns a clear ``EUPayError/regionNotSupported`` error so your app can seamlessly fall back to native StoreKit.

### How It Works

1. Your app calls ``EUPayKit/purchase(product:userId:userEmail:presenting:)``
2. The SDK verifies the user is in an EU App Store region via StoreKit 2
3. The mandatory DMA disclosure modal is presented
4. A Stripe Checkout session opens in SFSafariViewController
5. After payment, the SDK verifies the entitlement on your backend
6. The transaction result is returned to your app

### Requirements

- iOS 16.0+
- Swift 5.9+
- An EUPay account with API key and app ID
- Apple's External Purchase Link entitlement

## Topics

### Essentials

- <doc:GettingStarted>
- <doc:DMACompliance>
- ``EUPayKit``
- ``EUPayConfig``

### Products and Purchases

- ``EUPayProduct``
- ``EUPayTransaction``
- ``CheckoutSheet``
- ``CheckoutResult``

### Entitlements

- ``EUPayEntitlement``

### Region Detection

- ``RegionCheckResult``

### Errors

- ``EUPayError``

### UI Components

- ``EUPayCheckoutReturnHandler``
