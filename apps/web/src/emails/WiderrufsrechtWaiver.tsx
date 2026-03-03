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

export interface WiderrufsrechtWaiverEmailProps {
  customerName: string
  productName: string
  transactionId: string
  transactionDate: Date
  amountTotal: number // cents
  currency: string
}

function fmt(cents: number, currency: string) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100)
}

export default function WiderrufsrechtWaiver({
  customerName,
  productName,
  transactionId,
  transactionDate,
  amountTotal,
  currency,
}: WiderrufsrechtWaiverEmailProps) {
  const date =
    transactionDate instanceof Date
      ? transactionDate
      : new Date(transactionDate)

  return (
    <Html lang="de">
      <Head />
      <Preview>
        Bestätigung: Verzicht auf Ihr Widerrufsrecht — {productName}
      </Preview>
      <Body style={body}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={logo}>EuroPay</Text>
          </Section>

          <Section style={content}>
            <Text style={heading}>
              Bestätigung: Verzicht auf Ihr Widerrufsrecht
            </Text>

            <Text style={paragraph}>Sehr geehrte/r {customerName},</Text>

            <Text style={paragraph}>
              hiermit bestätigen wir, dass Sie beim Kauf des folgenden Produkts
              ausdrücklich auf Ihr gesetzliches Widerrufsrecht verzichtet haben:
            </Text>

            {/* Purchase Reference */}
            <Section style={infoBox}>
              <Row>
                <Column>
                  <Text style={label}>Produkt</Text>
                  <Text style={value}>{productName}</Text>
                </Column>
                <Column>
                  <Text style={label}>Betrag</Text>
                  <Text style={value}>{fmt(amountTotal, currency)}</Text>
                </Column>
              </Row>
              <Row>
                <Column>
                  <Text style={label}>Transaktions-ID</Text>
                  <Text style={value}>{transactionId}</Text>
                </Column>
                <Column>
                  <Text style={label}>Kaufdatum</Text>
                  <Text style={value}>{date.toLocaleDateString("de-DE")}</Text>
                </Column>
              </Row>
            </Section>

            <Hr style={divider} />

            {/* Legal Text (German) */}
            <Text style={legalHeading}>Rechtsbelehrung</Text>

            <Text style={legalText}>
              Sie haben beim Kauf ausdrücklich zugestimmt, dass die Ausführung
              des Vertrags über die Bereitstellung digitaler Inhalte vor Ablauf
              der Widerrufsfrist beginnt, und haben bestätigt, dass Sie damit Ihr
              14-tägiges Widerrufsrecht gemäß § 356 Abs. 5 BGB verlieren.
            </Text>

            <Text style={legalText}>
              Diese Bestätigung erfolgt gemäß den Anforderungen der
              EU-Richtlinie 2011/83/EU (Verbraucherrechterichtlinie), Artikel
              16 Buchstabe m, sowie der nationalen Umsetzung in § 356 Abs. 5
              BGB.
            </Text>

            <Hr style={divider} />

            {/* English Summary */}
            <Text style={subheading}>English Summary</Text>

            <Text style={paragraph}>
              You have expressly consented to the immediate delivery of digital
              content and confirmed that you thereby lose your 14-day right of
              withdrawal in accordance with § 356(5) BGB (German Civil Code) and
              EU Directive 2011/83/EU, Article 16(m).
            </Text>

            <Text style={smallText}>
              Please retain this email for your records.
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              EuroPay — EU Alternative Payment Platform
            </Text>
            <Text style={footerText}>
              Diese E-Mail dient als rechtliche Bestätigung Ihres
              Widerrufsverzichts.
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
  fontSize: "20px",
  fontWeight: "600" as const,
  color: "#0f172a",
  margin: "0 0 16px",
}

const subheading = {
  fontSize: "16px",
  fontWeight: "600" as const,
  color: "#0f172a",
  margin: "0 0 12px",
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
  marginBottom: "16px",
}

const divider = {
  borderColor: "#e2e8f0",
  margin: "24px 0",
}

const legalHeading = {
  fontSize: "14px",
  fontWeight: "600" as const,
  color: "#0f172a",
  margin: "0 0 8px",
}

const legalText = {
  fontSize: "13px",
  lineHeight: "22px",
  color: "#475569",
  margin: "0 0 12px",
}

const smallText = {
  fontSize: "12px",
  color: "#94a3b8",
  margin: "16px 0 0",
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
