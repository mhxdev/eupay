import XCTest
@testable import EuroPayKit

final class EuroPayKitTests: XCTestCase {

    // MARK: - StoreRegion Tests

    func testEUStorefrontCodesContainsAllMemberStates() {
        // 27 EU member states
        XCTAssertEqual(StoreRegion.euStorefrontCodes.count, 27)
    }

    func testEUStorefrontCodesContainsGermany() {
        XCTAssertTrue(StoreRegion.euStorefrontCodes.contains("DEU"))
    }

    func testEUStorefrontCodesContainsFrance() {
        XCTAssertTrue(StoreRegion.euStorefrontCodes.contains("FRA"))
    }

    func testEUStorefrontCodesDoesNotContainUSA() {
        XCTAssertFalse(StoreRegion.euStorefrontCodes.contains("USA"))
    }

    func testEUStorefrontCodesDoesNotContainUK() {
        XCTAssertFalse(StoreRegion.euStorefrontCodes.contains("GBR"))
    }

    // MARK: - Entitlement Tests

    func testEntitlementIsActiveWhenStatusActive() {
        let entitlement = EuroPayEntitlement(
            id: "ent_1",
            productId: "prod_1",
            appStoreProductId: "com.test.pro",
            status: .active,
            currentPeriodEnd: Date().addingTimeInterval(86400 * 30), // 30 days
            cancelAtPeriodEnd: false
        )
        XCTAssertTrue(entitlement.isActive)
    }

    func testEntitlementIsNotActiveWhenExpired() {
        let entitlement = EuroPayEntitlement(
            id: "ent_1",
            productId: "prod_1",
            appStoreProductId: "com.test.pro",
            status: .expired,
            currentPeriodEnd: nil,
            cancelAtPeriodEnd: false
        )
        XCTAssertFalse(entitlement.isActive)
    }

    func testEntitlementIsNotActiveWhenPeriodEnded() {
        let entitlement = EuroPayEntitlement(
            id: "ent_1",
            productId: "prod_1",
            appStoreProductId: "com.test.pro",
            status: .active,
            currentPeriodEnd: Date().addingTimeInterval(-86400), // Yesterday
            cancelAtPeriodEnd: false
        )
        XCTAssertFalse(entitlement.isActive)
    }

    func testLifetimeEntitlementIsActiveWithNilPeriodEnd() {
        let entitlement = EuroPayEntitlement(
            id: "ent_1",
            productId: "prod_1",
            appStoreProductId: "com.test.pro",
            status: .active,
            currentPeriodEnd: nil,
            cancelAtPeriodEnd: false
        )
        XCTAssertTrue(entitlement.isActive)
    }

    func testCancelledEntitlementIsNotActive() {
        let entitlement = EuroPayEntitlement(
            id: "ent_1",
            productId: "prod_1",
            appStoreProductId: nil,
            status: .cancelled,
            currentPeriodEnd: Date().addingTimeInterval(86400 * 30),
            cancelAtPeriodEnd: true
        )
        XCTAssertFalse(entitlement.isActive)
    }

    // MARK: - Universal Link Parsing Tests

    @MainActor
    func testHandleReturnURLWithSessionId() {
        let expectation = expectation(forNotification: .EuroPayCheckoutReturn, object: nil) { notification in
            guard let result = notification.userInfo?["result"] as? CheckoutResult,
                  case .completed(let sessionId) = result else {
                return false
            }
            return sessionId == "cs_test_123"
        }

        let url = URL(string: "europay-myapp://return?session=cs_test_123")!
        CheckoutSheet.handleReturnURL(url)

        wait(for: [expectation], timeout: 1.0)
    }

    @MainActor
    func testHandleReturnURLWithCancellation() {
        let expectation = expectation(forNotification: .EuroPayCheckoutReturn, object: nil) { notification in
            guard let result = notification.userInfo?["result"] as? CheckoutResult,
                  case .cancelled = result else {
                return false
            }
            return true
        }

        let url = URL(string: "europay-myapp://return?cancelled=true")!
        CheckoutSheet.handleReturnURL(url)

        wait(for: [expectation], timeout: 1.0)
    }

    // MARK: - Product Tests

    func testProductFormattedPrice() {
        let product = EuroPayProduct(
            id: "prod_1",
            name: "Pro Monthly",
            description: "Monthly subscription",
            productType: .subscription,
            appStoreProductId: "com.test.pro.monthly",
            amountCents: 999,
            currency: "eur",
            interval: "month",
            intervalCount: 1,
            trialDays: 7
        )
        // German locale formats EUR as "9,99 €"
        XCTAssertTrue(product.formattedPrice.contains("9,99"))
    }

    // MARK: - Entitlement Encoding/Decoding

    func testEntitlementCodable() throws {
        let original = EuroPayEntitlement(
            id: "ent_1",
            productId: "prod_1",
            appStoreProductId: "com.test.pro",
            status: .active,
            currentPeriodEnd: Date(timeIntervalSince1970: 1700000000),
            cancelAtPeriodEnd: false
        )

        let data = try JSONEncoder().encode(original)
        let decoded = try JSONDecoder().decode(EuroPayEntitlement.self, from: data)

        XCTAssertEqual(decoded.id, original.id)
        XCTAssertEqual(decoded.productId, original.productId)
        XCTAssertEqual(decoded.status, original.status)
        XCTAssertEqual(decoded.cancelAtPeriodEnd, original.cancelAtPeriodEnd)
    }

    // MARK: - Config Tests

    func testConfigDefaultValues() {
        let config = EuroPayConfig(
            apiKey: "europay_test",
            appId: "app_123",
            returnScheme: "europay-test://return"
        )
        XCTAssertEqual(config.baseURL.absoluteString, "https://api.europay.io")
    }
}
