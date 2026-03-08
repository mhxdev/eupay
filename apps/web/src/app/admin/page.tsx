import { auth } from "@clerk/nextjs/server"
import { clerkClient } from "@clerk/nextjs/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Activity,
  AlertTriangle,
  CreditCard,
  DollarSign,
  Download,
  Pencil,
  UserPlus,
  Users,
  Zap,
  Megaphone,
  FlaskConical,
  Shield,
  Heart,
} from "lucide-react"
import { AdminRevenueChart, type DailyRevenue } from "@/components/admin/AdminRevenueChart"
import { DevelopersTable, type DeveloperRow } from "@/components/admin/DevelopersTable"

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100)
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default async function AdminPage() {
  const { userId } = await auth()
  if (userId !== process.env.ADMIN_CLERK_USER_ID) return notFound()

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekStart = new Date(todayStart)
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  // ── Parallel data fetching ────────────────────────────────
  const [
    // Section 1: Platform Health
    failedWebhooks24h,
    failedWebhooksLastHour,
    stuckOnboarding,
    appleReportFailures24h,
    // Section 2: Revenue
    todayRevenue,
    weekRevenue,
    monthRevenue,
    allTimeRevenue,
    // Section 3: Developers
    allApps,
    // Section 4: Feature Adoption
    activePromotions,
    activeCampaigns,
    completedMigrations,
    runningExperiments,
    totalParticipants,
    enabledRetention,
    cancelEventStats,
    // Section 5: Recent Activity
    recentFeeChanges,
    recentApps,
    recentFailedWebhooks,
  ] = await Promise.all([
    // Health
    prisma.webhookEvent.count({
      where: { status: "FAILED", createdAt: { gte: oneDayAgo } },
    }),
    prisma.webhookEvent.count({
      where: { status: "FAILED", createdAt: { gte: oneHourAgo } },
    }),
    prisma.app.count({
      where: { stripeConnectId: null },
    }),
    prisma.transaction.count({
      where: { appleReportStatus: "FAILED", createdAt: { gte: oneDayAgo } },
    }),
    // Revenue: today
    prisma.transaction.aggregate({
      where: { status: "SUCCEEDED", createdAt: { gte: todayStart } },
      _count: true,
      _sum: { amountTotal: true, appliedFeeCents: true },
    }),
    // Revenue: week
    prisma.transaction.aggregate({
      where: { status: "SUCCEEDED", createdAt: { gte: weekStart } },
      _count: true,
      _sum: { amountTotal: true, appliedFeeCents: true },
    }),
    // Revenue: month
    prisma.transaction.aggregate({
      where: { status: "SUCCEEDED", createdAt: { gte: monthStart } },
      _count: true,
      _sum: { amountTotal: true, appliedFeeCents: true },
    }),
    // Revenue: all time
    prisma.transaction.aggregate({
      where: { status: "SUCCEEDED" },
      _count: true,
      _sum: { amountTotal: true, appliedFeeCents: true },
    }),
    // Developers: all apps with aggregated data
    prisma.app.findMany({
      select: {
        id: true,
        name: true,
        clerkUserId: true,
        stripeConnectId: true,
        platformFeePercent: true,
        createdAt: true,
        _count: { select: { transactions: true } },
        transactions: {
          where: { status: "SUCCEEDED" },
          select: { amountTotal: true, createdAt: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    }),
    // Feature Adoption
    prisma.promotion.count({ where: { status: "ACTIVE" } }),
    prisma.migrationCampaign.count({ where: { status: "ACTIVE" } }),
    prisma.migrationEvent.count({ where: { status: "COMPLETED" } }),
    prisma.experiment.count({ where: { status: "RUNNING" } }),
    prisma.experimentAssignment.count(),
    prisma.retentionConfig.count({ where: { enabled: true } }),
    prisma.cancelEvent.groupBy({
      by: ["outcome"],
      _count: true,
    }),
    // Recent Activity
    prisma.feeChangeLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { app: { select: { name: true } } },
    }),
    prisma.app.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, name: true, clerkUserId: true, stripeConnectId: true, createdAt: true },
    }),
    prisma.webhookEvent.findMany({
      where: { status: "FAILED" },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, type: true, appId: true, createdAt: true, error: true },
    }),
  ])

  // ── Daily revenue chart data (last 30 days) ───────────────
  const dailyTxs = await prisma.transaction.findMany({
    where: { status: "SUCCEEDED", createdAt: { gte: thirtyDaysAgo } },
    select: { createdAt: true, appliedFeeCents: true, amountTotal: true },
    orderBy: { createdAt: "asc" },
  })

  const dailyRevenueMap = new Map<string, number>()
  for (const tx of dailyTxs) {
    const day = tx.createdAt.toISOString().split("T")[0]
    const fee = tx.appliedFeeCents ?? Math.round(tx.amountTotal * 0.015)
    dailyRevenueMap.set(day, (dailyRevenueMap.get(day) ?? 0) + fee)
  }
  const chartData: DailyRevenue[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    const key = d.toISOString().split("T")[0]
    chartData.push({
      date: key.slice(5), // "MM-DD"
      revenue: dailyRevenueMap.get(key) ?? 0,
    })
  }

  // ── Revenue helpers ────────────────────────────────────────
  function computeFeeRevenue(agg: typeof todayRevenue) {
    if (agg._sum.appliedFeeCents) return agg._sum.appliedFeeCents
    return Math.round((agg._sum.amountTotal ?? 0) * 0.015)
  }

  // ── Build developer rows ──────────────────────────────────
  const devMap = new Map<string, {
    clerkUserId: string
    appsCount: number
    volume: number
    transactions: number
    stripeConnected: boolean
    feePercent: number
    firstAppId: string
    lastTxDate: Date | null
    joinedDate: Date
  }>()

  for (const app of allApps) {
    const vol = app.transactions.reduce((s, t) => s + t.amountTotal, 0)
    const lastTx = app.transactions[0]?.createdAt ?? null
    const existing = devMap.get(app.clerkUserId)
    if (existing) {
      existing.appsCount += 1
      existing.volume += vol
      existing.transactions += app._count.transactions
      existing.stripeConnected = existing.stripeConnected || !!app.stripeConnectId
      if (app.createdAt < existing.joinedDate) {
        existing.joinedDate = app.createdAt
        existing.firstAppId = app.id
      }
      if (lastTx && (!existing.lastTxDate || lastTx > existing.lastTxDate)) {
        existing.lastTxDate = lastTx
      }
    } else {
      devMap.set(app.clerkUserId, {
        clerkUserId: app.clerkUserId,
        appsCount: 1,
        volume: vol,
        transactions: app._count.transactions,
        stripeConnected: !!app.stripeConnectId,
        feePercent: app.platformFeePercent,
        firstAppId: app.id,
        lastTxDate: lastTx,
        joinedDate: app.createdAt,
      })
    }
  }

  // Fetch Clerk user data
  const clerkUserIds = [...devMap.keys()]
  const emailMap = new Map<string, { email: string; name: string }>()
  try {
    const client = await clerkClient()
    if (clerkUserIds.length > 0) {
      const users = await client.users.getUserList({ userId: clerkUserIds, limit: 100 })
      for (const u of users.data) {
        emailMap.set(u.id, {
          email: u.emailAddresses[0]?.emailAddress ?? u.id,
          name: [u.firstName, u.lastName].filter(Boolean).join(" "),
        })
      }
    }
  } catch {
    // Fallback to IDs
    for (const id of clerkUserIds) emailMap.set(id, { email: id, name: "" })
  }

  const developerRows: DeveloperRow[] = [...devMap.values()]
    .sort((a, b) => b.volume - a.volume)
    .map((d) => {
      const clerk = emailMap.get(d.clerkUserId)
      return {
        clerkUserId: d.clerkUserId,
        email: clerk?.email ?? d.clerkUserId,
        name: clerk?.name ?? "",
        appsCount: d.appsCount,
        volume: d.volume,
        transactions: d.transactions,
        stripeConnected: d.stripeConnected,
        feePercent: d.feePercent,
        firstAppId: d.firstAppId,
        lastTxDate: d.lastTxDate ? d.lastTxDate.toLocaleDateString("en-GB") : null,
        joinedDate: d.joinedDate.toLocaleDateString("en-GB"),
      }
    })

  // ── Build activity feed ───────────────────────────────────
  type ActivityEvent = {
    timestamp: Date
    icon: "user" | "stripe" | "dollar" | "alert" | "fee"
    description: string
  }

  const activityFeed: ActivityEvent[] = []

  // New developers (first app per clerkUserId)
  const seenDevs = new Set<string>()
  for (const app of recentApps) {
    if (!seenDevs.has(app.clerkUserId)) {
      seenDevs.add(app.clerkUserId)
      const clerk = emailMap.get(app.clerkUserId)
      activityFeed.push({
        timestamp: app.createdAt,
        icon: "user",
        description: `New developer: ${clerk?.email ?? app.clerkUserId.slice(0, 12) + "..."}`,
      })
    }
    if (app.stripeConnectId) {
      const clerk = emailMap.get(app.clerkUserId)
      activityFeed.push({
        timestamp: app.createdAt,
        icon: "stripe",
        description: `${clerk?.email ?? app.clerkUserId.slice(0, 12) + "..."} connected Stripe`,
      })
    }
  }

  // Fee changes
  for (const log of recentFeeChanges) {
    activityFeed.push({
      timestamp: log.createdAt,
      icon: "fee",
      description: `Fee changed for ${log.app.name}: ${log.previousPercent}% -> ${log.newPercent}%`,
    })
  }

  // Failed webhooks
  for (const wh of recentFailedWebhooks) {
    activityFeed.push({
      timestamp: wh.createdAt,
      icon: "alert",
      description: `Webhook failure: ${wh.type}${wh.error ? ` (${wh.error.slice(0, 60)})` : ""}`,
    })
  }

  activityFeed.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  const recentActivity = activityFeed.slice(0, 20)

  // ── Cancel event stats for retention ──────────────────────
  const totalCancelEvents = cancelEventStats.reduce((s, c) => s + c._count, 0)
  const savedEvents = cancelEventStats
    .filter((c) => c.outcome.startsWith("SAVED_"))
    .reduce((s, c) => s + c._count, 0)
  const saveRate = totalCancelEvents > 0 ? Math.round((savedEvents / totalCancelEvents) * 100) : 0

  // ── Health status ─────────────────────────────────────────
  const healthStatus = failedWebhooksLastHour > 0 ? "warning" : "healthy"

  const activityIcons = {
    user: <UserPlus className="h-4 w-4 text-blue-500" />,
    stripe: <CreditCard className="h-4 w-4 text-purple-500" />,
    dollar: <DollarSign className="h-4 w-4 text-green-500" />,
    alert: <AlertTriangle className="h-4 w-4 text-red-500" />,
    fee: <Pencil className="h-4 w-4 text-teal-500" />,
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Platform Overview</h1>
        <p className="text-muted-foreground">
          Operational dashboard — health, revenue, developers, and activity.
        </p>
      </div>

      {/* ── Section 1: Platform Health ────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">System Status</p>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-2">
              {healthStatus === "healthy" ? (
                <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  Healthy
                </Badge>
              ) : (
                <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                  Warning
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Failed Webhooks (24h)</p>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className={`text-2xl font-bold mt-1 ${failedWebhooks24h > 0 ? "text-red-500" : "text-green-500"}`}>
              {failedWebhooks24h}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Stuck Onboarding</p>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className={`text-2xl font-bold mt-1 ${stuckOnboarding > 0 ? "text-yellow-500" : ""}`}>
              {stuckOnboarding}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Apple Report Failures (24h)</p>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className={`text-2xl font-bold mt-1 ${appleReportFailures24h > 0 ? "text-red-500" : ""}`}>
              {appleReportFailures24h}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Section 2: Revenue ────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Revenue</CardTitle>
            <a href="/api/admin/export/revenue" download>
              <Button variant="outline" size="sm" className="h-7 text-xs">
                <Download className="h-3 w-3 mr-1" />
                Export Revenue CSV
              </Button>
            </a>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              title="Today"
              fee={formatCurrency(computeFeeRevenue(todayRevenue))}
              txCount={todayRevenue._count}
            />
            <MetricCard
              title="This Week"
              fee={formatCurrency(computeFeeRevenue(weekRevenue))}
              txCount={weekRevenue._count}
            />
            <MetricCard
              title="This Month"
              fee={formatCurrency(computeFeeRevenue(monthRevenue))}
              txCount={monthRevenue._count}
            />
            <MetricCard
              title="All Time"
              fee={formatCurrency(computeFeeRevenue(allTimeRevenue))}
              txCount={allTimeRevenue._count}
              sub={`${formatCurrency(allTimeRevenue._sum.amountTotal ?? 0)} volume`}
            />
          </div>

          <AdminRevenueChart data={chartData} />
        </CardContent>
      </Card>

      {/* ── Section 3: Developers ─────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Developers ({developerRows.length})</CardTitle>
            <a href="/api/admin/export/developers" download>
              <Button variant="outline" size="sm" className="h-7 text-xs">
                <Download className="h-3 w-3 mr-1" />
                Export Developers CSV
              </Button>
            </a>
          </div>
        </CardHeader>
        <CardContent>
          <DevelopersTable developers={developerRows} />
        </CardContent>
      </Card>

      {/* ── Section 4: Feature Adoption ───────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Promotions</p>
              <Megaphone className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold mt-1">{activePromotions}</p>
            <p className="text-xs text-muted-foreground">active</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Campaigns</p>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold mt-1">{activeCampaigns}</p>
            <p className="text-xs text-muted-foreground">{completedMigrations} completed migrations</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Experiments</p>
              <FlaskConical className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold mt-1">{runningExperiments}</p>
            <p className="text-xs text-muted-foreground">{totalParticipants} participants</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Retention</p>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold mt-1">{enabledRetention}</p>
            <p className="text-xs text-muted-foreground">{saveRate}% save rate</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Section 5: Recent Platform Activity ──────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Platform Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No recent activity
            </p>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((event, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="mt-0.5">{activityIcons[event.icon]}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{event.description}</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {timeAgo(event.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ── Helper components ───────────────────────────────────────────

function MetricCard({
  title,
  fee,
  txCount,
  sub,
}: {
  title: string
  fee: string
  txCount: number
  sub?: string
}) {
  return (
    <div className="rounded-lg border border-border p-4">
      <p className="text-xs text-muted-foreground">{title}</p>
      <p className="text-xl font-bold mt-1">{fee}</p>
      <p className="text-xs text-muted-foreground mt-0.5">
        {txCount.toLocaleString("de-DE")} txns
      </p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}
