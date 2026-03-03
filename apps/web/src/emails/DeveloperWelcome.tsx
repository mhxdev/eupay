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

export interface DeveloperWelcomeProps {
  to: string
  name: string
}

export default function DeveloperWelcome({
  name,
}: DeveloperWelcomeProps) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://europay.dev"

  return (
    <Html lang="en">
      <Head />
      <Preview>Welcome to EuroPay — get started in 15 minutes</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logo}>EuroPay</Text>
          </Section>

          <Section style={content}>
            <Text style={heading}>Welcome to EuroPay</Text>
            <Text style={paragraph}>
              Hi {name || "there"},
            </Text>
            <Text style={paragraph}>
              You&apos;re all set to start accepting EU in-app purchases outside
              the App Store. EuroPay handles DMA compliance, Apple CTC reporting,
              and payment processing through Stripe — so you can focus on
              building your app.
            </Text>

            <Text style={subheading}>Get started in 3 steps</Text>

            <Section style={stepBox}>
              <Text style={stepNumber}>1</Text>
              <Text style={stepTitle}>Connect your Stripe account</Text>
              <Text style={stepDesc}>
                Link your existing Stripe account to receive payouts directly.
                Go to your app settings in the dashboard.
              </Text>
            </Section>

            <Section style={stepBox}>
              <Text style={stepNumber}>2</Text>
              <Text style={stepTitle}>Create a product</Text>
              <Text style={stepDesc}>
                Set up your first product or subscription with pricing. EuroPay
                creates the corresponding Stripe product automatically.
              </Text>
            </Section>

            <Section style={stepBox}>
              <Text style={stepNumber}>3</Text>
              <Text style={stepTitle}>Install the iOS SDK</Text>
              <Text style={stepDesc}>
                Add EuroPayKit via Swift Package Manager and use a single view
                modifier to present the checkout flow.
              </Text>
            </Section>

            <Section style={{ textAlign: "center" as const, marginTop: "28px" }}>
              <Link href={`${appUrl}/dashboard`} style={button}>
                Open Dashboard
              </Link>
            </Section>

            <Text style={linkSection}>
              <Link href={`${appUrl}/docs/getting-started`} style={link}>
                Getting Started Guide
              </Link>
              {" · "}
              <Link href={`${appUrl}/docs/integration-guide`} style={link}>
                Integration Guide
              </Link>
              {" · "}
              <Link href={`${appUrl}/docs/api-reference`} style={link}>
                API Reference
              </Link>
            </Text>
          </Section>

          <Section style={footer}>
            <Hr style={divider} />
            <Text style={footerText}>
              EuroPay — EU Alternative Payment Platform
            </Text>
            <Text style={footerText}>
              You are receiving this because you created a EuroPay account.
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
  color: "#0f172a",
  margin: "0 0 16px",
}

const subheading = {
  fontSize: "16px",
  fontWeight: "600" as const,
  color: "#0f172a",
  margin: "24px 0 16px",
}

const paragraph = {
  fontSize: "14px",
  lineHeight: "24px",
  color: "#334155",
  margin: "0 0 12px",
}

const stepBox = {
  backgroundColor: "#f8fafc",
  borderRadius: "6px",
  padding: "16px",
  marginBottom: "8px",
}

const stepNumber = {
  fontSize: "12px",
  fontWeight: "700" as const,
  color: "#14b8a6",
  margin: "0 0 4px",
}

const stepTitle = {
  fontSize: "14px",
  fontWeight: "600" as const,
  color: "#0f172a",
  margin: "0 0 4px",
}

const stepDesc = {
  fontSize: "13px",
  color: "#64748b",
  margin: "0",
  lineHeight: "20px",
}

const linkSection = {
  fontSize: "13px",
  textAlign: "center" as const,
  margin: "20px 0 0",
}

const link = {
  color: "#14b8a6",
  textDecoration: "underline",
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
