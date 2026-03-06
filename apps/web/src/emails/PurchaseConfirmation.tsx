import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Link,
  Hr,
  Preview,
  Row,
  Column,
} from "@react-email/components"

export interface PurchaseConfirmationEmailProps {
  customerName: string
  productName: string
  amountTotal: number // cents
  amountSubtotal: number // cents
  amountTax: number // cents
  vatRate: number // e.g. 0.19
  vatCountry: string // e.g. "DE"
  currency: string
  transactionId: string
  transactionDate: Date
  portalUrl: string
  isSubscription: boolean
  withdrawalWaived: boolean
  appName: string
  companyName?: string
  supportEmail?: string
}

function fmt(cents: number, currency: string) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100)
}

export default function PurchaseConfirmation({
  customerName,
  productName,
  amountTotal,
  amountSubtotal,
  amountTax,
  vatRate,
  vatCountry,
  currency,
  transactionId,
  transactionDate,
  portalUrl,
  isSubscription,
  withdrawalWaived,
  appName,
  companyName,
  supportEmail,
}: PurchaseConfirmationEmailProps) {
  const date =
    transactionDate instanceof Date
      ? transactionDate
      : new Date(transactionDate)
  const vatPct = Math.round(vatRate * 100)

  return (
    <Html lang="en">
      <Head />
      <Preview>
        Your receipt from {appName} — {fmt(amountTotal, currency)}
      </Preview>
      <Body style={body}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={logo}>{appName}</Text>
          </Section>

          <Section style={content}>
            <Text style={heading}>Payment Receipt</Text>
            <Text style={paragraph}>Hi {customerName},</Text>
            <Text style={paragraph}>
              Thank you for your purchase. Here are your receipt details:
            </Text>

            {/* Transaction Info */}
            <Section style={infoBox}>
              <Row>
                <Column>
                  <Text style={label}>Transaction ID</Text>
                  <Text style={value}>{transactionId}</Text>
                </Column>
                <Column>
                  <Text style={label}>Date</Text>
                  <Text style={value}>{date.toLocaleDateString("de-DE")}</Text>
                </Column>
              </Row>
              <Row>
                <Column>
                  <Text style={label}>Product</Text>
                  <Text style={value}>{productName}</Text>
                </Column>
                <Column>
                  <Text style={label}>Type</Text>
                  <Text style={value}>
                    {isSubscription ? "Subscription" : "One-time purchase"}
                  </Text>
                </Column>
              </Row>
            </Section>

            {/* VAT Invoice Breakdown */}
            <Text style={subheading}>Invoice Details</Text>
            <Section style={invoiceTable}>
              <Row style={invoiceRow}>
                <Column style={invoiceLabelCol}>
                  <Text style={invoiceLabel}>Subtotal</Text>
                </Column>
                <Column style={invoiceValueCol}>
                  <Text style={invoiceValue}>
                    {fmt(amountSubtotal, currency)}
                  </Text>
                </Column>
              </Row>
              <Row style={invoiceRow}>
                <Column style={invoiceLabelCol}>
                  <Text style={invoiceLabel}>
                    VAT ({vatPct}%{vatCountry ? ` — ${vatCountry}` : ""})
                  </Text>
                </Column>
                <Column style={invoiceValueCol}>
                  <Text style={invoiceValue}>{fmt(amountTax, currency)}</Text>
                </Column>
              </Row>
              <Hr style={divider} />
              <Row style={invoiceRow}>
                <Column style={invoiceLabelCol}>
                  <Text style={invoiceTotalLabel}>Total</Text>
                </Column>
                <Column style={invoiceValueCol}>
                  <Text style={invoiceTotalValue}>
                    {fmt(amountTotal, currency)}
                  </Text>
                </Column>
              </Row>
            </Section>

            {/* Widerrufsrecht notice */}
            {withdrawalWaived && (
              <Section style={noticeBox}>
                <Text style={noticeText}>
                  Sie haben auf Ihr 14-tägiges Widerrufsrecht gemäß § 356 Abs.
                  5 BGB verzichtet. / You have waived your 14-day right of
                  withdrawal.
                </Text>
              </Section>
            )}

            {/* Manage subscription button */}
            {isSubscription && portalUrl && (
              <Section style={{ textAlign: "center" as const, marginTop: "24px" }}>
                <Link href={portalUrl} style={button}>
                  Manage Subscription
                </Link>
              </Section>
            )}
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Hr style={footerDivider} />
            <Text style={footerText}>
              This purchase was made from {appName}
              {companyName ? ` by ${companyName}` : ""}.
            </Text>
            {supportEmail && (
              <Text style={footerText}>
                For questions about your purchase, contact {supportEmail}.
              </Text>
            )}
            <Text style={footerText}>
              Payment processed securely via Stripe.
            </Text>
            <Text style={footerText}>
              This email was sent by EuroPay, a payment facilitator, on behalf
              of {appName}.
            </Text>
            <Text style={footerSubtext}>
              This email serves as your VAT receipt for tax purposes.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// ── Styles ──────────────────────────────────────────────────

const body = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
}

const container = {
  maxWidth: "580px",
  margin: "0 auto",
  backgroundColor: "#ffffff",
  borderRadius: "8px",
  overflow: "hidden" as const,
}

const header = {
  backgroundColor: "#0f172a",
  padding: "24px 32px",
}

const logo = {
  color: "#ffffff",
  fontSize: "24px",
  fontWeight: "700" as const,
  margin: "0",
}

const content = {
  padding: "32px",
}

const heading = {
  fontSize: "22px",
  fontWeight: "600" as const,
  color: "#0f172a",
  margin: "0 0 16px",
}

const subheading = {
  fontSize: "16px",
  fontWeight: "600" as const,
  color: "#0f172a",
  margin: "24px 0 12px",
}

const paragraph = {
  fontSize: "14px",
  lineHeight: "24px",
  color: "#334155",
  margin: "0 0 12px",
}

const label = {
  fontSize: "11px",
  color: "#94a3b8",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
  margin: "0 0 2px",
}

const value = {
  fontSize: "14px",
  color: "#0f172a",
  fontWeight: "500" as const,
  margin: "0 0 12px",
}

const infoBox = {
  backgroundColor: "#f8fafc",
  borderRadius: "6px",
  padding: "16px",
  marginTop: "16px",
}

const invoiceTable = {
  marginTop: "8px",
}

const invoiceRow = {
  marginBottom: "4px",
}

const invoiceLabelCol = {
  width: "70%",
}

const invoiceValueCol = {
  width: "30%",
  textAlign: "right" as const,
}

const invoiceLabel = {
  fontSize: "14px",
  color: "#64748b",
  margin: "0 0 8px",
}

const invoiceValue = {
  fontSize: "14px",
  color: "#0f172a",
  margin: "0 0 8px",
  textAlign: "right" as const,
}

const invoiceTotalLabel = {
  fontSize: "14px",
  fontWeight: "600" as const,
  color: "#0f172a",
  margin: "8px 0 0",
}

const invoiceTotalValue = {
  fontSize: "16px",
  fontWeight: "700" as const,
  color: "#0f172a",
  margin: "8px 0 0",
  textAlign: "right" as const,
}

const divider = {
  borderColor: "#e2e8f0",
  margin: "8px 0",
}

const noticeBox = {
  backgroundColor: "#fefce8",
  border: "1px solid #fde68a",
  borderRadius: "6px",
  padding: "12px 16px",
  marginTop: "20px",
}

const noticeText = {
  fontSize: "12px",
  color: "#92400e",
  margin: "0",
  lineHeight: "18px",
}

const button = {
  backgroundColor: "#0f172a",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "600" as const,
  textDecoration: "none",
  padding: "12px 24px",
  borderRadius: "6px",
  display: "inline-block",
}

const footer = {
  padding: "24px 32px",
  backgroundColor: "#f8fafc",
}

const footerDivider = {
  borderColor: "#e2e8f0",
  margin: "0 0 16px",
}

const footerText = {
  fontSize: "12px",
  color: "#94a3b8",
  margin: "0 0 4px",
  textAlign: "center" as const,
}

const footerSubtext = {
  fontSize: "11px",
  color: "#94a3b8",
  margin: "8px 0 0",
  textAlign: "center" as const,
}
