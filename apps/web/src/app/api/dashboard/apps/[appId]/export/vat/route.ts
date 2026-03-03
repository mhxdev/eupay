import { auth } from "@clerk/nextjs/server"
import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  const { userId } = await auth()
  if (!userId) {
    return new Response("Unauthorized", { status: 401 })
  }

  const { appId } = await params

  const app = await prisma.app.findUnique({
    where: { id: appId },
    select: { clerkUserId: true },
  })
  if (!app || app.clerkUserId !== userId) {
    return new Response("Not found", { status: 404 })
  }

  // Parse year (required) and quarter (optional)
  const yearParam = req.nextUrl.searchParams.get("year")
  if (!yearParam) {
    return new Response("Missing required 'year' query parameter", { status: 400 })
  }
  const year = parseInt(yearParam, 10)
  if (isNaN(year)) {
    return new Response("Invalid 'year' parameter", { status: 400 })
  }

  const quarterParam = req.nextUrl.searchParams.get("quarter")
  const quarter = quarterParam ? parseInt(quarterParam, 10) : null
  if (quarter !== null && (quarter < 1 || quarter > 4)) {
    return new Response("'quarter' must be 1-4", { status: 400 })
  }

  // Compute date range
  let startMonth = 0 // January
  let endMonth = 11  // December
  if (quarter !== null) {
    startMonth = (quarter - 1) * 3
    endMonth = startMonth + 2
  }

  const from = new Date(year, startMonth, 1)
  const to = new Date(year, endMonth + 1, 0, 23, 59, 59, 999) // last day of end month

  const transactions = await prisma.transaction.findMany({
    where: {
      appId,
      status: "SUCCEEDED",
      createdAt: { gte: from, lte: to },
    },
    select: {
      vatCountry: true,
      vatRate: true,
      amountSubtotal: true,
      amountTax: true,
      amountTotal: true,
      currency: true,
    },
  })

  // Group by vatCountry + vatRate
  const groups = new Map<
    string,
    {
      vatCountry: string
      vatRate: number | null
      count: number
      subtotal: number
      tax: number
      total: number
      currency: string
    }
  >()

  for (const tx of transactions) {
    const key = `${tx.vatCountry ?? "UNKNOWN"}|${tx.vatRate ?? 0}`
    const existing = groups.get(key)
    if (existing) {
      existing.count += 1
      existing.subtotal += tx.amountSubtotal
      existing.tax += tx.amountTax
      existing.total += tx.amountTotal
    } else {
      groups.set(key, {
        vatCountry: tx.vatCountry ?? "UNKNOWN",
        vatRate: tx.vatRate,
        count: 1,
        subtotal: tx.amountSubtotal,
        tax: tx.amountTax,
        total: tx.amountTotal,
        currency: tx.currency,
      })
    }
  }

  const header =
    "vat_country,vat_rate,transaction_count,amount_subtotal_total,amount_tax_total,amount_total_total,currency"

  const sortedGroups = [...groups.values()].sort((a, b) =>
    a.vatCountry.localeCompare(b.vatCountry)
  )

  let totalCount = 0
  let totalSubtotal = 0
  let totalTax = 0
  let totalTotal = 0

  const rows = sortedGroups.map((g) => {
    totalCount += g.count
    totalSubtotal += g.subtotal
    totalTax += g.tax
    totalTotal += g.total
    return [
      g.vatCountry,
      g.vatRate ?? 0,
      g.count,
      g.subtotal,
      g.tax,
      g.total,
      g.currency,
    ].join(",")
  })

  // Summary row
  const summaryRow = `TOTAL,,${totalCount},${totalSubtotal},${totalTax},${totalTotal},eur`
  rows.push(summaryRow)

  const csv = [header, ...rows].join("\n")
  const periodLabel = quarter !== null ? `Q${quarter}` : "full"
  const filename = `vat-report-${year}-${periodLabel}-${appId}.csv`

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}
