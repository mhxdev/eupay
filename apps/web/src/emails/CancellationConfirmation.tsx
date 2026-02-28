import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Hr,
  Preview,
} from "@react-email/components"

export interface CancellationConfirmationEmailProps {
  customerName: string
  productName: string
  currentPeriodEnd: Date
}

export default function CancellationConfirmation({
  customerName,
  productName,
  currentPeriodEnd,
}: CancellationConfirmationEmailProps) {
  const endDate =
    currentPeriodEnd instanceof Date
      ? currentPeriodEnd
      : new Date(currentPeriodEnd)

  return (
    <Html lang="en">
      <Head />
      <Preview>Your {productName} subscription has been cancelled</Preview>
      <Body style={body}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={logo}>EUPay</Text>
          </Section>

          <Section style={content}>
            <Text style={heading}>Subscription Cancelled</Text>

            <Text style={paragraph}>Hi {customerName},</Text>

            <Text style={paragraph}>
              Your subscription to <strong>{productName}</strong> has been
              cancelled. We&apos;re sorry to see you go.
            </Text>

            <Section style={infoBox}>
              <Text style={infoHeading}>What happens next</Text>
              <Text style={infoText}>
                You will continue to have full access until{" "}
                <strong>{endDate.toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}</strong>
                . After that date, your access will end and you will not be
                charged again.
              </Text>
            </Section>

            <Hr style={divider} />

            <Text style={smallText}>
              Changed your mind? Contact the app developer to resubscribe at any
              time.
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              EUPay — EU Alternative Payment Platform
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

const infoBox = {
  backgroundColor: "#f8fafc",
  borderRadius: "6px",
  padding: "16px 20px",
  marginTop: "16px",
}

const infoHeading = {
  fontSize: "14px",
  fontWeight: "600" as const,
  color: "#0f172a",
  margin: "0 0 8px",
}

const infoText = {
  fontSize: "14px",
  lineHeight: "22px",
  color: "#475569",
  margin: "0",
}

const divider = {
  borderColor: "#e2e8f0",
  margin: "24px 0",
}

const smallText = {
  fontSize: "13px",
  color: "#64748b",
  margin: "0",
}

const footer = {
  padding: "24px 32px",
  backgroundColor: "#f8fafc",
}

const footerText = {
  fontSize: "12px",
  color: "#94a3b8",
  margin: "0 0 4px",
  textAlign: "center" as const,
}
