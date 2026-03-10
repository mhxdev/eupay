import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RevenueChart, type MonthlyRevenue } from "@/components/dashboard/RevenueChart"
import { MrrChart, type MonthlyMrr } from "@/components/dashboard/MrrChart"
import { OnboardingChecklist, type ChecklistData } from "@/components/dashboard/OnboardingChecklist"
import { TrendingUp, Users, CreditCard, BarChart3, UserPlus, DollarSign } from "lucide-react"

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100)
}

export default async function DashboardPage() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  // Get all apps for this developer
  const apps = await prisma.app.findMany({
    where: { clerkUserId: userId },
    select: { id: true },
  })
  const appIds = apps.map((a) => a.id)

  // Onboarding checklist data
  const firstApp = await prisma.app.findFirst({
    where: { clerkUserId: userId },
    select: {
      id: true,
      stripeConnectId: true,
      dmaEntitlementConfirmed: true,
      mode: true,
      apiKeys: {
        where: { isActive: true },
        select: { id: true, lastUsedAt: true },
      },
    },
  })
  const [productCount, sandboxTxCount] = await Promise.all([
    firstApp
      ? prisma.product.count({ where: { appId: firstApp.id } })
      : Promise.resolve(0),
    firstApp
      ? prisma.transaction.count({
          where: { appId: firstApp.id, status: "SUCCEEDED" },
        })
      : Promise.resolve(0),
  ])
  const hasSdkUsage = firstApp?.apiKeys.some((k) => !!k.lastUsedAt) ?? false
  const checklistData: ChecklistData = {
    hasApp: !!firstApp,
    appId: firstApp?.id ?? null,
    hasStripe: !!firstApp?.stripeConnectId,
    hasProduct: productCount > 0,
    hasSdkUsage,
    hasTestTransaction: sandboxTxCount > 0,
    dmaConfirmed: !!firstApp?.dmaEntitlementConfirmed,
    isLive: firstApp?.mode === "live",
    activeKeyIds: firstApp?.apiKeys.map((k) => k.id) ?? [],
  }

  // Metrics queries
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  // Batch 1: subscriber & revenue metrics (5 queries)
  const [
    activeSubscribers,
    totalActiveLastMonth,
    cancelledThisMonth,
    thisMonthRevenue,
    lastMonthRevenue,
  ] = await Promise.all([
    prisma.entitlement.count({
      where: {
        product: { appId: { in: appIds } },
        status: "ACTIVE",
        stripeSubscriptionId: { not: null },
      },
    }),
    prisma.entitlement.count({
      where: {
        product: { appId: { in: appIds } },
        stripeSubscriptionId: { not: null },
        createdAt: { lt: startOfMonth },
        OR: [
          { status: "ACTIVE" },
          { status: "CANCELLED", updatedAt: { gte: startOfMonth } },
        ],
      },
    }),
    prisma.entitlement.count({
      where: {
        product: { appId: { in: appIds } },
        status: "CANCELLED",
        updatedAt: { gte: startOfMonth },
      },
    }),
    prisma.transaction.aggregate({
      where: {
        appId: { in: appIds },
        status: "SUCCEEDED",
        createdAt: { gte: startOfMonth },
      },
      _sum: { amountSubtotal: true },
    }),
    prisma.transaction.aggregate({
      where: {
        appId: { in: appIds },
        status: "SUCCEEDED",
        createdAt: { gte: startOfLastMonth, lt: startOfMonth },
      },
      _sum: { amountSubtotal: true },
    }),
  ])

  // Batch 2: LTV, new subs, MRR entitlements (4 queries)
  const [
    newSubscribersThisMonth,
    totalRevenue,
    distinctPayingCustomers,
    activeSubProducts,
  ] = await Promise.all([
    prisma.customer.count({
      where: {
        appId: { in: appIds },
        createdAt: { gte: startOfMonth },
      },
    }),
    prisma.transaction.aggregate({
      where: {
        appId: { in: appIds },
        status: "SUCCEEDED",
      },
      _sum: { amountSubtotal: true },
    }),
    prisma.transaction.groupBy({
      by: ["customerId"],
      where: {
        appId: { in: appIds },
        status: "SUCCEEDED",
      },
    }),
    prisma.entitlement.findMany({
      where: {
        product: { appId: { in: appIds } },
        status: "ACTIVE",
        stripeSubscriptionId: { not: null },
      },
      include: { product: { select: { amountCents: true, interval: true } } },
    }),
  ])

  const mrr = activeSubProducts.reduce((sum, e) => {
    const amount = e.product.amountCents
    // Normalize yearly to monthly
    return sum + (e.product.interval === "year" ? Math.round(amount / 12) : amount)
  }, 0)

  const lastMrr = lastMonthRevenue._sum.amountSubtotal ?? 0
  const currentRevenue = thisMonthRevenue._sum.amountSubtotal ?? 0
  const mrrGrowth = lastMrr > 0
    ? ((currentRevenue - lastMrr) / lastMrr) * 100
    : 0
  const churnRate = totalActiveLastMonth > 0
    ? (cancelledThisMonth / totalActiveLastMonth) * 100
    : 0

  // LTV calculation — ARPU / churn rate
  const totalRevenueAmount = totalRevenue._sum.amountSubtotal ?? 0
  const payingCustomerCount = distinctPayingCustomers.length
  const arpu = payingCustomerCount > 0 ? totalRevenueAmount / payingCustomerCount : 0
  const monthlyChurnRate = churnRate > 0 ? churnRate / 100 : 0.05
  const ltv = payingCustomerCount > 0
    ? Math.round(arpu > 0 ? arpu / Math.max(monthlyChurnRate, 0.01) : 0)
    : 0

  // Revenue chart: last 12 months (batched in groups of 6)
  const revenueMonths = Array.from({ length: 12 }, (_, idx) => {
    const i = 11 - idx
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
    const label = monthStart.toLocaleDateString("en-US", { month: "short", year: "2-digit" })
    return { monthStart, monthEnd, label }
  })

  const revBatch1 = await Promise.all(
    revenueMonths.slice(0, 6).map((m) =>
      prisma.transaction.aggregate({
        where: { appId: { in: appIds }, status: "SUCCEEDED", createdAt: { gte: m.monthStart, lt: m.monthEnd } },
        _sum: { amountSubtotal: true },
      })
    )
  )
  const revBatch2 = await Promise.all(
    revenueMonths.slice(6).map((m) =>
      prisma.transaction.aggregate({
        where: { appId: { in: appIds }, status: "SUCCEEDED", createdAt: { gte: m.monthStart, lt: m.monthEnd } },
        _sum: { amountSubtotal: true },
      })
    )
  )
  const monthlyData: MonthlyRevenue[] = revenueMonths.map((m, idx) => ({
    month: m.label,
    revenue: (idx < 6 ? revBatch1[idx] : revBatch2[idx - 6])._sum.amountSubtotal ?? 0,
  }))

  // MRR trend: last 12 months (batched in groups of 6)
  const mrrMonths = Array.from({ length: 12 }, (_, idx) => {
    const i = 11 - idx
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
    const label = new Date(now.getFullYear(), now.getMonth() - i, 1)
      .toLocaleDateString("en-US", { month: "short", year: "2-digit" })
    return { monthEnd, label }
  })

  const mrrBatch1 = await Promise.all(
    mrrMonths.slice(0, 6).map((m) =>
      prisma.entitlement.findMany({
        where: {
          product: { appId: { in: appIds } },
          stripeSubscriptionId: { not: null },
          createdAt: { lt: m.monthEnd },
          OR: [
            { status: "ACTIVE" },
            { status: { in: ["CANCELLED", "EXPIRED"] }, updatedAt: { gte: m.monthEnd } },
          ],
        },
        include: { product: { select: { amountCents: true, interval: true } } },
      })
    )
  )
  const mrrBatch2 = await Promise.all(
    mrrMonths.slice(6).map((m) =>
      prisma.entitlement.findMany({
        where: {
          product: { appId: { in: appIds } },
          stripeSubscriptionId: { not: null },
          createdAt: { lt: m.monthEnd },
          OR: [
            { status: "ACTIVE" },
            { status: { in: ["CANCELLED", "EXPIRED"] }, updatedAt: { gte: m.monthEnd } },
          ],
        },
        include: { product: { select: { amountCents: true, interval: true } } },
      })
    )
  )
  const mrrData: MonthlyMrr[] = mrrMonths.map((m, idx) => {
    const entitlements = idx < 6 ? mrrBatch1[idx] : mrrBatch2[idx - 6]
    const monthMrr = entitlements.reduce((sum, e) => {
      const amount = e.product.amountCents
      return sum + (e.product.interval === "year" ? Math.round(amount / 12) : amount)
    }, 0)
    return { month: m.label, mrr: monthMrr }
  })

  const metrics = [
    {
      title: "MRR",
      value: formatCurrency(mrr),
      description: mrrGrowth > 0
        ? `+${mrrGrowth.toFixed(1)}% vs last month`
        : mrrGrowth < 0
          ? `${mrrGrowth.toFixed(1)}% vs last month`
          : "No change",
      icon: TrendingUp,
    },
    {
      title: "Active Subscribers",
      value: activeSubscribers.toLocaleString(),
      description: `${cancelledThisMonth} cancelled this month`,
      icon: Users,
    },
    {
      title: "Revenue This Month",
      value: formatCurrency(currentRevenue),
      description: "Excluding VAT",
      icon: CreditCard,
    },
    {
      title: "Churn Rate",
      value: `${churnRate.toFixed(1)}%`,
      description: "This month",
      icon: BarChart3,
    },
    {
      title: "New Subscribers",
      value: newSubscribersThisMonth.toLocaleString(),
      description: "This month",
      icon: UserPlus,
    },
    {
      title: "LTV (Avg.)",
      value: formatCurrency(ltv),
      description: `${payingCustomerCount} paying customer${payingCustomerCount !== 1 ? "s" : ""}`,
      icon: DollarSign,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Overview</h1>
        <p className="text-muted-foreground">
          Revenue and subscriber metrics across all your apps.
        </p>
      </div>

      <OnboardingChecklist data={checklistData} />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {metrics.map((m) => (
          <Card key={m.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{m.title}</CardTitle>
              <m.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{m.value}</div>
              <p className="text-xs text-muted-foreground">{m.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>MRR Trend (last 12 months)</CardTitle>
          <CardDescription>Monthly recurring revenue over time</CardDescription>
        </CardHeader>
        <CardContent>
          <MrrChart data={mrrData} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Revenue (last 12 months)</CardTitle>
          <CardDescription>Monthly revenue excluding VAT</CardDescription>
        </CardHeader>
        <CardContent>
          <RevenueChart data={monthlyData} />
        </CardContent>
      </Card>
    </div>
  )
}
