import { auth } from "@clerk/nextjs/server"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ApiKeySection } from "@/components/dashboard/ApiKeySection"
import { ModeToggle } from "@/components/dashboard/ModeToggle"
import { SandboxBanner } from "@/components/dashboard/SandboxBanner"
import { AppHealthBadge, type HealthData } from "@/components/dashboard/AppHealthBadge"
import { AppleCredentialsForm } from "@/components/dashboard/AppleCredentialsForm"
import { CustomerEmailToggle } from "@/components/dashboard/CustomerEmailToggle"
import { StripeConnect } from "@/components/dashboard/StripeConnect"
import { AppRevenueChart } from "@/components/dashboard/AppRevenueChart"
import { Package, Users, Webhook, ExternalLink, FileText, BarChart3, Shield, Tag, TrendingUp, HeartHandshake, FlaskConical } from "lucide-react"

export default async function AppDetailPage({
  params,
}: {
  params: Promise<{ appId: string }>
}) {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const { appId } = await params

  const app = await prisma.app.findUnique({
    where: { id: appId },
    include: {
      apiKeys: { orderBy: { createdAt: "desc" } },
      _count: { select: { products: true, customers: true, transactions: true } },
    },
  })

  if (!app || app.clerkUserId !== userId) notFound()

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [activeProductCount, recentTxCount, migrationStats, retentionStats, experimentStats] = await Promise.all([
    prisma.product.count({ where: { appId, isActive: true } }),
    prisma.transaction.count({
      where: { appId, status: "SUCCEEDED", createdAt: { gte: thirtyDaysAgo } },
    }),
    prisma.migrationCampaign.findFirst({
      where: { appId, status: "ACTIVE" },
      select: {
        name: true,
        migrations: {
          select: { status: true, savingsCentsPerMonth: true },
        },
      },
    }),
    prisma.cancelEvent.groupBy({
      by: ["outcome"],
      where: { appId, createdAt: { gte: thirtyDaysAgo } },
      _count: true,
    }),
    prisma.experiment.findMany({
      where: { appId, status: "RUNNING" },
      select: {
        id: true,
        name: true,
        _count: { select: { assignments: true } },
      },
    }),
  ])

  const healthData: HealthData = {
    hasActiveProduct: activeProductCount > 0,
    hasWebhook: !!app.webhookUrl,
    dmaConfirmed: !!app.dmaEntitlementConfirmed,
    hasRecentTransaction: recentTxCount > 0,
  }

  const apiKeysForClient = app.apiKeys.map((k) => ({
    id: k.id,
    keyPrefix: k.keyPrefix,
    name: k.name,
    isActive: k.isActive,
    lastUsedAt: k.lastUsedAt?.toISOString() ?? null,
    createdAt: k.createdAt.toISOString(),
  }))

  const navItems = [
    { href: `/dashboard/apps/${appId}/products`, label: "Products", icon: Package, count: app._count.products },
    { href: `/dashboard/apps/${appId}/subscribers`, label: "Subscribers", icon: Users, count: app._count.customers },
    { href: `/dashboard/apps/${appId}/webhooks`, label: "Webhook Logs", icon: Webhook, count: null },
    { href: `/dashboard/apps/${appId}/apple-reporting`, label: "Apple Reporting", icon: FileText, count: null },
    { href: `/dashboard/apps/${appId}/promotions`, label: "Promotions", icon: Tag, count: null },
    { href: `/dashboard/apps/${appId}/campaigns`, label: "Campaigns", icon: TrendingUp, count: null },
    { href: `/dashboard/apps/${appId}/retention`, label: "Retention", icon: HeartHandshake, count: null },
    { href: `/dashboard/apps/${appId}/experiments`, label: "Experiments", icon: FlaskConical, count: null },
    { href: `/dashboard/apps/${appId}/reports`, label: "Reports", icon: BarChart3, count: null },
    { href: `/dashboard/apps/${appId}/dma`, label: "DMA", icon: Shield, count: null },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">{app.name}</h1>
          <p className="text-muted-foreground font-mono text-sm truncate">{app.bundleId}</p>
        </div>
        <ModeToggle appId={appId} mode={app.mode ?? "sandbox"} />
      </div>

      {(app.mode === "sandbox" || app.mode === null) && <SandboxBanner />}

      {!app.dmaEntitlementConfirmed && (
        <Card className="border-orange-200 bg-orange-50 dark:border-orange-500/20 dark:bg-orange-500/5">
          <CardContent className="flex items-start gap-3 py-4">
            <ExternalLink className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-orange-900 dark:text-orange-300">
                DMA Entitlement Required
              </p>
              <p className="text-sm text-orange-700 dark:text-orange-400/80">
                Before going live, ensure you have Apple&apos;s External Purchase Link entitlement.{" "}
                <a
                  href="https://developer.apple.com/contact/request/download/external_purchase.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-medium"
                >
                  Request here
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{item.label}</CardTitle>
                <item.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {item.count !== null && (
                  <p className="text-2xl font-bold">{item.count}</p>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <AppRevenueChart appId={appId} />

      {migrationStats && (() => {
        const migrated = migrationStats.migrations.filter(
          (m) => m.status === "PURCHASED" || m.status === "COMPLETED"
        )
        const prompted = migrationStats.migrations.length
        const rate = prompted > 0 ? Math.round((migrated.length / prompted) * 100) : 0
        const monthlySavings = migrated.reduce((s, m) => s + m.savingsCentsPerMonth, 0)
        return (
          <Card className="border-teal-200 bg-teal-50 dark:border-teal-500/20 dark:bg-teal-500/5">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-teal-900 dark:text-teal-300">
                    Switch & Save: {migrationStats.name}
                  </p>
                  <p className="text-xs text-teal-700 dark:text-teal-400/80 mt-1">
                    {migrated.length} migrated · {rate}% conversion · {new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(monthlySavings / 100)}/mo saved
                  </p>
                </div>
                <Link
                  href={`/dashboard/apps/${appId}/campaigns`}
                  className="text-xs text-teal-600 dark:text-teal-400 underline"
                >
                  View campaigns
                </Link>
              </div>
            </CardContent>
          </Card>
        )
      })()}

      {retentionStats.length > 0 && (() => {
        const totalEvents = retentionStats.reduce((s, r) => s + r._count, 0)
        const savedEvents = retentionStats
          .filter((r) => r.outcome !== "CANCELLED" && r.outcome !== "PENDING")
          .reduce((s, r) => s + r._count, 0)
        const saveRate = totalEvents > 0 ? Math.round((savedEvents / totalEvents) * 100) : 0
        return (
          <Card className="border-purple-200 bg-purple-50 dark:border-purple-500/20 dark:bg-purple-500/5">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-900 dark:text-purple-300">
                    Save the Sale (30 days)
                  </p>
                  <p className="text-xs text-purple-700 dark:text-purple-400/80 mt-1">
                    {savedEvents} saved · {retentionStats.find((r) => r.outcome === "CANCELLED")?._count ?? 0} cancelled · {saveRate}% save rate
                  </p>
                </div>
                <Link
                  href={`/dashboard/apps/${appId}/retention/analytics`}
                  className="text-xs text-purple-600 dark:text-purple-400 underline"
                >
                  View analytics
                </Link>
              </div>
            </CardContent>
          </Card>
        )
      })()}

      {experimentStats.length > 0 && (() => {
        const totalParticipants = experimentStats.reduce((s, e) => s + e._count.assignments, 0)
        return (
          <Card className="border-indigo-200 bg-indigo-50 dark:border-indigo-500/20 dark:bg-indigo-500/5">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-indigo-900 dark:text-indigo-300">
                    Experiments
                  </p>
                  <p className="text-xs text-indigo-700 dark:text-indigo-400/80 mt-1">
                    {experimentStats.length} running · {totalParticipants} total participants
                  </p>
                </div>
                <Link
                  href={`/dashboard/apps/${appId}/experiments`}
                  className="text-xs text-indigo-600 dark:text-indigo-400 underline"
                >
                  View experiments
                </Link>
              </div>
            </CardContent>
          </Card>
        )
      })()}

      <Separator />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>App Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
              <span className="text-muted-foreground">App ID</span>
              <code className="font-mono text-xs break-all">{app.id}</code>
            </div>
            <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
              <span className="text-muted-foreground">Bundle ID</span>
              <code className="font-mono text-xs break-all">{app.bundleId}</code>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created</span>
              <span>{app.createdAt.toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Mode</span>
              {app.mode === "sandbox" ? (
                <Badge className="bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20">SANDBOX</Badge>
              ) : (
                <Badge className="bg-teal-100 text-teal-800 border-teal-300 hover:bg-teal-100 dark:bg-teal-500/10 dark:text-teal-400 dark:border-teal-500/20">LIVE</Badge>
              )}
            </div>
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-muted-foreground">Stripe</span>
              <StripeConnect appId={appId} stripeConnectId={app.stripeConnectId} />
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">DMA Status</span>
              {app.dmaEntitlementConfirmed ? (
                <Badge variant="secondary">Confirmed</Badge>
              ) : (
                <Badge variant="outline">Pending</Badge>
              )}
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Platform Fee</span>
              <span className="font-medium">{app.platformFeePercent ?? 1.5}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Revenue</span>
              <span className="font-medium">{app._count.transactions} transactions</span>
            </div>
            <Separator />
            <div>
              <span className="text-muted-foreground">Health</span>
              <div className="mt-2">
                <AppHealthBadge data={healthData} showDetails />
              </div>
            </div>
            <p className="text-xs text-muted-foreground pt-1">
              Contact support@europay.dev to discuss custom pricing.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <ApiKeySection appId={appId} keys={apiKeysForClient} />
          </CardContent>
        </Card>
      </div>

      <CustomerEmailToggle appId={appId} enabled={app.sendCustomerEmails} />

      <Card>
        <CardHeader>
          <CardTitle>Apple Credentials</CardTitle>
          <CardDescription>
            Required for automated Apple External Purchase Server API reporting.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AppleCredentialsForm
            appId={appId}
            credentials={{
              appleKeyId: app.appleKeyId,
              appleIssuerId: app.appleIssuerId,
              applePrivateKey: app.applePrivateKey ? "saved" : null,
              appleBundleId: app.appleBundleId,
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
