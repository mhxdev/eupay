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

interface DailyStat {
  day: Date
  transaction_count: bigint
  total_revenue: bigint
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

  // Single aggregation query — groups by day
  const dailyStats = await prisma.$queryRaw<DailyStat[]>`
    SELECT
      date_trunc('day', "createdAt") as day,
      COUNT(*) as transaction_count,
      SUM("amountTotal") as total_revenue
    FROM "Transaction"
    WHERE "appId" = ${appId}
      AND "createdAt" >= ${since}
      AND "status" = 'SUCCEEDED'
    GROUP BY date_trunc('day', "createdAt")
    ORDER BY day ASC
  `

  // Build a lookup map from the raw results
  const statsMap = new Map<string, { revenue: number; transactions: number }>()
  for (const row of dailyStats) {
    const dateKey = row.day.toISOString().slice(0, 10)
    statsMap.set(dateKey, {
      revenue: Number(row.total_revenue),
      transactions: Number(row.transaction_count),
    })
  }

  // Fill in every day in the range (including days with 0 transactions)
  const series: { date: string; revenue: number; transactions: number }[] = []
  let totalRevenue = 0
  let totalTransactions = 0
  const cursor = new Date(since)
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  while (cursor <= today) {
    const dateKey = cursor.toISOString().slice(0, 10)
    const entry = statsMap.get(dateKey) ?? { revenue: 0, transactions: 0 }
    series.push({ date: dateKey, ...entry })
    totalRevenue += entry.revenue
    totalTransactions += entry.transactions
    cursor.setDate(cursor.getDate() + 1)
  }

  // MRR = sum of amountCents of active SUBSCRIPTION entitlements for this app
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
