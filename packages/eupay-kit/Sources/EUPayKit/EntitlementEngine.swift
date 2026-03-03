import Foundation

/// Local entitlement cache backed by Keychain.
///
/// Caches entitlements so the app can check access offline or when the
/// network request fails. Entitlements are stored securely in the Keychain.
final class EntitlementEngine {
    private let keychain = KeychainHelper()
    private let cacheKey = "europay.entitlements"

    func cache(entitlements: [EuroPayEntitlement]) {
        guard let data = try? JSONEncoder().encode(entitlements) else { return }
        keychain.save(data, forKey: cacheKey)
    }

    func cachedEntitlements() -> [EuroPayEntitlement] {
        guard let data = keychain.load(forKey: cacheKey),
              let entitlements = try? JSONDecoder().decode([EuroPayEntitlement].self, from: data) else {
            return []
        }
        return entitlements.filter { $0.isActive }
    }

    func clearCache() {
        keychain.delete(forKey: cacheKey)
    }
}

/// An active product entitlement for the current user.
public struct EuroPayEntitlement: Codable, Identifiable, Sendable {
    public let id: String
    public let productId: String
    public let appStoreProductId: String?
    public let status: Status
    public let currentPeriodEnd: Date?
    public let cancelAtPeriodEnd: Bool

    /// Whether this entitlement grants active access right now.
    public var isActive: Bool {
        if status != .active { return false }
        if let end = currentPeriodEnd { return end > Date() }
        return true  // Lifetime access
    }

    public enum Status: String, Codable, Sendable {
        case active = "ACTIVE"
        case expired = "EXPIRED"
        case cancelled = "CANCELLED"
        case paused = "PAUSED"
    }
}
