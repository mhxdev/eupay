import Foundation

/// The result of a completed purchase.
public struct EUPayTransaction: Sendable {
    public let id: String
    public let productId: String
    public let status: Status
    public let timestamp: Date

    public enum Status: Sendable {
        case succeeded
        case pending
        case failed
    }

    public init(id: String, productId: String, status: Status, timestamp: Date) {
        self.id = id
        self.productId = productId
        self.status = status
        self.timestamp = timestamp
    }
}
