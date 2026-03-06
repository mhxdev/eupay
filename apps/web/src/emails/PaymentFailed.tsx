import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Hr,
  Preview,
  Row,
  Column,
} from "@react-email/components"

export interface PaymentFailedEmailProps {
  appName: string
  companyName?: string
  supportEmail?: string
  customerEmail: string
  productName: string
  amountCents: number
  currency: string
  failedAt: Date
}

function fmt(cents: number, currency: string) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100)
}

export default function PaymentFailed({
  appName,
  companyName,
  supportEmail,
  productName,
  amountCents,
  currency,
  failedAt,
}: PaymentFailedEmailProps) {
  const date =
    failedAt instanceof Date ? failedAt : new Date(failedAt)

  return (
    <Html lang="en">
      <Head />
      <Preview>
        Payment failed — {appName}
      </Preview>
      <Body style={body}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={logo}>{appName}</Text>
          </Section>

          <Section style={content}>
            <Text style={heading}>Payment Failed</Text>
            <Text style={paragraph}>
              We were unable to process your payment. Please update your payment
              method to continue your subscription. If you don&apos;t update
              your payment method, your subscription may be cancelled.
            </Text>

            {/* Payment Details */}
            <Section style={infoBox}>
              <Row>
                <Column>
                  <Text style={label}>Product</Text>
                  <Text style={value}>{productName}</Text>
                </Column>
                <Column>
                  <Text style={label}>Amount</Text>
                  <Text style={value}>{fmt(amountCents, currency)}</Text>
                </Column>
              </Row>
              <Row>
                <Column>
                  <Text style={label}>Date</Text>
                  <Text style={value}>
                    {date.toLocaleDateString("de-DE")}
                  </Text>
                </Column>
              </Row>
            </Section>
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
