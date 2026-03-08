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
import { Download, ChevronLeft, Check, X } from "lucide-react"
import { PlatformFeeEditor } from "@/components/admin/PlatformFeeEditor"
import { AdminNotes } from "@/components/admin/AdminNotes"
import { AuditLogSection, type AuditEventRow } from "@/components/admin/AuditLogSection"

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100)
}

export default async function DeveloperDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const { userId: adminId } = await auth()
  if (adminId !== process.env.ADMIN_CLERK_USER_ID) return notFound()

  const { userId } = await params

  // Fetch Clerk user info
  let clerkEmail = userId
  let clerkName = ""
  try {
    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    clerkEmail = user.emailAddresses[0]?.emailAddress ?? userId
    clerkName = [user.firstName, user.lastName].filter(Boolean).join(" ")
  } catch {
    // Clerk unavailable — fall back to showing ID
  }

  // Fetch all data in parallel
  const [apps, adminNotes] = await Promise.all([
    prisma.app.findMany({
      where: { clerkUserId: userId },
      include: {
        _count: { select: { products: true, transactions: true } },
        transactions: {
          where: { status: "SUCCEEDED" },
          select: { amountTotal: true },
        },
        feeChangeLogs: {
          orderBy: { createdAt: "desc" },
          include: { app: { select: { name: true } } },
        },
      },
    }),
    prisma.adminNote.findMany({
      where: { developerUserId: userId },
      orderBy: { createdAt: "desc" },
    }),
  ])

  if (apps.length === 0) return notFound()

  const appIds = apps.map((a) => a.id)
  const joinedDate = apps.reduce(
    (earliest, a) => (a.createdAt < earliest ? a.createdAt : earliest),
    apps[0].createdAt
  )
  const stripeConnected = apps.some((a) => !!a.stripeConnectId)
  const appleConfigured = apps.some(
    (a) => a.appleKeyId && a.appleIssuerId && a.applePrivateKey
  )
  const emailToggleStatus = apps.some((a) => a.sendCustomerEmails)
  const hasLiveApp = apps.some((a) => a.mode === "live")

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  // Fetch transactions + webhooks + audit events in parallel
  const [transactions, webhookEvents, promotions, campaigns, experiments, retentionConfigs, auditEvents] =
    await Promise.all([
      prisma.transaction.findMany({
        where: { appId: { in: appIds } },
        include: {
          app: { select: { name: true } },
          product: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.webhookEvent.findMany({
        where: { appId: { in: appIds } },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.promotion.findMany({
        where: { appId: { in: appIds }, status: "ACTIVE" },
        include: { _count: { select: { redemptions: true } } },
      }),
      prisma.migrationCampaign.findMany({
        where: { appId: { in: appIds } },
        include: { _count: { select: { migrations: true } } },
      }),
      prisma.experiment.findMany({
        where: { appId: { in: appIds } },
        include: { _count: { select: { assignments: true } } },
      }),
      prisma.retentionConfig.findMany({
        where: { appId: { in: appIds } },
      }),
      prisma.auditEvent.findMany({
        where: { appId: { in: appIds } },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    ])

  // ── Health + Checkout funnel + Milestones (separate batch to stay within pool limit) ──
  const [
    failedWebhooks,
    failedAppleReports,
    checkoutStats30d,
    lastTransaction,
    milestones,
  ] = await Promise.all([
    prisma.webhookEvent.count({
      where: { appId: { in: appIds }, status: "FAILED" },
    }),
    prisma.transaction.count({
      where: { appId: { in: appIds }, appleReportStatus: "FAILED" },
    }),
    prisma.checkoutSession.groupBy({
      by: ["status"],
      where: { appId: { in: appIds }, createdAt: { gte: thirtyDaysAgo } },
      _count: true,
    }),
    prisma.transaction.findFirst({
      where: { appId: { in: appIds }, status: "SUCCEEDED" },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
    prisma.developerMilestone.findMany({
      where: { clerkUserId: userId },
      orderBy: { createdAt: "asc" },
    }),
  ])

  // ── Developer Health Score ──────────────────────────────────
  const productCount = apps.reduce((s, a) => s + a._count.products, 0)
  const transactionCount = apps.reduce((s, a) => s + a._count.transactions, 0)
  const recentActivity = lastTransaction
    ? lastTransaction.createdAt > thirtyDaysAgo
    : false

  const healthSignals = {
    "Stripe Connected": stripeConnected,
    "Apple Credentials": appleConfigured,
    "Has Products": productCount > 0,
    "Has Transactions": transactionCount > 0,
    "Recent Activity (30d)": recentActivity,
    "Webhooks Healthy": failedWebhooks === 0,
    "Apple Reports Healthy": failedAppleReports === 0,
  }
  const healthScore = Object.values(healthSignals).filter(Boolean).length
  const healthMax = Object.values(healthSignals).length
  const healthPercentage = Math.round((healthScore / healthMax) * 100)
  const healthStatus = healthScore === healthMax
    ? "healthy"
    : healthScore >= healthMax * 0.7
    ? "warning"
    : "critical"

  // ── Checkout funnel (30d) ───────────────────────────────────
  const devCheckoutsCreated = checkoutStats30d.reduce((s, r) => s + r._count, 0)
  const devCheckoutsCompleted = checkoutStats30d.find((r) => r.status === "COMPLETED")?._count ?? 0
  const devConversionRate = devCheckoutsCreated > 0
    ? Math.round((devCheckoutsCompleted / devCheckoutsCreated) * 100)
    : null

  // ── Developer Journey (milestone timeline) ──────────────────
  const completedMilestones = new Set(milestones.map((m) => m.milestone))
  const journeySteps = [
    { key: "app_created", label: "App Created" },
    { key: "api_key_generated", label: "API Key Generated" },
    { key: "stripe_connected", label: "Stripe Connected" },
    { key: "product_created", label: "Product Created" },
    { key: "apple_credentials_uploaded", label: "Apple Credentials" },
    { key: "webhook_configured", label: "Webhook Configured" },
    { key: "sandbox_test_transaction", label: "Sandbox Test" },
    { key: "mode_switched_live", label: "Switched to Live" },
    { key: "first_live_transaction", label: "First Live Transaction" },
  ]

  // Serialize audit events for client component
  const serializedAuditEvents: AuditEventRow[] = auditEvents.map((e) => ({
    id: e.id,
    category: e.category,
    action: e.action,
    resourceType: e.resourceType,
    resourceId: e.resourceId,
    details: e.details as Record<string, unknown> | null,
    createdAt: e.createdAt.toISOString(),
  }))

  // Aggregate fee change logs across all apps
  const allFeeChanges = apps
    .flatMap((a) => a.feeChangeLogs)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

  return (
    <div className="space-y-8">
      {/* ── Breadcrumb + Header ──────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Link href="/admin" className="hover:text-foreground transition-colors">
            EuroPay Admin
          </Link>
          <span>/</span>
          <span>Developers</span>
          <span>/</span>
          <span className="text-foreground">{clerkEmail}</span>
        </div>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{clerkEmail}</h1>
            {clerkName && <p className="text-lg text-muted-foreground">{clerkName}</p>}
            <p className="text-xs text-muted-foreground mt-1 font-mono">{userId}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Joined {joinedDate.toLocaleDateString("en-GB")}
            </p>
          </div>
          <Link href="/admin">
            <Button variant="outline" size="sm">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </Link>
        </div>

        <div className="flex gap-2 mt-3 flex-wrap">
          {stripeConnected ? (
            <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              Stripe Connected
            </Badge>
          ) : (
            <Badge variant="destructive">Stripe Not Connected</Badge>
          )}
          <Badge variant={hasLiveApp ? "default" : "secondary"}>
            {hasLiveApp ? "Live" : "Sandbox"}
          </Badge>
          {appleConfigured && (
            <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
              Apple Configured
            </Badge>
          )}
          {emailToggleStatus && (
            <Badge variant="outline">Emails Enabled</Badge>
          )}
        </div>
      </div>

      {/* ── Developer Health Score + Checkout Funnel ──────────── */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Developer Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-3 flex-1 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    healthStatus === "healthy"
                      ? "bg-green-500"
                      : healthStatus === "warning"
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                  style={{ width: `${healthPercentage}%` }}
                />
              </div>
              <span className="text-sm font-bold">{healthPercentage}%</span>
            </div>
            <div className="space-y-1.5">
              {Object.entries(healthSignals).map(([label, ok]) => (
                <div key={label} className="flex items-center gap-2 text-sm">
                  {ok ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <X className="h-4 w-4 text-red-500" />
                  )}
                  <span className={ok ? "" : "text-muted-foreground"}>{label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Checkout Funnel (30 days)</CardTitle>
          </CardHeader>
          <CardContent>
            {devCheckoutsCreated > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Created</p>
                    <p className="text-2xl font-bold">{devCheckoutsCreated}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Completed</p>
                    <p className="text-2xl font-bold">{devCheckoutsCompleted}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Conversion</p>
                    <p className="text-2xl font-bold">{devConversionRate}%</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Funnel</p>
                  <div className="flex gap-1 items-end h-8">
                    <div
                      className="bg-muted-foreground/30 rounded-t"
                      style={{ width: "50%", height: "100%" }}
                    />
                    <div
                      className="bg-green-500 rounded-t"
                      style={{
                        width: "50%",
                        height: `${devConversionRate ?? 0}%`,
                        minHeight: "4px",
                      }}
                    />
                  </div>
                  <div className="flex text-xs text-muted-foreground mt-1">
                    <span className="w-1/2">Created</span>
                    <span className="w-1/2">Completed</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No checkout sessions in the last 30 days
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Developer Journey ──────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Developer Journey</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-4">
            Onboarding milestones this developer has completed. A full journey goes from sign-up to first live transaction.
          </p>
          <div className="relative">
            {journeySteps.map((step, i) => {
              const completed = completedMilestones.has(step.key)
              const milestone = milestones.find((m) => m.milestone === step.key)
              return (
                <div key={step.key} className="flex items-start gap-3 pb-4 last:pb-0">
                  <div className="flex flex-col items-center">
                    <div
                      className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        completed
                          ? "bg-green-500 text-white"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {completed ? <Check className="h-3.5 w-3.5" /> : i + 1}
                    </div>
                    {i < journeySteps.length - 1 && (
                      <div
                        className={`w-0.5 flex-1 min-h-4 ${
                          completed ? "bg-green-500" : "bg-muted"
                        }`}
                      />
                    )}
                  </div>
                  <div className="pt-0.5">
                    <p className={`text-sm font-medium ${completed ? "" : "text-muted-foreground"}`}>
                      {step.label}
                    </p>
                    {milestone && (
                      <p className="text-xs text-muted-foreground">
                        {milestone.createdAt.toLocaleDateString("en-GB")}{" "}
                        {milestone.createdAt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* ── Apps ─────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Apps ({apps.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>App Name</TableHead>
                <TableHead>Bundle ID</TableHead>
                <TableHead>Stripe</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead className="text-right">Products</TableHead>
                <TableHead className="text-right">Txns</TableHead>
                <TableHead className="text-right">Volume</TableHead>
                <TableHead>Fee</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apps.map((app) => {
                const vol = app.transactions.reduce((s, t) => s + t.amountTotal, 0)
                return (
                  <TableRow key={app.id}>
                    <TableCell className="font-medium">{app.name}</TableCell>
                    <TableCell className="font-mono text-xs">{app.bundleId}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {app.stripeConnectId
                        ? app.stripeConnectId.slice(0, 12) + "..."
                        : "\u2014"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={app.mode === "live" ? "default" : "secondary"} className="text-xs">
                        {app.mode}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{app._count.products}</TableCell>
                    <TableCell className="text-right">{app._count.transactions}</TableCell>
                    <TableCell className="text-right">{formatCurrency(vol)}</TableCell>
                    <TableCell>
                      <PlatformFeeEditor appId={app.id} currentFee={app.platformFeePercent} />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── Fee History (Audit Trail) ────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Fee History</CardTitle>
        </CardHeader>
        <CardContent>
          {allFeeChanges.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No fee changes recorded
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>App</TableHead>
                  <TableHead>Previous</TableHead>
                  <TableHead>New</TableHead>
                  <TableHead>Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allFeeChanges.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs text-muted-foreground">
                      {log.createdAt.toLocaleDateString("en-GB")}{" "}
                      {log.createdAt.toLocaleTimeString("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell>{log.app.name}</TableCell>
                    <TableCell>{log.previousPercent}%</TableCell>
                    <TableCell className="text-teal-600 dark:text-teal-400 font-medium">
                      {log.newPercent}%
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {log.note ?? "\u2014"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ── Transactions ─────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              Transactions ({transactions.length}{transactions.length === 50 ? "+" : ""})
            </CardTitle>
            <a href={`/api/admin/export/transactions/${userId}`} download>
              <Button variant="outline" size="sm" className="h-7 text-xs">
                <Download className="h-3 w-3 mr-1" />
                Export Transactions CSV
              </Button>
            </a>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>App</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Fee %</TableHead>
                <TableHead className="text-right">Fee</TableHead>
                <TableHead>Stripe ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="text-xs text-muted-foreground">
                    {tx.createdAt.toLocaleDateString("en-GB")}
                  </TableCell>
                  <TableCell className="text-sm">{tx.app.name}</TableCell>
                  <TableCell className="text-sm">{tx.product.name}</TableCell>
                  <TableCell className="text-right">{formatCurrency(tx.amountTotal)}</TableCell>
                  <TableCell className="uppercase text-xs">{tx.currency}</TableCell>
                  <TableCell>
                    <StatusBadge status={tx.status} />
                  </TableCell>
                  <TableCell className="text-xs">
                    {tx.appliedFeePercent != null ? `${tx.appliedFeePercent}%` : "\u2014"}
                  </TableCell>
                  <TableCell className="text-right text-xs">
                    {tx.appliedFeeCents != null ? formatCurrency(tx.appliedFeeCents) : "\u2014"}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {tx.stripePaymentIntentId ? (
                      <a
                        href={`https://dashboard.stripe.com/payments/${tx.stripePaymentIntentId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline text-blue-500"
                      >
                        {tx.stripePaymentIntentId.slice(0, 14)}...
                      </a>
                    ) : (
                      "\u2014"
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {transactions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground">
                    No transactions
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── Webhook Health ────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Webhook Health</CardTitle>
        </CardHeader>
        <CardContent>
          {webhookEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No webhook events
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Event Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {webhookEvents.map((evt) => (
                  <TableRow key={evt.id}>
                    <TableCell className="text-xs text-muted-foreground">
                      {evt.createdAt.toLocaleDateString("en-GB")}{" "}
                      {evt.createdAt.toLocaleTimeString("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell className="text-xs">{evt.type}</TableCell>
                    <TableCell>
                      {evt.status === "PROCESSED" ? (
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          Delivered
                        </Badge>
                      ) : evt.status === "FAILED" ? (
                        <Badge variant="destructive">Failed</Badge>
                      ) : (
                        <Badge variant="secondary">Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-destructive max-w-xs truncate">
                      {evt.error ?? "\u2014"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ── Feature Usage ─────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Feature Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">Promotions</p>
              {promotions.length > 0 ? (
                <div className="mt-1 space-y-1">
                  {promotions.map((p) => (
                    <p key={p.id} className="text-sm">
                      {p.name}{" "}
                      <span className="text-muted-foreground text-xs">
                        ({p._count.redemptions} redemptions)
                      </span>
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mt-1">None active</p>
              )}
            </div>

            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">Campaigns</p>
              {campaigns.length > 0 ? (
                <div className="mt-1 space-y-1">
                  {campaigns.map((c) => (
                    <p key={c.id} className="text-sm">
                      {c.name}{" "}
                      <Badge variant="outline" className="text-xs ml-1">
                        {c.status}
                      </Badge>
                      <span className="text-muted-foreground text-xs ml-1">
                        ({c._count.migrations} migrations)
                      </span>
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mt-1">None</p>
              )}
            </div>

            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">Experiments</p>
              {experiments.length > 0 ? (
                <div className="mt-1 space-y-1">
                  {experiments.map((e) => (
                    <p key={e.id} className="text-sm">
                      {e.name}{" "}
                      <Badge variant="outline" className="text-xs ml-1">
                        {e.status}
                      </Badge>
                      <span className="text-muted-foreground text-xs ml-1">
                        ({e._count.assignments} participants)
                      </span>
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mt-1">None</p>
              )}
            </div>

            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">Retention</p>
              {retentionConfigs.length > 0 ? (
                retentionConfigs.map((r) => (
                  <p key={r.id} className="text-sm mt-1">
                    {r.enabled ? (
                      <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        Enabled
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Disabled</Badge>
                    )}
                  </p>
                ))
              ) : (
                <p className="text-sm text-muted-foreground mt-1">Not configured</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Audit Log ──────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              Audit Log ({serializedAuditEvents.length}{serializedAuditEvents.length === 50 ? "+" : ""})
            </CardTitle>
            <a href={`/api/admin/export/audit/${userId}`} download>
              <Button variant="outline" size="sm" className="h-7 text-xs">
                <Download className="h-3 w-3 mr-1" />
                Export Audit Log CSV
              </Button>
            </a>
          </div>
        </CardHeader>
        <CardContent>
          <AuditLogSection events={serializedAuditEvents} />
        </CardContent>
      </Card>

      {/* ── Admin Notes ───────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Admin Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <AdminNotes developerUserId={userId} notes={adminNotes} />
        </CardContent>
      </Card>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "SUCCEEDED":
      return (
        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
          Succeeded
        </Badge>
      )
    case "REFUNDED":
      return (
        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
          Refunded
        </Badge>
      )
    case "DISPUTED":
      return <Badge variant="destructive">Disputed</Badge>
    case "PENDING":
      return <Badge variant="secondary">Pending</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}
