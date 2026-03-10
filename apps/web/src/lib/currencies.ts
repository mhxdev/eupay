export const SUPPORTED_CURRENCIES = [
  { code: "eur", symbol: "€", name: "Euro" },
  // Future currencies — uncomment when ready:
  // { code: "usd", symbol: "$", name: "US Dollar" },
  // { code: "gbp", symbol: "£", name: "British Pound" },
  // { code: "pln", symbol: "zł", name: "Polish Zloty" },
  // { code: "sek", symbol: "kr", name: "Swedish Krona" },
  // { code: "dkk", symbol: "kr", name: "Danish Krone" },
  // { code: "czk", symbol: "Kč", name: "Czech Koruna" },
  // { code: "huf", symbol: "Ft", name: "Hungarian Forint" },
  // { code: "ron", symbol: "lei", name: "Romanian Leu" },
  // { code: "bgn", symbol: "лв", name: "Bulgarian Lev" },
  // { code: "chf", symbol: "CHF", name: "Swiss Franc" },
  // { code: "nok", symbol: "kr", name: "Norwegian Krone" },
] as const

export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number]["code"]

export function getCurrencySymbol(code: string): string {
  return (
    SUPPORTED_CURRENCIES.find((c) => c.code === code)?.symbol ??
    code.toUpperCase()
  )
}
