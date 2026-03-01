// GET /api/v1/compliance/pdf
// Generates a plain-text compliance summary document.
// In production this would use a PDF library; for now we return a well-formatted
// text document that developers can print to PDF or attach to App Review.
import { NextResponse } from "next/server"

export async function GET() {
  const date = new Date().toISOString().slice(0, 10)

  const content = `
================================================================================
                    EUPay — Compliance Summary Document
================================================================================

Generated: ${date}
Platform:  europay.dev
Version:   1.0

--------------------------------------------------------------------------------
1. PAYMENT SERVICE PROVIDER (PSP)
--------------------------------------------------------------------------------

PSP Name:          Stripe, Inc.
PCI DSS Level:     Level 1 Service Provider (highest certification)
Stripe Dashboard:  https://stripe.com/docs/security/stripe
                   https://stripe.com/guides/pci-compliance

EUPay does NOT handle, store, or transmit raw payment card data.
All payment processing is handled by Stripe's PCI-compliant infrastructure.

--------------------------------------------------------------------------------
2. GDPR COMPLIANCE
--------------------------------------------------------------------------------

EUPay implements the following GDPR provisions:

  - Art. 15: Right of Access — Full customer data export (JSON format)
  - Art. 17: Right to Erasure — Customer data anonymisation with financial
             record retention per GoBD (German tax law, 10 years)
  - Art. 20: Right to Data Portability — Machine-readable export
  - Data minimisation — Only essential PII collected (email, name, country)
  - Widerrufsrecht — German withdrawal right waiver tracking

Data Processing:
  - Customer data stored in PostgreSQL (Supabase, EU region)
  - Payment data processed by Stripe (PCI Level 1)
  - Transactional emails via Resend (EU data processing agreement)

--------------------------------------------------------------------------------
3. EU VAT COMPLIANCE
--------------------------------------------------------------------------------

EUPay is the Merchant of Record and handles:

  - EU VAT collection via Stripe Tax (automatic rate calculation)
  - One-Stop Shop (OSS) VAT remittance
  - Country-specific digital services VAT rates
  - VAT invoicing for all transactions

Developers using EUPay do NOT need their own EU VAT registration
for sales processed through the platform.

--------------------------------------------------------------------------------
4. APPLE DMA COMPLIANCE
--------------------------------------------------------------------------------

EUPay operates under Apple's StoreKit External Purchase Link Entitlement
for EU Apps, complying with the EU Digital Markets Act (DMA).

Requirements fulfilled:
  - ExternalPurchaseCustomLink integration in iOS SDK
  - Transaction reporting to Apple's External Purchase Server API
  - Monthly nil reports for months with zero transactions
  - 3-year transaction audit trail retention
  - Apple Core Technology Commission (CTC) of 5% acknowledged

--------------------------------------------------------------------------------
5. APP STORE REVIEW NOTES (SUGGESTED)
--------------------------------------------------------------------------------

Include the following in your App Store Connect review notes:

  "This app uses Stripe (via EUPay) as its alternative payment service
   provider under the EU Digital Markets Act External Purchase Link
   Entitlement. PSP: Stripe, Inc. PCI Level: Level 1 Service Provider.
   Platform: europay.dev"

================================================================================
                         End of Compliance Summary
================================================================================
`.trim()

  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="eupay-compliance-summary-${date}.txt"`,
    },
  })
}
