import { auth } from "@clerk/nextjs/server"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ExperimentStatusButton,
  ExperimentCompleteButton,
} from "@/components/dashboard/ExperimentActions"
import {
  VariantBarChart,
  ParticipantTrendChart,
} from "@/components/dashboard/ExperimentCharts"
import { ArrowLeft } from "lucide-react"

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100)
}

function computeConfidence(
  variants: {
    name: string
    participants: number
    conversions: number
  }[]
): { label: string; color: string } {
  // Need at least 2 variants with 30+ participants
  const eligible = variants.filter((v) => v.participants >= 30)
  if (eligible.length < 2) {
    return { label: "Collecting data...", color: "text-muted-foreground" }
  }

  // Compare best vs second best by conversion rate
  const sorted = [...eligible].sort(
    (a, b) =>
      b.conversions / b.participants - a.conversions / a.participants
  )
  const a = sorted[0]
  const b = sorted[1]

  const p1 = a.conversions / a.participants
  const p2 = b.conversions / b.participants
  const pPool =
    (a.conversions + b.conversions) / (a.participants + b.participants)
  const se = Math.sqrt(
    pPool * (1 - pPool) * (1 / a.participants + 1 / b.participants)
  )

  if (se === 0) {
    return { label: "No significant difference yet", color: "text-muted-foreground" }
  }

  const z = Math.abs(p1 - p2) / se

  if (z > 1.96) {
    return {
      label: `Winner: ${a.name}`,
      color: "text-green-600 dark:text-green-400",
    }
  }
  if (z > 1.645) {
    return {
      label: `Likely winner: ${a.name}`,
      color: "text-amber-600 dark:text-amber-400",
    }
  }
  return { label: "No significant difference yet", color: "text-muted-foreground" }
}

