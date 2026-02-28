import Foundation

/// URLSession-based network client for communicating with the EUPay backend.
///
/// Zero external dependencies — uses only Foundation's URLSession.
/// All requests include the API key as a Bearer token.
final class NetworkClient: Sendable {
    private let baseURL: URL
    private let apiKey: String
    private let session: URLSession
    private let decoder: JSONDecoder

    init(config: EUPayConfig) {
        self.baseURL = config.baseURL
        self.apiKey = config.apiKey

        let urlConfig = URLSessionConfiguration.default
        urlConfig.timeoutIntervalForRequest = 30
        urlConfig.timeoutIntervalForResource = 60
        self.session = URLSession(configuration: urlConfig)

        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        self.decoder = decoder
    }

    /// Perform a GET request and decode the response.
    func get<T: Decodable>(_ path: String) async throws -> T {
        let url = baseURL.appendingPathComponent("/api/v1\(path)")
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Accept")

        let (data, response) = try await session.data(for: request)
        try validateResponse(response, data: data)
        return try decoder.decode(T.self, from: data)
    }

    /// Perform a POST request with a JSON body and decode the response.
    func post<T: Decodable>(_ path: String, body: [String: Any]) async throws -> T {
        let url = baseURL.appendingPathComponent("/api/v1\(path)")
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("application/json", forHTTPHeaderField: "Accept")

        // Filter out nil values before serialization
        let filteredBody = body.compactMapValues { value -> Any? in
            if case Optional<Any>.none = value { return nil }
            return value
        }
        request.httpBody = try JSONSerialization.data(withJSONObject: filteredBody)

        let (data, response) = try await session.data(for: request)
        try validateResponse(response, data: data)
        return try decoder.decode(T.self, from: data)
    }

    private func validateResponse(_ response: URLResponse, data: Data) throws {
        guard let httpResponse = response as? HTTPURLResponse else {
            throw EUPayError.networkError(
                NSError(domain: "EUPayKit", code: -1, userInfo: [
                    NSLocalizedDescriptionKey: "Invalid response"
                ])
            )
        }

        guard (200...299).contains(httpResponse.statusCode) else {
            // Try to parse error message from response body
            let errorMessage: String
            if let apiError = try? JSONDecoder().decode(APIErrorResponse.self, from: data) {
                errorMessage = apiError.error
            } else {
                errorMessage = "HTTP \(httpResponse.statusCode)"
            }
            throw EUPayError.networkError(
                NSError(domain: "EUPayKit", code: httpResponse.statusCode, userInfo: [
                    NSLocalizedDescriptionKey: errorMessage
                ])
            )
        }
    }
}

// MARK: - Internal Response Types

/// API error response shape from the EUPay backend.
private struct APIErrorResponse: Decodable {
    let error: String
    let code: String?
}

/// Response from POST /api/v1/checkout/create
struct CheckoutSessionResponse: Decodable {
    let sessionId: String
    let checkoutUrl: String
    let expiresAt: String
}

/// Response from GET /api/v1/entitlements/:userId
struct EntitlementsResponse: Decodable {
    let userId: String
    let entitlements: [EUPayEntitlement]
}

/// Response from GET /api/v1/products/:appId
struct ProductsResponse: Decodable {
    let products: [EUPayProduct]
}

/// Response from POST /api/v1/portal
struct PortalResponse: Decodable {
    let url: String
}
