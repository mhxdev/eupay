import { auth } from "@clerk/nextjs/server"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
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
  OutcomePieChart,
  CancelReasonsChart,
  SaveRateTrendChart,
} from "@/components/dashboard/RetentionCharts"
import { ArrowLeft } from "lucide-react"

export default async function RetentionAnalyticsPage({
  params,
}: {
  params: Promise<{ appId: string }>
}) {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const { appId } = await params

  const app = await prisma.app.findUnique({
    where: { id: appId },
    select: { clerkUserId: true, name: true },
  })
  if (!app || app.clerkUserId !== userId) notFound()

  const events = await prisma.cancelEvent.findMany({
    where: { appId },
    orderBy: { createdAt: "desc" },
    include: {
      customer: { select: { externalUserId: true } },
      entitlement: { include: { product: { select: { name: true } } } },
    },
  })

  // Metrics
  const total = events.length
  const saved = events.filter((e) => e.outcome !== "CANCELLED" && e.outcome !== "PENDING").length
  const cancelled = events.filter((e) => e.outcome === "CANCELLED").length
  const saveRate = total > 0 ? Math.round((saved / total) * 100) : 0

  // Outcome distribution
  const outcomeData = [
    { name: "Saved (Discount)", value: events.filter((e) => e.outcome === "SAVED_DISCOUNT").length },
    { name: "Saved (Pause)", value: events.filter((e) => e.outcome === "SAVED_PAUSE").length },
    { name: "Saved (Downgrade)", value: events.filter((e) => e.outcome === "SAVED_DOWNGRADE").length },
    { name: "Cancelled", value: cancelled },
  ]

  // Cancel reasons
  const reasonMap = new Map<string, number>()
  events.forEach((e) => {
    if (e.reason) {
      reasonMap.set(e.reason, (reasonMap.get(e.reason) ?? 0) + 1)
    }
  })
  const reasonData = Array.from(reasonMap.entries())
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  // Weekly save rate trend (last 12 weeks)
  const twelveWeeksAgo = new Date()
  twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84)
  const recentEvents = events.filter((e) => e.createdAt >= twelveWeeksAgo)

  const weekMap = new Map<string, { saved: number; total: number }>()
  recentEvents.forEach((e) => {
    const weekStart = new Date(e.createdAt)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    const key = weekStart.toISOString().slice(0, 10)
    const entry = weekMap.get(key) ?? { saved: 0, total: 0 }
    entry.total++
    if (e.outcome !== "CANCELLED" && e.outcome !== "PENDING") entry.saved++
    weekMap.set(key, entry)
  })

  const trendData = Array.from(weekMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, { saved: s, total: t }]) => ({
      date: new Date(date).toLocaleDateString("en-GB", { month: "short", day: "numeric" }),
      saveRate: t > 0 ? Math.round((s / t) * 100) : 0,
    }))

  // Recent events
  const recentList = events.slice(0, 20)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/dashboard/apps/${appId}/retention`}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-2xl font-bold">Retention Analytics</h1>
      </div>

      {/* Metric cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Events</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Saved</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{saved}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Cancelled</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{cancelled}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Save Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{saveRate}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Outcome Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <OutcomePieChart data={outcomeData} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cancel Reasons</CardTitle>
          </CardHeader>
          <CardContent>
            <CancelReasonsChart data={reasonData} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Save Rate Trend (12 weeks)</CardTitle>
        </CardHeader>
        <CardContent>
          <SaveRateTrendChart data={trendData} />
        </CardContent>
      </Card>

      {/* Recent events table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Cancel Events</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Outcome</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentList.map((evt) => (
                <TableRow key={evt.id}>
                  <TableCell className="font-mono text-xs">
                    {evt.customer.externalUserId.slice(0, 16)}
                    {evt.customer.externalUserId.length > 16 ? "..." : ""}
                  </TableCell>
                  <TableCell className="text-sm">{evt.entitlement.product.name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {evt.reason ?? "—"}
                  </TableCell>
                  <TableCell>
                    <OutcomeBadge outcome={evt.outcome} />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {evt.createdAt.toLocaleDateString("en-GB")}
                  </TableCell>
                </TableRow>
              ))}
              {recentList.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No cancel events yet
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

function OutcomeBadge({ outcome }: { outcome: string }) {
  switch (outcome) {
    case "SAVED_DISCOUNT":
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20">Saved (Discount)</Badge>
    case "SAVED_PAUSE":
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20">Saved (Pause)</Badge>
    case "SAVED_DOWNGRADE":
      return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20">Saved (Downgrade)</Badge>
    case "CANCELLED":
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20">Cancelled</Badge>
    default:
      return <Badge variant="outline">Pending</Badge>
  }
}
