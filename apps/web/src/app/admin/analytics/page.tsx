import { auth } from "@clerk/nextjs/server"
import { clerkClient } from "@clerk/nextjs/server"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  CheckoutFunnelChart,
  SdkEventsChart,
  RegionDonutChart,
  SdkVersionChart,
  SubGrowthChart,
  type DailyFunnel,
  type DailySdkEvents,
  type RegionData,
  type SdkVersionData,
  type DailySubGrowth,
} from "@/components/admin/AnalyticsCharts"

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100)
}

function pct(num: number, den: number): string {
  if (den === 0) return "0%"
  return `${Math.round((num / den) * 100)}%`
}

export default async function AnalyticsPage() {
  const { userId } = await auth()
  if (userId !== process.env.ADMIN_CLERK_USER_ID) return notFound()

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const monthStart = new Date()
  monthStart.setUTCDate(1)
  monthStart.setUTCHours(0, 0, 0, 0)

  // ── Batch 1: Checkout funnel + SDK overview (5 queries) ────
  const [
    checkoutStats,
    avgCheckoutDuration,
    preloadedConversion,
    nonPreloadedConversion,
    totalSdkEvents30d,
  ] = await Promise.all([
    prisma.checkoutSession.groupBy({
      by: ["status"],
      where: { createdAt: { gte: thirtyDaysAgo } },
      _count: true,
    }),
    prisma.checkoutSession.aggregate({
      where: { status: "COMPLETED", completedAt: { gte: thirtyDaysAgo } },
      _avg: { abandonedAfterMs: true },
    }),
    prisma.checkoutSession.groupBy({
      by: ["status"],
      where: { preloaded: true, createdAt: { gte: thirtyDaysAgo } },
      _count: true,
    }),
    prisma.checkoutSession.groupBy({
      by: ["status"],
      where: { preloaded: false, createdAt: { gte: thirtyDaysAgo } },
      _count: true,
    }),
    prisma.sdkEvent.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    }),
  ])

  // ── Batch 2: SDK details + subscriptions (5 queries) ───────
  const [
    uniqueUsersResult,
    regionChecks,
    sdkErrorCount,
    activeSubscriptions,
    subChangesThisMonth,
  ] = await Promise.all([
    prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(DISTINCT "userId") as count
      FROM "SdkEvent"
      WHERE "createdAt" >= ${thirtyDaysAgo}
      AND "userId" IS NOT NULL
    `,
    prisma.sdkEvent.groupBy({
      by: ["region"],
      where: { eventType: "region_check", createdAt: { gte: thirtyDaysAgo } },
      _count: true,
    }),
    prisma.sdkEvent.count({
      where: { eventType: "error", createdAt: { gte: thirtyDaysAgo } },
    }),
    prisma.entitlement.count({
      where: { status: "ACTIVE", product: { productType: "SUBSCRIPTION" } },
    }),
    prisma.entitlement.groupBy({
      by: ["status"],
      where: {
        product: { productType: "SUBSCRIPTION" },
        updatedAt: { gte: monthStart },
      },
      _count: true,
    }),
  ])

  // ── Batch 3: Charts + geography + leaderboard data (5 queries) ─
  const [
    dailyCheckoutSessions,
    dailySdkEventsRaw,
    topErrorsRaw,
    sdkVersionsRaw,
    countryTxRaw,
  ] = await Promise.all([
    prisma.checkoutSession.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true, status: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.sdkEvent.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.sdkEvent.groupBy({
      by: ["errorCode"],
      where: { eventType: "error", createdAt: { gte: thirtyDaysAgo }, errorCode: { not: null } },
      _count: true,
      orderBy: { _count: { errorCode: "desc" } },
      take: 10,
    }),
    prisma.sdkEvent.groupBy({
      by: ["sdkVersion"],
      where: { createdAt: { gte: thirtyDaysAgo }, sdkVersion: { not: null } },
      _count: true,
      orderBy: { _count: { sdkVersion: "desc" } },
      take: 10,
    }),
    prisma.$queryRaw<{ vatCountry: string; count: bigint; volume: bigint }[]>`
      SELECT "vatCountry", COUNT(*)::bigint as count, COALESCE(SUM("amountTotal"), 0)::bigint as volume
      FROM "Transaction"
      WHERE "status" = 'SUCCEEDED'
      AND "createdAt" >= ${thirtyDaysAgo}
      AND "vatCountry" IS NOT NULL
      GROUP BY "vatCountry"
      ORDER BY count DESC
      LIMIT 10
    `,
  ])

  // ── Batch 4: Subscription daily + leaderboard (4 queries) ──
  const [
    dailyStats,
    leaderboardApps,
    newSubsThisMonth,
    cancelledSubsThisMonth,
  ] = await Promise.all([
    prisma.platformDailyStats.findMany({
      where: { date: { gte: thirtyDaysAgo } },
      orderBy: { date: "asc" },
    }),
    prisma.app.findMany({
      select: {
        id: true,
        name: true,
        clerkUserId: true,
        _count: { select: { transactions: true } },
        transactions: {
          where: { status: "SUCCEEDED", createdAt: { gte: thirtyDaysAgo } },
          select: { amountTotal: true, appliedFeeCents: true, productId: true },
        },
        checkoutSessions: {
          where: { createdAt: { gte: thirtyDaysAgo } },
          select: { status: true },
        },
      },
    }),
    prisma.entitlement.count({
      where: {
        status: "ACTIVE",
        createdAt: { gte: monthStart },
        product: { productType: "SUBSCRIPTION" },
      },
    }),
    prisma.entitlement.count({
      where: {
        status: "CANCELLED",
        updatedAt: { gte: monthStart },
        product: { productType: "SUBSCRIPTION" },
      },
    }),
  ])

  // ── Compute checkout funnel metrics ────────────────────────
  const sessionsCreated = checkoutStats.reduce((s, r) => s + r._count, 0)
  const sessionsCompleted = checkoutStats.find((r) => r.status === "COMPLETED")?._count ?? 0
  const conversionRate = sessionsCreated > 0
    ? Math.round((sessionsCompleted / sessionsCreated) * 100)
    : 0

  // Preloaded vs non-preloaded conversion rates
  const preloadedCreated = preloadedConversion.reduce((s, r) => s + r._count, 0)
  const preloadedCompleted = preloadedConversion.find((r) => r.status === "COMPLETED")?._count ?? 0
  const nonPreloadedCreated = nonPreloadedConversion.reduce((s, r) => s + r._count, 0)
  const nonPreloadedCompleted = nonPreloadedConversion.find((r) => r.status === "COMPLETED")?._count ?? 0

  // ── Build daily funnel chart data ──────────────────────────
  const funnelMap = new Map<string, { created: number; completed: number }>()
  for (const session of dailyCheckoutSessions) {
    const day = session.createdAt.toISOString().split("T")[0]
    const entry = funnelMap.get(day) ?? { created: 0, completed: 0 }
    entry.created++
    if (session.status === "COMPLETED") entry.completed++
    funnelMap.set(day, entry)
  }
  const funnelChartData: DailyFunnel[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    const key = d.toISOString().split("T")[0]
    const entry = funnelMap.get(key) ?? { created: 0, completed: 0 }
    funnelChartData.push({ date: key.slice(5), ...entry })
  }

  // ── Build daily SDK events chart data ──────────────────────
  const sdkDayMap = new Map<string, number>()
  for (const evt of dailySdkEventsRaw) {
    const day = evt.createdAt.toISOString().split("T")[0]
    sdkDayMap.set(day, (sdkDayMap.get(day) ?? 0) + 1)
  }
  const sdkChartData: DailySdkEvents[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    const key = d.toISOString().split("T")[0]
    sdkChartData.push({ date: key.slice(5), events: sdkDayMap.get(key) ?? 0 })
  }

  // ── SDK metrics ────────────────────────────────────────────
  const uniqueUsers = Number(uniqueUsersResult[0]?.count ?? 0)
  const totalRegionChecks = regionChecks.reduce((s, r) => s + r._count, 0)
  const euChecks = regionChecks.find((r) => r.region === "EU")?._count ?? 0
  const euRate = totalRegionChecks > 0 ? Math.round((euChecks / totalRegionChecks) * 100) : 0
  const errorRate = totalSdkEvents30d > 0
    ? ((sdkErrorCount / totalSdkEvents30d) * 100).toFixed(2)
    : "0"

  const regionData: RegionData[] = [
    { name: "EU", value: euChecks },
    { name: "Non-EU", value: totalRegionChecks - euChecks },
  ]

  const sdkVersionData: SdkVersionData[] = sdkVersionsRaw.map((r) => ({
    version: r.sdkVersion ?? "unknown",
    count: r._count,
  }))

  // ── Subscription metrics ───────────────────────────────────
  const netGrowth = newSubsThisMonth - cancelledSubsThisMonth
  const churnRate = activeSubscriptions > 0
    ? ((cancelledSubsThisMonth / (activeSubscriptions + cancelledSubsThisMonth)) * 100).toFixed(1)
    : "0"

  // Build sub growth chart from PlatformDailyStats if available, otherwise sparse
  const subGrowthData: DailySubGrowth[] = dailyStats.length > 0
    ? dailyStats.map((s) => ({
        date: s.date.toISOString().split("T")[0].slice(5),
        net: s.netSubscriptionGrowth,
      }))
    : []

  // ── Country breakdown ──────────────────────────────────────
  const totalCountryTx = countryTxRaw.reduce((s, r) => s + Number(r.count), 0)
  const countryRows = countryTxRaw.map((r) => ({
    country: r.vatCountry,
    count: Number(r.count),
    volume: Number(r.volume),
    percentage: totalCountryTx > 0
      ? Math.round((Number(r.count) / totalCountryTx) * 100)
      : 0,
  }))

  // ── Developer leaderboard ──────────────────────────────────
  const devLeaderboard = new Map<string, {
    clerkUserId: string
    txCount: number
    volume: number
    feeGenerated: number
    sessionsCreated: number
    sessionsCompleted: number
    topProduct: string
  }>()

  for (const app of leaderboardApps) {
    const existing = devLeaderboard.get(app.clerkUserId) ?? {
      clerkUserId: app.clerkUserId,
      txCount: 0,
      volume: 0,
      feeGenerated: 0,
      sessionsCreated: 0,
      sessionsCompleted: 0,
      topProduct: "",
    }

    existing.txCount += app.transactions.length
    existing.volume += app.transactions.reduce((s, t) => s + t.amountTotal, 0)
    existing.feeGenerated += app.transactions.reduce(
      (s, t) => s + (t.appliedFeeCents ?? Math.round(t.amountTotal * 0.015)),
      0
    )
    existing.sessionsCreated += app.checkoutSessions.length
    existing.sessionsCompleted += app.checkoutSessions.filter(
      (s) => s.status === "COMPLETED"
    ).length

    // Find top product by count
    const productCounts = new Map<string, number>()
    for (const tx of app.transactions) {
      productCounts.set(tx.productId, (productCounts.get(tx.productId) ?? 0) + 1)
    }
    if (productCounts.size > 0) {
      const topProdId = [...productCounts.entries()].sort((a, b) => b[1] - a[1])[0][0]
      existing.topProduct = topProdId
    }

    devLeaderboard.set(app.clerkUserId, existing)
  }

  // Fetch Clerk emails for leaderboard
  const leaderClerkIds = [...devLeaderboard.keys()]
  const leaderEmailMap = new Map<string, string>()
  try {
    if (leaderClerkIds.length > 0) {
      const client = await clerkClient()
      const users = await client.users.getUserList({ userId: leaderClerkIds, limit: 100 })
      for (const u of users.data) {
        leaderEmailMap.set(u.id, u.emailAddresses[0]?.emailAddress ?? u.id)
      }
    }
  } catch {
    for (const id of leaderClerkIds) leaderEmailMap.set(id, id)
  }

  const leaderboardRows = [...devLeaderboard.values()]
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 20)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Platform Analytics</h1>
        <p className="text-muted-foreground">
          Checkout funnel, SDK telemetry, geography, subscriptions, and developer leaderboard (last 30 days).
        </p>
      </div>

      {/* ── Section 1: Checkout Funnel ──────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Checkout Funnel (30 days)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard title="Sessions Created" value={sessionsCreated.toLocaleString()} />
            <MetricCard title="Sessions Completed" value={sessionsCompleted.toLocaleString()} />
            <MetricCard title="Conversion Rate" value={`${conversionRate}%`} />
            <MetricCard
              title="Avg Checkout Duration"
              value={
                avgCheckoutDuration._avg.abandonedAfterMs
                  ? `${Math.round(avgCheckoutDuration._avg.abandonedAfterMs / 1000)}s`
                  : "N/A"
              }
            />
          </div>

          <CheckoutFunnelChart data={funnelChartData} />

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-border p-4">
              <p className="text-xs text-muted-foreground">Preloaded Sessions</p>
              <p className="text-lg font-bold mt-1">
                {pct(preloadedCompleted, preloadedCreated)} conversion
              </p>
              <p className="text-xs text-muted-foreground">
                {preloadedCompleted} / {preloadedCreated} sessions
              </p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="text-xs text-muted-foreground">Non-Preloaded Sessions</p>
              <p className="text-lg font-bold mt-1">
                {pct(nonPreloadedCompleted, nonPreloadedCreated)} conversion
              </p>
              <p className="text-xs text-muted-foreground">
                {nonPreloadedCompleted} / {nonPreloadedCreated} sessions
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Section 2: SDK Telemetry ────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">SDK Telemetry (30 days)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard title="Total SDK Events" value={totalSdkEvents30d.toLocaleString()} />
            <MetricCard title="Unique End Users" value={uniqueUsers.toLocaleString()} />
            <MetricCard title="EU Region Rate" value={`${euRate}%`} />
            <MetricCard title="SDK Error Rate" value={`${errorRate}%`} />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium mb-2">Region Split</p>
              <RegionDonutChart data={regionData} />
            </div>
            <div>
              <p className="text-sm font-medium mb-2">SDK Version Distribution</p>
              <SdkVersionChart data={sdkVersionData} />
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Daily SDK Events</p>
            <SdkEventsChart data={sdkChartData} />
          </div>

          {topErrorsRaw.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Top Errors</p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Error Code</TableHead>
                    <TableHead className="text-right">Count</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topErrorsRaw.map((err) => (
                    <TableRow key={err.errorCode}>
                      <TableCell className="font-mono text-xs">{err.errorCode}</TableCell>
                      <TableCell className="text-right">{err._count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Section 3: Geography & Payment Methods ──────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Geography (30 days)</CardTitle>
        </CardHeader>
        <CardContent>
          {countryRows.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No transaction geography data yet
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Country</TableHead>
                  <TableHead className="text-right">Transactions</TableHead>
                  <TableHead className="text-right">Volume</TableHead>
                  <TableHead className="text-right">% of Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {countryRows.map((row) => (
                  <TableRow key={row.country}>
                    <TableCell className="font-medium">{row.country}</TableCell>
                    <TableCell className="text-right">{row.count}</TableCell>
                    <TableCell className="text-right">{formatCurrency(row.volume)}</TableCell>
                    <TableCell className="text-right">{row.percentage}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <p className="text-xs text-muted-foreground mt-3">
            Payment method tracking available via SDK telemetry events.
          </p>
        </CardContent>
      </Card>

      {/* ── Section 4: Subscription Health ──────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Subscription Health</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <MetricCard title="Active Subscriptions" value={activeSubscriptions.toLocaleString()} />
            <MetricCard title="New (this month)" value={newSubsThisMonth.toLocaleString()} />
            <MetricCard title="Cancelled (this month)" value={cancelledSubsThisMonth.toLocaleString()} />
            <MetricCard
              title="Net Growth"
              value={`${netGrowth >= 0 ? "+" : ""}${netGrowth}`}
              valueColor={netGrowth >= 0 ? "text-green-500" : "text-red-500"}
            />
            <MetricCard title="Churn Rate" value={`${churnRate}%`} />
          </div>

          {subGrowthData.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Daily Net Subscription Growth</p>
              <SubGrowthChart data={subGrowthData} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Section 5: Developer Leaderboard ────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Developer Leaderboard (30 days)</CardTitle>
        </CardHeader>
        <CardContent>
          {leaderboardRows.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No transaction data yet
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Developer</TableHead>
                  <TableHead className="text-right">Transactions</TableHead>
                  <TableHead className="text-right">Volume</TableHead>
                  <TableHead className="text-right">Platform Fee</TableHead>
                  <TableHead className="text-right">Conversion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaderboardRows.map((dev) => (
                  <TableRow key={dev.clerkUserId}>
                    <TableCell className="text-sm">
                      {leaderEmailMap.get(dev.clerkUserId) ?? dev.clerkUserId.slice(0, 12) + "..."}
                    </TableCell>
                    <TableCell className="text-right">{dev.txCount}</TableCell>
                    <TableCell className="text-right">{formatCurrency(dev.volume)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(dev.feeGenerated)}</TableCell>
                    <TableCell className="text-right">
                      {dev.sessionsCreated > 0
                        ? pct(dev.sessionsCompleted, dev.sessionsCreated)
                        : "N/A"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function MetricCard({
  title,
  value,
  valueColor,
}: {
  title: string
  value: string
  valueColor?: string
}) {
  return (
    <div className="rounded-lg border border-border p-4">
      <p className="text-xs text-muted-foreground">{title}</p>
      <p className={`text-xl font-bold mt-1 ${valueColor ?? ""}`}>{value}</p>
    </div>
  )
}
