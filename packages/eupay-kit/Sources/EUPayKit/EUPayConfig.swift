import Foundation

/// Configuration for the EuroPay SDK.
///
/// Create this once at app launch and pass it to ``EuroPayKit/configure(_:)``.
public struct EuroPayConfig {
    /// Your EuroPay API key (publishable — safe to include in app)
    public let apiKey: String

    /// Your EuroPay app ID (from the dashboard)
    public let appId: String

    /// Base URL of EuroPay backend (defaults to production)
    public let baseURL: URL

    /// Your app's Universal Link scheme for checkout callbacks
    /// e.g. "europay-myapp://return" — must be registered in Associated Domains
    public let returnScheme: String

    /// Whether to show the checkout in an embedded bottom sheet
    /// or an external Safari browser (external recommended for DMA compliance)
    public let checkoutMode: CheckoutMode

    public enum CheckoutMode {
        /// WKWebView in a sheet (more native feel)
        case bottomSheet
        /// Opens Safari app (maximum compatibility)
        case externalSafari
        /// SFSafariViewController (recommended default)
        case inAppSafari
    }

    public init(
        apiKey: String,
        appId: String,
        baseURL: URL = URL(string: "https://api.europay.io")!,
        returnScheme: String,
        checkoutMode: CheckoutMode = .inAppSafari
    ) {
        self.apiKey = apiKey
        self.appId = appId
        self.baseURL = baseURL
        self.returnScheme = returnScheme
        self.checkoutMode = checkoutMode
    }
}
