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
import { CreateExperimentDialog } from "@/components/dashboard/CreateExperimentDialog"
import {
  ExperimentStatusButton,
  ExperimentCompleteButton,
  ExperimentDeleteButton,
} from "@/components/dashboard/ExperimentActions"
import { ArrowLeft } from "lucide-react"
import { getCurrencySymbol } from "@/lib/currencies"

export default async function ExperimentsPage({
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

  const experiments = await prisma.experiment.findMany({
    where: { appId },
    orderBy: { createdAt: "desc" },
    include: {
      variants: { orderBy: { createdAt: "asc" } },
      _count: { select: { assignments: true } },
      events: { select: { eventType: true, revenueCents: true, variantId: true } },
    },
  })

  const experimentRows = experiments.map((exp) => {
    const views = exp.events.filter((e) => e.eventType === "view").length
    const purchases = exp.events.filter((e) => e.eventType === "purchase").length
    const revenue = exp.events
      .filter((e) => e.eventType === "purchase" && e.revenueCents)
      .reduce((s, e) => s + (e.revenueCents ?? 0), 0)
    const convRate = views > 0 ? purchases / views : exp._count.assignments > 0 ? purchases / exp._count.assignments : 0
    const revPerUser = exp._count.assignments > 0 ? revenue / exp._count.assignments : 0
    const daysRunning = exp.status !== "DRAFT"
      ? Math.max(1, Math.ceil((Date.now() - exp.createdAt.getTime()) / 86400000))
      : 0

    return {
      ...exp,
      views,
      purchases,
      revenue,
      convRate,
      revPerUser,
      daysRunning,
      participants: exp._count.assignments,
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/apps/${appId}`}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-2xl font-bold">Experiments</h1>
        </div>
        <CreateExperimentDialog appId={appId} />
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {experimentRows.map((exp) => (
          <Link key={exp.id} href={`/dashboard/apps/${appId}/experiments/${exp.id}`}>
            <Card className="hover:border-primary/50 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">{exp.name}</CardTitle>
                  <StatusBadge status={exp.status} />
                </div>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-1">
                <p className="capitalize">{exp.placement.replace(/_/g, " ")} · {exp.variants.length} variants</p>
                <p>{exp.participants} participants · {(exp.convRate * 100).toFixed(1)}% conv.</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Desktop table */}
      <Card className="hidden md:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Placement</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Variants</TableHead>
                <TableHead className="text-right">Days</TableHead>
                <TableHead className="text-right">Participants</TableHead>
                <TableHead className="text-right">Conv. Rate</TableHead>
                <TableHead className="text-right">Rev/User</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {experimentRows.map((exp) => (
                <TableRow key={exp.id}>
                  <TableCell>
                    <Link
                      href={`/dashboard/apps/${appId}/experiments/${exp.id}`}
                      className="font-medium text-sm hover:underline"
                    >
                      {exp.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-xs capitalize">
                    {exp.placement.replace(/_/g, " ")}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={exp.status} />
                  </TableCell>
                  <TableCell className="text-xs">
                    {exp.variants.map((v) => v.name).join(", ")}
                  </TableCell>
                  <TableCell className="text-right text-xs">
                    {exp.daysRunning || "—"}
                  </TableCell>
                  <TableCell className="text-right">{exp.participants}</TableCell>
                  <TableCell className="text-right text-xs">
                    {(exp.convRate * 100).toFixed(1)}%
                  </TableCell>
                  <TableCell className="text-right text-xs font-mono">
                    {getCurrencySymbol("eur")}{(exp.revPerUser / 100).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <ExperimentStatusButton experimentId={exp.id} currentStatus={exp.status} />
                      <ExperimentCompleteButton experimentId={exp.id} currentStatus={exp.status} />
                      <ExperimentDeleteButton experimentId={exp.id} currentStatus={exp.status} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {experimentRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground">
                    No experiments yet. Create one to start testing.
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

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "RUNNING":
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20">Running</Badge>
    case "PAUSED":
      return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20">Paused</Badge>
    case "COMPLETED":
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20">Completed</Badge>
    default:
      return <Badge variant="secondary">Draft</Badge>
  }
}
