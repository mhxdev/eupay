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
    select: { id: true, webhookUrl: true, dmaEntitlementConfirmed: true },
  })
  const productCount = firstApp
    ? await prisma.product.count({ where: { appId: firstApp.id } })
    : 0
  const checklistData: ChecklistData = {
    hasApp: !!firstApp,
    hasProduct: productCount > 0,
    hasWebhook: !!firstApp?.webhookUrl,
    dmaConfirmed: !!firstApp?.dmaEntitlementConfirmed,
  }

  // Metrics queries
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  const [
    activeSubscribers,
    totalActiveLastMonth,
    cancelledThisMonth,
    thisMonthRevenue,
    lastMonthRevenue,
    newSubscribersThisMonth,
    totalRevenue,
    distinctPayingCustomers,
  ] = await Promise.all([
    // Active subscription entitlements now
    prisma.entitlement.count({
      where: {
        product: { appId: { in: appIds } },
        status: "ACTIVE",
        stripeSubscriptionId: { not: null },
      },
    }),
    // Active at start of this month (approximate: created before this month, not cancelled before)
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
    // Cancelled this month
    prisma.entitlement.count({
      where: {
        product: { appId: { in: appIds } },
        status: "CANCELLED",
        updatedAt: { gte: startOfMonth },
      },
    }),
    // Revenue this month
    prisma.transaction.aggregate({
      where: {
        appId: { in: appIds },
        status: "SUCCEEDED",
        createdAt: { gte: startOfMonth },
      },
      _sum: { amountSubtotal: true },
    }),
    // Revenue last month
    prisma.transaction.aggregate({
      where: {
        appId: { in: appIds },
        status: "SUCCEEDED",
        createdAt: { gte: startOfLastMonth, lt: startOfMonth },
      },
      _sum: { amountSubtotal: true },
    }),
    // New subscribers this month
    prisma.customer.count({
      where: {
        appId: { in: appIds },
        createdAt: { gte: startOfMonth },
      },
    }),
    // Total succeeded revenue (for LTV)
    prisma.transaction.aggregate({
      where: {
        appId: { in: appIds },
        status: "SUCCEEDED",
      },
      _sum: { amountSubtotal: true },
    }),
    // Distinct paying customers (for LTV)
    prisma.transaction.groupBy({
      by: ["customerId"],
      where: {
        appId: { in: appIds },
        status: "SUCCEEDED",
      },
    }),
  ])

  // MRR: sum of active subscription product amounts (excluding VAT)
  const activeSubProducts = await prisma.entitlement.findMany({
    where: {
      product: { appId: { in: appIds } },
      status: "ACTIVE",
      stripeSubscriptionId: { not: null },
    },
    include: { product: { select: { amountCents: true, interval: true } } },
  })

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

  // LTV calculation
  const totalRevenueAmount = totalRevenue._sum.amountSubtotal ?? 0
  const payingCustomerCount = distinctPayingCustomers.length
  const ltv = payingCustomerCount > 0
    ? Math.round(totalRevenueAmount / payingCustomerCount)
    : 0

  // Revenue chart: last 12 months
  const monthlyData: MonthlyRevenue[] = []
  for (let i = 11; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
    const label = monthStart.toLocaleDateString("en-US", {
      month: "short",
      year: "2-digit",
    })

    const agg = await prisma.transaction.aggregate({
      where: {
        appId: { in: appIds },
        status: "SUCCEEDED",
        createdAt: { gte: monthStart, lt: monthEnd },
      },
      _sum: { amountSubtotal: true },
    })

    monthlyData.push({
      month: label,
      revenue: agg._sum.amountSubtotal ?? 0,
    })
  }

  // MRR trend: last 12 months
  const mrrData: MonthlyMrr[] = []
  for (let i = 11; i >= 0; i--) {
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
    const label = new Date(now.getFullYear(), now.getMonth() - i, 1)
      .toLocaleDateString("en-US", { month: "short", year: "2-digit" })

    // Entitlements active at month-end: created before month-end, still active or cancelled/expired after month-end
    const activeAtMonthEnd = await prisma.entitlement.findMany({
      where: {
        product: { appId: { in: appIds } },
        stripeSubscriptionId: { not: null },
        createdAt: { lt: monthEnd },
        OR: [
          { status: "ACTIVE" },
          {
            status: { in: ["CANCELLED", "EXPIRED"] },
            updatedAt: { gte: monthEnd },
          },
        ],
      },
      include: { product: { select: { amountCents: true, interval: true } } },
    })

    const monthMrr = activeAtMonthEnd.reduce((sum, e) => {
      const amount = e.product.amountCents
      return sum + (e.product.interval === "year" ? Math.round(amount / 12) : amount)
    }, 0)

    mrrData.push({ month: label, mrr: monthMrr })
  }

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