export default async function ExperimentDetailPage({
  params,
}: {
  params: Promise<{ appId: string; experimentId: string }>
}) {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const { appId, experimentId } = await params

  const experiment = await prisma.experiment.findUnique({
    where: { id: experimentId },
    include: {
      app: { select: { clerkUserId: true, name: true } },
      variants: { orderBy: { createdAt: "asc" } },
      assignments: { select: { variantId: true, assignedAt: true } },
      events: {
        select: {
          variantId: true,
          eventType: true,
          revenueCents: true,
          createdAt: true,
        },
      },
    },
  })

  if (
    !experiment ||
    experiment.app.clerkUserId !== userId ||
    experiment.appId !== appId
  ) {
    notFound()
  }

  // Per-variant metrics
  const variantMetrics = experiment.variants.map((v) => {
    const assignments = experiment.assignments.filter(
      (a) => a.variantId === v.id
    )
    const varEvents = experiment.events.filter((e) => e.variantId === v.id)
    const views = varEvents.filter((e) => e.eventType === "view").length
    const purchases = varEvents.filter((e) => e.eventType === "purchase").length
    const revenue = varEvents
      .filter((e) => e.eventType === "purchase" && e.revenueCents)
      .reduce((s, e) => s + (e.revenueCents ?? 0), 0)
    const participants = assignments.length
    const convRate =
      views > 0
        ? purchases / views
        : participants > 0
        ? purchases / participants
        : 0
    const revPerUser = participants > 0 ? revenue / participants : 0

    return {
      id: v.id,
      name: v.name,
      allocationPercent: v.allocationPercent,
      config: v.config,
      participants,
      views,
      purchases,
      revenue,
      convRate,
      revPerUser,
    }
  })

  // Confidence
  const confidence = computeConfidence(
    variantMetrics.map((v) => ({
      name: v.name,
      participants: v.participants,
      conversions: v.purchases,
    }))
  )

  // Chart data
  const convRateData = variantMetrics.map((v) => ({
    name: v.name,
    value: v.convRate * 100,
  }))

  const revPerUserData = variantMetrics.map((v) => ({
    name: v.name,
    value: v.revPerUser,
  }))

  // Cumulative participant trend by day
  const variantNames = experiment.variants.map((v) => v.name)
  const variantIdToName = new Map(
    experiment.variants.map((v) => [v.id, v.name])
  )

  const dayMap = new Map<string, Record<string, number>>()
  // Sort assignments by date
  const sortedAssignments = [...experiment.assignments].sort(
    (a, b) => a.assignedAt.getTime() - b.assignedAt.getTime()
  )
  const cumulative: Record<string, number> = {}
  for (const name of variantNames) cumulative[name] = 0

  for (const a of sortedAssignments) {
    const day = a.assignedAt.toISOString().slice(0, 10)
    const vName = variantIdToName.get(a.variantId) ?? "Unknown"
    cumulative[vName] = (cumulative[vName] ?? 0) + 1
    dayMap.set(day, { ...cumulative })
  }

  const trendData = Array.from(dayMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, counts]) => ({
      date: new Date(date).toLocaleDateString("en-GB", {
        month: "short",
        day: "numeric",
      }),
      ...counts,
    }))

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/dashboard/apps/${appId}/experiments`}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{experiment.name}</h1>
          <p className="text-muted-foreground text-sm capitalize">
            {experiment.placement.replace(/_/g, " ")} · {experiment.app.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={experiment.status} />
          <ExperimentStatusButton
            experimentId={experiment.id}
            currentStatus={experiment.status}
          />
          <ExperimentCompleteButton
            experimentId={experiment.id}
            currentStatus={experiment.status}
          />
        </div>
      </div>

      {/* Config summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Experiment Configuration</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Targeting</span>
            <p className="font-medium">
              {experiment.targetNewUsersOnly ? "New users only" : "All users"}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">Start</span>
            <p className="font-medium">
              {experiment.startDate?.toLocaleDateString("en-GB") ?? "Immediate"}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">End</span>
            <p className="font-medium">
              {experiment.endDate?.toLocaleDateString("en-GB") ?? "Indefinite"}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">Total Participants</span>
            <p className="font-medium">
              {experiment.assignments.length}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Confidence indicator */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Statistical Confidence</p>
              <p className={`text-sm font-semibold ${confidence.color}`}>
                {confidence.label}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Z-test for proportions · min 30 participants per variant
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Results table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Per-Variant Results</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Variant</TableHead>
                <TableHead className="text-right">Allocation</TableHead>
                <TableHead className="text-right">Participants</TableHead>
                <TableHead className="text-right">Views</TableHead>
                <TableHead className="text-right">Purchases</TableHead>
                <TableHead className="text-right">Conv. Rate</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Rev/User</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {variantMetrics.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-medium text-sm">{v.name}</TableCell>
                  <TableCell className="text-right">{v.allocationPercent}%</TableCell>
                  <TableCell className="text-right">{v.participants}</TableCell>
                  <TableCell className="text-right">{v.views}</TableCell>
                  <TableCell className="text-right">{v.purchases}</TableCell>
                  <TableCell className="text-right">
                    {(v.convRate * 100).toFixed(1)}%
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(v.revenue)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(v.revPerUser)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Separator />

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Conversion Rate by Variant</CardTitle>
          </CardHeader>
          <CardContent>
            <VariantBarChart
              data={convRateData}
              valueLabel="Conversion Rate"
              formatValue={(v) => `${v.toFixed(1)}%`}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue per User by Variant</CardTitle>
          </CardHeader>
          <CardContent>
            <VariantBarChart
              data={revPerUserData}
              valueLabel="Rev/User"
              formatValue={(v) => `€${(v / 100).toFixed(2)}`}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Cumulative Participants Over Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ParticipantTrendChart data={trendData} variantNames={variantNames} />
        </CardContent>
      </Card>

      <Separator />

      {/* Variant configs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Variant Configurations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {variantMetrics.map((v) => (
            <div key={v.id}>
              <p className="text-sm font-medium mb-1">{v.name}</p>
              <pre className="rounded-lg bg-muted px-4 py-3 text-xs font-mono overflow-x-auto">
                {JSON.stringify(v.config, null, 2)}
              </pre>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "RUNNING":
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20">
          Running
        </Badge>
      )
    case "PAUSED":
      return (
        <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20">
          Paused
        </Badge>
      )
    case "COMPLETED":
      return (
        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20">
          Completed
        </Badge>
      )
    default:
      return <Badge variant="secondary">Draft</Badge>
  }
}
