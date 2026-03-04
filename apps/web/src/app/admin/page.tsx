import { auth } from "@clerk/nextjs/server"
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
import { Users, Layers, CreditCard, DollarSign, Mail } from "lucide-react"

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100)
}

export default async function AdminPage() {
  const { userId } = await auth()
  if (userId !== process.env.ADMIN_CLERK_USER_ID) return notFound()

  // ── Platform stats ──────────────────────────────────────────
  const [
    allApps,
    txAgg,
    recentApps,
    recentTransactions,
    topApps,
    failedWebhooks,
    waitlistCount,
  ] = await Promise.all([
    prisma.app.findMany({ select: { id: true, clerkUserId: true } }),

    prisma.transaction.aggregate({
      where: { status: "SUCCEEDED" },
      _count: true,
      _sum: { amountTotal: true },
    }),

    // Recent developer accounts grouped by clerkUserId
    prisma.app.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        name: true,
        clerkUserId: true,
        stripeConnectId: true,
        createdAt: true,
        _count: { select: { transactions: true } },
        transactions: {
          where: { status: "SUCCEEDED" },
          select: { amountTotal: true },
        },
      },
    }),

    // Recent succeeded transactions
    prisma.transaction.findMany({
      where: { status: "SUCCEEDED" },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { app: { select: { name: true } } },
    }),

    // Top apps by volume
    prisma.transaction.groupBy({
      by: ["appId"],
      where: { status: "SUCCEEDED" },
      _count: true,
      _sum: { amountTotal: true },
      orderBy: { _sum: { amountTotal: "desc" } },
      take: 10,
    }),

    // Failed webhooks
    prisma.webhookEvent.findMany({
      where: { status: "FAILED" },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),

    // Waitlist count
    prisma.waitlistEntry.count(),
  ])

  const totalDevelopers = new Set(allApps.map((a) => a.clerkUserId)).size
  const totalApps = allApps.length
  const totalTxCount = txAgg._count
  const totalVolume = txAgg._sum.amountTotal ?? 0
  const europayRevenue = Math.round(totalVolume * 0.015)

  // Group recent apps by clerkUserId for developer table
  const developerMap = new Map<
    string,
    { clerkUserId: string; appCount: number; txCount: number; volume: number; stripeConnected: boolean; joinedAt: Date }
  >()
  for (const app of recentApps) {
    const existing = developerMap.get(app.clerkUserId)
    const appVolume = app.transactions.reduce((s, t) => s + t.amountTotal, 0)
    if (existing) {
      existing.appCount += 1
      existing.txCount += app._count.transactions
      existing.volume += appVolume
      existing.stripeConnected = existing.stripeConnected || !!app.stripeConnectId
      if (app.createdAt < existing.joinedAt) existing.joinedAt = app.createdAt
    } else {
      developerMap.set(app.clerkUserId, {
        clerkUserId: app.clerkUserId,
        appCount: 1,
        txCount: app._count.transactions,
        volume: appVolume,
        stripeConnected: !!app.stripeConnectId,
        joinedAt: app.createdAt,
      })
    }
  }
  const developers = [...developerMap.values()]
    .sort((a, b) => b.joinedAt.getTime() - a.joinedAt.getTime())
    .slice(0, 20)

  // Resolve app names for top apps
  const topAppIds = topApps.map((t) => t.appId)
  const topAppRecords = await prisma.app.findMany({
    where: { id: { in: topAppIds } },
    select: { id: true, name: true, bundleId: true },
  })
  const appLookup = new Map(topAppRecords.map((a) => [a.id, a]))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Platform Overview</h1>
        <p className="text-muted-foreground">
          Internal admin view — all developer accounts and transactions.
        </p>
      </div>

      {/* ── Stat cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard
          title="Developer Accounts"
          value={totalDevelopers.toString()}
          icon={<Users className="h-4 w-4" />}
        />
        <StatCard
          title="Total Apps"
          value={totalApps.toString()}
          icon={<Layers className="h-4 w-4" />}
        />
        <StatCard
          title="Transactions"
          value={totalTxCount.toLocaleString("de-DE")}
          sub={formatCurrency(totalVolume) + " volume"}
          icon={<CreditCard className="h-4 w-4" />}
        />
        <StatCard
          title="EuroPay Revenue"
          value={formatCurrency(europayRevenue)}
          sub="1.5% platform fee"
          icon={<DollarSign className="h-4 w-4" />}
        />
        <StatCard
          title="Waitlist"
          value={waitlistCount.toLocaleString("de-DE")}
          icon={<Mail className="h-4 w-4" />}
        />
      </div>

      {/* ── Recent developer accounts ──────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Developer Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User ID</TableHead>
                <TableHead className="text-right">Apps</TableHead>
                <TableHead className="text-right">Transactions</TableHead>
                <TableHead className="text-right">Volume</TableHead>
                <TableHead>Stripe</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {developers.map((dev) => (
                <TableRow key={dev.clerkUserId}>
                  <TableCell className="font-mono text-xs">
                    {dev.clerkUserId.slice(0, 16)}…
                  </TableCell>
                  <TableCell className="text-right">{dev.appCount}</TableCell>
                  <TableCell className="text-right">{dev.txCount}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(dev.volume)}
                  </TableCell>
                  <TableCell>
                    {dev.stripeConnected ? (
                      <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        Yes
                      </Badge>
                    ) : (
                      <Badge variant="secondary">No</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {dev.joinedAt.toLocaleDateString("en-GB")}
                  </TableCell>
                </TableRow>
              ))}
              {developers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No developer accounts yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── Recent transactions ────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction ID</TableHead>
                <TableHead>App</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>VAT Country</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentTransactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="font-mono text-xs">
                    {tx.id.slice(0, 12)}…
                  </TableCell>
                  <TableCell>{tx.app.name}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(tx.amountTotal)}
                  </TableCell>
                  <TableCell className="uppercase">{tx.currency}</TableCell>
                  <TableCell>
                    <StatusBadge status={tx.status} />
                  </TableCell>
                  <TableCell>{tx.vatCountry ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {tx.createdAt.toLocaleDateString("en-GB")}
                  </TableCell>
                </TableRow>
              ))}
              {recentTransactions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No transactions yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── Top apps by volume ─────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top Apps by Volume</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>App Name</TableHead>
                <TableHead>Bundle ID</TableHead>
                <TableHead className="text-right">Transactions</TableHead>
                <TableHead className="text-right">Total Volume</TableHead>
                <TableHead className="text-right">EuroPay Fee</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topApps.map((row) => {
                const app = appLookup.get(row.appId)
                const vol = row._sum.amountTotal ?? 0
                return (
                  <TableRow key={row.appId}>
                    <TableCell>{app?.name ?? row.appId}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {app?.bundleId ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">{row._count}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(vol)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(Math.round(vol * 0.015))}
                    </TableCell>
                  </TableRow>
                )
              })}
              {topApps.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No transaction data yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── Failed webhooks ────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Failed Webhooks</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Error</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {failedWebhooks.map((evt) => (
                <TableRow key={evt.id}>
                  <TableCell className="font-mono text-xs">
                    {evt.id.slice(0, 20)}…
                  </TableCell>
                  <TableCell className="text-xs">{evt.type}</TableCell>
                  <TableCell className="text-xs text-destructive max-w-xs truncate">
                    {evt.error ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {evt.createdAt.toLocaleDateString("en-GB")}
                  </TableCell>
                </TableRow>
              ))}
              {failedWebhooks.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No failed webhooks
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

// ── Helper components ───────────────────────────────────────────

function StatCard({
  title,
  value,
  sub,
  icon,
}: {
  title: string
  value: string
  sub?: string
  icon: React.ReactNode
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{title}</p>
          <span className="text-muted-foreground">{icon}</span>
        </div>
        <p className="text-2xl font-bold mt-1">{value}</p>
        {sub && (
          <p className="text-xs text-muted-foreground mt-1">{sub}</p>
        )}
      </CardContent>
    </Card>
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
