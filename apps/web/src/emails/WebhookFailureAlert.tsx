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
} from "@react-email/components"

export interface WebhookFailureAlertProps {
  to: string
  appName: string
  webhookUrl: string
  failureCount: number
  lastError: string
  lastAttemptAt: Date
}

export default function WebhookFailureAlert({
  appName,
  webhookUrl,
  failureCount,
  lastError,
  lastAttemptAt,
}: WebhookFailureAlertProps) {
  const attemptDate =
    lastAttemptAt instanceof Date ? lastAttemptAt : new Date(lastAttemptAt)

  return (
    <Html lang="en">
      <Head />
      <Preview>
        Your EuroPay webhook is failing — {appName}
      </Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logo}>EuroPay</Text>
          </Section>

          <Section style={content}>
            <Text style={heading}>Webhook Delivery Failing</Text>
            <Text style={paragraph}>
              Your webhook endpoint for <strong>{appName}</strong> has failed{" "}
              <strong>{failureCount} times</strong> in the last hour. Event
              delivery will continue to retry, but you may be missing critical
              updates.
            </Text>

            <Section style={infoBox}>
              <Text style={label}>Endpoint URL</Text>
              <Text style={value}>{webhookUrl}</Text>

              <Text style={label}>Last Error</Text>
              <Text style={errorText}>{lastError}</Text>

              <Text style={label}>Last Attempt</Text>
              <Text style={value}>
                {attemptDate.toLocaleString("en-GB", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </Text>
            </Section>

            <Text style={paragraph}>
              Please check that your endpoint is reachable, returns a 2xx status
              code, and responds within 5 seconds.
            </Text>

            <Section style={{ textAlign: "center" as const, marginTop: "24px" }}>
              <Link
                href={`${process.env.NEXT_PUBLIC_APP_URL ?? "https://europay.dev"}/dashboard`}
                style={button}
              >
                Open Dashboard
              </Link>
            </Section>
          </Section>

          <Section style={footer}>
            <Hr style={divider} />
            <Text style={footerText}>
              EuroPay — EU Alternative Payment Platform
            </Text>
            <Text style={footerText}>
              You are receiving this because your webhook has consecutive
              failures. This alert is sent at most once per hour.
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
  wordBreak: "break-all" as const,
}

const errorText = {
  fontSize: "13px",
  color: "#dc2626",
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
