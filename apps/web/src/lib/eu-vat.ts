// src/lib/eu-vat.ts
// EU VAT rate table + helpers
// Note: Stripe Tax handles actual VAT calculation. This is for reference/display.

export const EU_VAT_RATES: Record<string, { standard: number; digital: number; country: string }> = {
  AT: { standard: 0.20, digital: 0.20, country: 'Austria' },
  BE: { standard: 0.21, digital: 0.21, country: 'Belgium' },
  BG: { standard: 0.20, digital: 0.20, country: 'Bulgaria' },
  HR: { standard: 0.25, digital: 0.25, country: 'Croatia' },
  CY: { standard: 0.19, digital: 0.19, country: 'Cyprus' },
  CZ: { standard: 0.21, digital: 0.21, country: 'Czech Republic' },
  DK: { standard: 0.25, digital: 0.25, country: 'Denmark' },
  EE: { standard: 0.22, digital: 0.22, country: 'Estonia' },
  FI: { standard: 0.255, digital: 0.255, country: 'Finland' },
  FR: { standard: 0.20, digital: 0.20, country: 'France' },
  DE: { standard: 0.19, digital: 0.19, country: 'Germany' },
  GR: { standard: 0.24, digital: 0.24, country: 'Greece' },
  HU: { standard: 0.27, digital: 0.27, country: 'Hungary' },
  IE: { standard: 0.23, digital: 0.23, country: 'Ireland' },
  IT: { standard: 0.22, digital: 0.22, country: 'Italy' },
  LV: { standard: 0.21, digital: 0.21, country: 'Latvia' },
  LT: { standard: 0.21, digital: 0.21, country: 'Lithuania' },
  LU: { standard: 0.17, digital: 0.17, country: 'Luxembourg' },
  MT: { standard: 0.18, digital: 0.18, country: 'Malta' },
  NL: { standard: 0.21, digital: 0.21, country: 'Netherlands' },
  PL: { standard: 0.23, digital: 0.23, country: 'Poland' },
  PT: { standard: 0.23, digital: 0.23, country: 'Portugal' },
  RO: { standard: 0.19, digital: 0.19, country: 'Romania' },
  SK: { standard: 0.23, digital: 0.23, country: 'Slovakia' },
  SI: { standard: 0.22, digital: 0.22, country: 'Slovenia' },
  ES: { standard: 0.21, digital: 0.21, country: 'Spain' },
  SE: { standard: 0.25, digital: 0.25, country: 'Sweden' },
}

export const EU_COUNTRY_CODES = Object.keys(EU_VAT_RATES)

export function isEUCountry(countryCode: string): boolean {
  return countryCode in EU_VAT_RATES
}

export function getVATRate(countryCode: string, type: 'standard' | 'digital' = 'digital'): number | null {
  const rates = EU_VAT_RATES[countryCode]
  if (!rates) return null
  return rates[type]
}

export function formatAmount(cents: number, currency: string = 'eur'): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(cents / 100)
}
