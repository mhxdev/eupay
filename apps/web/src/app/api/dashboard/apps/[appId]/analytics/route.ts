import { auth } from "@clerk/nextjs/server"
import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"

const VALID_PERIODS = ["7d", "30d", "90d"] as const
type Period = (typeof VALID_PERIODS)[number]

function periodToDays(period: Period): number {
  switch (period) {
    case "7d":
      return 7
    case "30d":
      return 30
    case "90d":
      return 90
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  const { userId } = await auth()
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { appId } = await params

  const app = await prisma.app.findUnique({
    where: { id: appId },
    select: { clerkUserId: true },
  })
  if (!app || app.clerkUserId !== userId) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }

  const periodParam = req.nextUrl.searchParams.get("period") ?? "30d"
  if (!VALID_PERIODS.includes(periodParam as Period)) {
    return Response.json(
      { error: "Invalid period. Use 7d, 30d, or 90d" },
      { status: 400 }
    )
  }
  const period = periodParam as Period
  const days = periodToDays(period)

  const since = new Date()
  since.setDate(since.getDate() - days)
  since.setHours(0, 0, 0, 0)

  // Fetch succeeded transactions in the period
  const transactions = await prisma.transaction.findMany({
    where: {
      appId,
      status: "SUCCEEDED",
      createdAt: { gte: since },
    },
    select: {
      createdAt: true,
      amountTotal: true,
    },
    orderBy: { createdAt: "asc" },
  })

  // Build daily series with every day in the range
  const seriesMap = new Map<string, { revenue: number; transactions: number }>()
  const cursor = new Date(since)
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  while (cursor <= today) {
    seriesMap.set(cursor.toISOString().slice(0, 10), {
      revenue: 0,
      transactions: 0,
    })
    cursor.setDate(cursor.getDate() + 1)
  }

  let totalRevenue = 0
  let totalTransactions = 0
  for (const tx of transactions) {
    const dateKey = tx.createdAt.toISOString().slice(0, 10)
    const entry = seriesMap.get(dateKey)
    if (entry) {
      entry.revenue += tx.amountTotal
      entry.transactions += 1
    }
    totalRevenue += tx.amountTotal
    totalTransactions += 1
  }

  const series = Array.from(seriesMap.entries()).map(([date, data]) => ({
    date,
    revenue: data.revenue,
    transactions: data.transactions,
  }))

  // MRR = sum of amountSubtotal of active SUBSCRIPTION entitlements for this app
  const activeSubEntitlements = await prisma.entitlement.findMany({
    where: {
      status: "ACTIVE",
      product: {
        appId,
        productType: "SUBSCRIPTION",
      },
    },
    select: {
      product: { select: { amountCents: true } },
    },
  })

  const mrr = activeSubEntitlements.reduce(
    (sum, e) => sum + e.product.amountCents,
    0
  )

  return Response.json({
    series,
    totals: {
      revenue: totalRevenue,
      transactions: totalTransactions,
      mrr,
    },
  })
}
