import StoreKit

/// EU storefront detection via StoreKit 2.
///
/// Uses `Storefront.current` to determine if the user's App Store account
/// is registered in an EU member state. This is required for DMA compliance —
/// alternative payments may only be offered to EU App Store users.
enum StoreRegion {
    /// ISO 3166-1 alpha-3 codes for all 27 EU member states
    static let euStorefrontCodes: Set<String> = [
        "AUT", "BEL", "BGR", "HRV", "CYP", "CZE", "DNK", "EST", "FIN",
        "FRA", "DEU", "GRC", "HUN", "IRL", "ITA", "LVA", "LTU", "LUX",
        "MLT", "NLD", "POL", "PRT", "ROU", "SVK", "SVN", "ESP", "SWE"
    ]

    @MainActor
    static func isEUStorefront() async -> Bool {
        do {
            let storefront = try await Storefront.current
            guard let storefront = storefront else { return false }
            return euStorefrontCodes.contains(storefront.countryCode)
        } catch {
            return false
        }
    }
}
