import SwiftUI
import EuroPayKit

@main
struct EuroPayKitExampleApp: App {
    init() {
        // Configure EuroPayKit at launch.
        // Replace with your actual API key and app ID from the EuroPay dashboard.
        EuroPayKit.configure(EuroPayConfig(
            apiKey: "europay_pk_test_example",
            appId: "app_example_123",
            returnScheme: "europay-example://return",
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
