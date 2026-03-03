import Foundation

/// A product available for purchase via EuroPay.
public struct EuroPayProduct: Codable, Identifiable, Sendable {
    public let id: String
    public let name: String
    public let description: String?
    public let productType: ProductType
    public let appStoreProductId: String?
    public let amountCents: Int
    public let currency: String
    public let interval: String?
    public let intervalCount: Int?
    public let trialDays: Int

    public enum ProductType: String, Codable, Sendable {
        case oneTime = "ONE_TIME"
        case subscription = "SUBSCRIPTION"
    }

    /// Formatted price string (e.g. "€9.99")
    public var formattedPrice: String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = currency.uppercased()
        formatter.locale = Locale(identifier: "de_DE")
        return formatter.string(from: NSNumber(value: Double(amountCents) / 100.0)) ?? "\(amountCents / 100) \(currency)"
    }
}
