import { auth } from "@clerk/nextjs/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Bell, Info, Shield } from "lucide-react"
import { AlertActions } from "@/components/admin/AlertActions"

export default async function AlertsPage({
  searchParams,
}: {
  searchParams: Promise<{ severity?: string; status?: string }>
}) {
  const { userId } = await auth()
  if (userId !== process.env.ADMIN_CLERK_USER_ID) return notFound()

  const { severity, status } = await searchParams

  // Build filter
  const where: Record<string, unknown> = {}
  if (severity && ["CRITICAL", "WARNING", "INFO"].includes(severity)) {
    where.severity = severity
  }
  if (status && ["OPEN", "ACKNOWLEDGED", "RESOLVED"].includes(status)) {
    where.status = status
  } else if (!status) {
    // Default to showing open alerts
    where.status = "OPEN"
  }

  const [alerts, counts] = await Promise.all([
    prisma.platformAlert.findMany({
      where,
      orderBy: [{ severity: "asc" }, { createdAt: "desc" }],
      take: 100,
      include: { app: { select: { name: true } } },
    }),
    prisma.platformAlert.groupBy({
      by: ["severity", "status"],
      _count: true,
    }),
  ])

  const openCritical = counts
    .filter((c) => c.severity === "CRITICAL" && c.status === "OPEN")
    .reduce((s, c) => s + c._count, 0)
  const openWarning = counts
    .filter((c) => c.severity === "WARNING" && c.status === "OPEN")
    .reduce((s, c) => s + c._count, 0)
  const openInfo = counts
    .filter((c) => c.severity === "INFO" && c.status === "OPEN")
    .reduce((s, c) => s + c._count, 0)
  const totalOpen = openCritical + openWarning + openInfo

  const activeSeverity = severity ?? "all"
  const activeStatus = status ?? "OPEN"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Platform Alerts</h1>
        <p className="text-muted-foreground">
          Monitor critical issues, warnings, and informational events across the platform.
          Critical alerts require immediate action. Warning alerts indicate potential problems.
          Info alerts track notable events like new developer signups.
        </p>
      </div>

      {/* Summary badges */}
      <div className="flex gap-3 flex-wrap">
        <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-sm px-3 py-1">
          {openCritical} Critical
        </Badge>
        <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 text-sm px-3 py-1">
          {openWarning} Warning
        </Badge>
        <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-sm px-3 py-1">
          {openInfo} Info
        </Badge>
        <Badge variant="outline" className="text-sm px-3 py-1">
          {totalOpen} Total Open
        </Badge>
      </div>

      {/* Filter bar */}
      <div className="flex gap-2 flex-wrap">
        <span className="text-sm text-muted-foreground self-center mr-1">Severity:</span>
        {[
          { key: "all", label: "All" },
          { key: "CRITICAL", label: "Critical" },
          { key: "WARNING", label: "Warning" },
          { key: "INFO", label: "Info" },
        ].map((s) => (
          <Link
            key={s.key}
            href={`/admin/alerts?severity=${s.key === "all" ? "" : s.key}&status=${activeStatus === "OPEN" ? "" : activeStatus}`}
          >
            <Badge
              variant={activeSeverity === s.key ? "default" : "outline"}
              className="cursor-pointer"
            >
              {s.label}
            </Badge>
          </Link>
        ))}

        <span className="text-sm text-muted-foreground self-center ml-4 mr-1">Status:</span>
        {[
          { key: "OPEN", label: "Open" },
          { key: "ACKNOWLEDGED", label: "Acknowledged" },
          { key: "RESOLVED", label: "Resolved" },
          { key: "all", label: "All" },
        ].map((s) => (
          <Link
            key={s.key}
            href={`/admin/alerts?severity=${activeSeverity === "all" ? "" : activeSeverity}&status=${s.key === "OPEN" ? "" : s.key}`}
          >
            <Badge
              variant={activeStatus === s.key ? "default" : "outline"}
              className="cursor-pointer"
            >
              {s.label}
            </Badge>
          </Link>
        ))}
      </div>

      {/* Alert list */}
      {alerts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Shield className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No alerts match your filters</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <Card key={alert.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    {alert.severity === "CRITICAL" ? (
                      <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                    ) : alert.severity === "WARNING" ? (
                      <Bell className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
                    ) : (
                      <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <SeverityBadge severity={alert.severity} />
                        <StatusBadge status={alert.status} />
                        <span className="text-xs text-muted-foreground">
                          {alert.category}
                        </span>
                      </div>
                      <p className="font-medium mt-1">{alert.title}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {alert.description}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                        <span>{alert.createdAt.toLocaleDateString("en-GB")} {alert.createdAt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span>
                        {alert.app && <span>App: {alert.app.name}</span>}
                        {alert.developerUserId && (
                          <Link
                            href={`/admin/developers/${alert.developerUserId}`}
                            className="hover:text-foreground transition-colors underline"
                          >
                            View Developer
                          </Link>
                        )}
                        {alert.resolvedAt && (
                          <span>Resolved: {alert.resolvedAt.toLocaleDateString("en-GB")}</span>
                        )}
                        {alert.resolvedNote && (
                          <span>Note: {alert.resolvedNote}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {alert.status !== "RESOLVED" && (
                    <AlertActions alertId={alert.id} status={alert.status} />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function SeverityBadge({ severity }: { severity: string }) {
  switch (severity) {
    case "CRITICAL":
      return (
        <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
          Critical
        </Badge>
      )
    case "WARNING":
      return (
        <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
          Warning
        </Badge>
      )
    case "INFO":
      return (
        <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
          Info
        </Badge>
      )
    default:
      return <Badge variant="outline">{severity}</Badge>
  }
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "OPEN":
      return <Badge variant="destructive">Open</Badge>
    case "ACKNOWLEDGED":
      return <Badge variant="secondary">Acknowledged</Badge>
    case "RESOLVED":
      return (
        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
          Resolved
        </Badge>
      )
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}
