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

export interface DisputeAlertProps {
  to: string
  appName: string
  amount: number // cents
  currency: string
  reason: string
  disputeId: string
  transactionId: string
}

function fmt(cents: number, currency: string) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100)
}

export default function DisputeAlert({
  appName,
  amount,
  currency,
  reason,
  disputeId,
  transactionId,
}: DisputeAlertProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>
        Dispute opened on {appName} — {fmt(amount, currency)}
      </Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logo}>EuroPay</Text>
          </Section>

          <Section style={content}>
            <Text style={heading}>Dispute Opened</Text>
            <Text style={paragraph}>
              A customer has opened a dispute against a charge on{" "}
              <strong>{appName}</strong>. You have <strong>7 days</strong> to
              respond with evidence via the Stripe Dashboard.
            </Text>

            <Section style={infoBox}>
              <Row>
                <Column>
                  <Text style={label}>Amount Disputed</Text>
                  <Text style={amountText}>{fmt(amount, currency)}</Text>
                </Column>
                <Column>
                  <Text style={label}>Reason</Text>
                  <Text style={value}>{reason.replace(/_/g, " ")}</Text>
                </Column>
              </Row>
              <Row>
                <Column>
                  <Text style={label}>Dispute ID</Text>
                  <Text style={monoValue}>{disputeId}</Text>
                </Column>
                <Column>
                  <Text style={label}>Transaction ID</Text>
                  <Text style={monoValue}>{transactionId}</Text>
                </Column>
              </Row>
            </Section>

            <Text style={paragraph}>
              If you do not respond within the deadline, the dispute will
              automatically be resolved in the customer&apos;s favour and the
              funds will be returned.
            </Text>

            <Section style={{ textAlign: "center" as const, marginTop: "24px" }}>
              <Link
                href="https://dashboard.stripe.com/disputes"
                style={button}
              >
                Respond in Stripe Dashboard
              </Link>
            </Section>

            <Text style={tipText}>
              Tip: Upload any receipts, delivery confirmations, or
              correspondence with the customer as evidence.
            </Text>
          </Section>

          <Section style={footer}>
            <Hr style={divider} />
            <Text style={footerText}>
              EuroPay — EU Alternative Payment Platform
            </Text>
            <Text style={footerText}>
              You are receiving this because a dispute was opened on your
              connected Stripe account.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

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
  color: "#dc2626",
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

const amountText = {
  fontSize: "20px",
  color: "#dc2626",
  fontWeight: "700" as const,
  margin: "0 0 12px",
}

const monoValue = {
  fontSize: "12px",
  color: "#0f172a",
  fontFamily: "monospace",
  margin: "0 0 12px",
  wordBreak: "break-all" as const,
}

const infoBox = {
  backgroundColor: "#fef2f2",
  border: "1px solid #fecaca",
  borderRadius: "6px",
  padding: "16px",
  marginTop: "16px",
  marginBottom: "16px",
}

const tipText = {
  fontSize: "12px",
  color: "#64748b",
  margin: "16px 0 0",
  lineHeight: "18px",
  fontStyle: "italic" as const,
}

const button = {
  backgroundColor: "#dc2626",
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

const divider = {
  borderColor: "#e2e8f0",
  margin: "0 0 16px",
}

const footerText = {
  fontSize: "12px",
  color: "#94a3b8",
  margin: "0 0 4px",
  textAlign: "center" as const,
}
