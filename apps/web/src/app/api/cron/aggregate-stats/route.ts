// GET /api/cron/aggregate-stats
// Daily aggregation of platform stats. Called by Vercel cron at 02:00 UTC.
// Protected by CRON_SECRET.
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  // Calculate yesterday's date range (UTC)
  const now = new Date()
  const yesterday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1))
  const dayStart = yesterday
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)

  // ── Checkout funnel aggregation ────────────────────────────
  const [checkoutCreated, checkoutCompleted, checkoutExpired, avgDuration] = await Promise.all([
    prisma.checkoutSession.count({
      where: { createdAt: { gte: dayStart, lt: dayEnd } },
    }),
    prisma.checkoutSession.count({
      where: { status: "COMPLETED", completedAt: { gte: dayStart, lt: dayEnd } },
    }),
    prisma.checkoutSession.count({
      where: { status: "EXPIRED", expiredAt: { gte: dayStart, lt: dayEnd } },
    }),
    prisma.checkoutSession.aggregate({
      where: { status: "COMPLETED", completedAt: { gte: dayStart, lt: dayEnd } },
      _avg: { abandonedAfterMs: true },
    }),
  ])

  // Calculate average checkout duration from completedAt - createdAt
  const completedSessions = await prisma.checkoutSession.findMany({
    where: { status: "COMPLETED", completedAt: { gte: dayStart, lt: dayEnd } },
    select: { createdAt: true, completedAt: true },
  })
  const avgCheckoutMs = completedSessions.length > 0
    ? Math.round(
        completedSessions.reduce((sum, s) => {
          return sum + (s.completedAt!.getTime() - s.createdAt.getTime())
        }, 0) / completedSessions.length
      )
    : null

  // ── SDK event aggregation ──────────────────────────────────
  const [
    sdkRegionChecks,
    sdkRegionEU,
    sdkRegionNonEU,
    sdkPurchaseStarts,
    sdkErrors,
    uniqueUsersResult,
  ] = await Promise.all([
    prisma.sdkEvent.count({
      where: { eventType: "region_check", createdAt: { gte: dayStart, lt: dayEnd } },
    }),
    prisma.sdkEvent.count({
      where: { eventType: "region_check", region: "EU", createdAt: { gte: dayStart, lt: dayEnd } },
    }),
    prisma.sdkEvent.count({
      where: { eventType: "region_check", region: "NON_EU", createdAt: { gte: dayStart, lt: dayEnd } },
    }),
    prisma.sdkEvent.count({
      where: { eventType: "purchase_started", createdAt: { gte: dayStart, lt: dayEnd } },
    }),
    prisma.sdkEvent.count({
      where: { eventType: "error", createdAt: { gte: dayStart, lt: dayEnd } },
    }),
    prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(DISTINCT "userId") as count
      FROM "SdkEvent"
      WHERE "createdAt" >= ${dayStart} AND "createdAt" < ${dayEnd}
      AND "userId" IS NOT NULL
    `,
  ])

  const uniqueEndUsers = Number(uniqueUsersResult[0]?.count ?? 0)

  // ── Transaction aggregation ────────────────────────────────
  const [txAgg, refundAgg] = await Promise.all([
    prisma.transaction.aggregate({
      where: { status: "SUCCEEDED", createdAt: { gte: dayStart, lt: dayEnd } },
      _count: true,
      _sum: { amountTotal: true, appliedFeeCents: true },
    }),
    prisma.transaction.aggregate({
      where: { status: "REFUNDED", createdAt: { gte: dayStart, lt: dayEnd } },
      _count: true,
      _sum: { amountTotal: true },
    }),
  ])

  // ── Subscription aggregation ───────────────────────────────
  const [subsCreated, subsCancelled] = await Promise.all([
    prisma.entitlement.count({
      where: {
        source: "WEB_CHECKOUT",
        status: "ACTIVE",
        createdAt: { gte: dayStart, lt: dayEnd },
        product: { productType: "SUBSCRIPTION" },
      },
    }),
    prisma.entitlement.count({
      where: {
        status: "CANCELLED",
        updatedAt: { gte: dayStart, lt: dayEnd },
        product: { productType: "SUBSCRIPTION" },
      },
    }),
  ])

  // ── Geography aggregation (top 5 countries) ────────────────
  const topCountriesRaw = await prisma.$queryRaw<
    { vatCountry: string; count: bigint; volume: bigint }[]
  >`
    SELECT "vatCountry", COUNT(*)::bigint as count, COALESCE(SUM("amountTotal"), 0)::bigint as volume
    FROM "Transaction"
    WHERE "status" = 'SUCCEEDED'
    AND "createdAt" >= ${dayStart} AND "createdAt" < ${dayEnd}
    AND "vatCountry" IS NOT NULL
    GROUP BY "vatCountry"
    ORDER BY count DESC
    LIMIT 5
  `
  const topCountries = topCountriesRaw.map((r) => ({
    country: r.vatCountry,
    count: Number(r.count),
    volume: Number(r.volume),
  }))

  // ── Payment methods ────────────────────────────────────────
  // Infer from SDK telemetry if available
  const paymentMethodsRaw = await prisma.$queryRaw<
    { method: string; count: bigint }[]
  >`
    SELECT COALESCE(metadata->>'paymentMethod', 'unknown') as method,
           COUNT(*)::bigint as count
    FROM "SdkEvent"
    WHERE "eventType" = 'checkout_completed'
    AND "createdAt" >= ${dayStart} AND "createdAt" < ${dayEnd}
    AND metadata IS NOT NULL
    GROUP BY method
    ORDER BY count DESC
  `
  const paymentMethods = paymentMethodsRaw.length > 0
    ? paymentMethodsRaw.map((r) => ({ method: r.method, count: Number(r.count) }))
    : null

  // ── Upsert daily stats ─────────────────────────────────────
  const conversionRate = checkoutCreated > 0
    ? checkoutCompleted / checkoutCreated
    : null

  await prisma.platformDailyStats.upsert({
    where: { date: dayStart },
    create: {
      date: dayStart,
      checkoutSessionsCreated: checkoutCreated,
      checkoutSessionsCompleted: checkoutCompleted,
      checkoutSessionsExpired: checkoutExpired,
      checkoutConversionRate: conversionRate,
      avgCheckoutDurationMs: avgCheckoutMs,
      sdkRegionChecks,
      sdkRegionEU,
      sdkRegionNonEU,
      sdkPurchaseStarts,
      sdkErrors,
      uniqueEndUsers,
      transactionCount: txAgg._count,
      transactionVolumeCents: txAgg._sum.amountTotal ?? 0,
      platformFeeCents: txAgg._sum.appliedFeeCents ?? 0,
      refundCount: refundAgg._count,
      refundVolumeCents: refundAgg._sum.amountTotal ?? 0,
      subscriptionsCreated: subsCreated,
      subscriptionsCancelled: subsCancelled,
      netSubscriptionGrowth: subsCreated - subsCancelled,
      topCountries: topCountries.length > 0 ? topCountries : undefined,
      paymentMethods: paymentMethods ?? undefined,
    },
    update: {
      checkoutSessionsCreated: checkoutCreated,
      checkoutSessionsCompleted: checkoutCompleted,
      checkoutSessionsExpired: checkoutExpired,
      checkoutConversionRate: conversionRate,
      avgCheckoutDurationMs: avgCheckoutMs,
      sdkRegionChecks,
      sdkRegionEU,
      sdkRegionNonEU,
      sdkPurchaseStarts,
      sdkErrors,
      uniqueEndUsers,
      transactionCount: txAgg._count,
      transactionVolumeCents: txAgg._sum.amountTotal ?? 0,
      platformFeeCents: txAgg._sum.appliedFeeCents ?? 0,
      refundCount: refundAgg._count,
      refundVolumeCents: refundAgg._sum.amountTotal ?? 0,
      subscriptionsCreated: subsCreated,
      subscriptionsCancelled: subsCancelled,
      netSubscriptionGrowth: subsCreated - subsCancelled,
      topCountries: topCountries.length > 0 ? topCountries : undefined,
      paymentMethods: paymentMethods ?? undefined,
    },
  })

  return NextResponse.json({
    success: true,
    date: dayStart.toISOString().split("T")[0],
    stats: {
      checkoutCreated,
      checkoutCompleted,
      checkoutExpired,
      conversionRate,
      transactionCount: txAgg._count,
      transactionVolumeCents: txAgg._sum.amountTotal ?? 0,
      subsCreated,
      subsCancelled,
    },
  })
}
