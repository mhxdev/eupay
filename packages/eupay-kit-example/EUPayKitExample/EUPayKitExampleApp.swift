import SwiftUI
import EUPayKit

@main
struct EUPayKitExampleApp: App {
    init() {
        // Configure EUPayKit at launch.
        // Replace with your actual API key and app ID from the EUPay dashboard.
        EUPayKit.configure(EUPayConfig(
            apiKey: "eupay_pk_test_example",
            appId: "app_example_123",
            returnScheme: "eupay-example://return",
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
