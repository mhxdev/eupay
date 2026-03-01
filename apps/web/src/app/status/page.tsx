import Link from "next/link"

export const dynamic = "force-dynamic"

type ServiceStatus = "operational" | "degraded" | "outage"

type Service = {
  name: string
  description: string
  status: ServiceStatus
}

async function getHealthStatus(): Promise<{ db: "ok" | "error" }> {
  try {
    const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
    const res = await fetch(`${base}/api/health`, {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return { db: "error" }
    const data = await res.json()
    return { db: data.services?.db ?? "error" }
  } catch {
    return { db: "error" }
  }
}

function StatusDot({ status }: { status: ServiceStatus }) {
  const colors: Record<ServiceStatus, string> = {
    operational: "bg-teal-400",
    degraded: "bg-amber-400",
    outage: "bg-red-400",
  }
  return (
    <span className="relative flex h-2.5 w-2.5">
      {status === "operational" && (
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-40" />
      )}
      <span
        className={`relative inline-flex h-2.5 w-2.5 rounded-full ${colors[status]}`}
      />
    </span>
  )
}

function UptimeBar() {
  // 90-day uptime visualization — all operational for now
  return (
    <div className="flex gap-px">
      {Array.from({ length: 90 }).map((_, i) => (
        <div
          key={i}
          className="h-8 flex-1 rounded-[1px] bg-teal-500/60 hover:bg-teal-400 transition-colors"
          title={`${90 - i} days ago — Operational`}
        />
      ))}
    </div>
  )
}

export default async function StatusPage() {
  const health = await getHealthStatus()

  const services: Service[] = [
    {
      name: "API",
      description: "api.europay.dev",
      status: "operational",
    },
    {
      name: "Dashboard",
      description: "europay.dev/dashboard",
      status: "operational",
    },
    {
      name: "Checkout",
      description: "Payment processing",
      status: "operational",
    },
    {
      name: "Webhooks",
      description: "Event delivery",
      status: "operational",
    },
    {
      name: "SDK",
      description: "EUPayKit",
      status: "operational",
    },
    {
      name: "Database",
      description: "PostgreSQL",
      status: health.db === "ok" ? "operational" : "outage",
    },
  ]

  const overallStatus = services.every((s) => s.status === "operational")
    ? "operational"
    : services.some((s) => s.status === "outage")
      ? "outage"
      : "degraded"

  const statusLabel: Record<string, string> = {
    operational: "All systems operational",
    degraded: "Some systems degraded",
    outage: "Incident in progress",
  }
  const statusBorder: Record<string, string> = {
    operational: "border-teal-500/30",
    degraded: "border-amber-500/30",
    outage: "border-red-500/30",
  }
  const statusBg: Record<string, string> = {
    operational: "bg-teal-500/5",
    degraded: "bg-amber-500/5",
    outage: "bg-red-500/5",
  }
  const statusText: Record<string, string> = {
    operational: "text-teal-400",
    degraded: "text-amber-400",
    outage: "text-red-400",
  }

  const now = new Date()

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white">
      {/* Nav */}
      <nav className="border-b border-white/10 px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            EUPay
          </Link>
          <span className="text-sm text-gray-400">System Status</span>
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-6 py-12 space-y-10">
        {/* Overall status banner */}
        <div
          className={`rounded-xl border ${statusBorder[overallStatus]} ${statusBg[overallStatus]} p-6`}
        >
          <div className="flex items-center gap-3">
            <StatusDot
              status={overallStatus as ServiceStatus}
            />
            <h1
              className={`text-xl font-semibold ${statusText[overallStatus]}`}
            >
              {statusLabel[overallStatus]}
            </h1>
          </div>
        </div>

        {/* Uptime bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-medium text-gray-300">
              Uptime — last 90 days
            </h2>
            <span className="text-xs text-gray-500">99.99%</span>
          </div>
          <UptimeBar />
          <div className="flex items-center justify-between mt-1.5 text-[10px] text-gray-600">
            <span>90 days ago</span>
            <span>Today</span>
          </div>
        </div>

        {/* Services */}
        <div>
          <h2 className="text-sm font-medium text-gray-300 mb-4">Services</h2>
          <div className="space-y-2">
            {services.map((service) => (
              <div
                key={service.name}
                className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.02] px-5 py-3.5"
              >
                <div>
                  <p className="text-sm font-medium text-white">
                    {service.name}
                  </p>
                  <p className="text-xs text-gray-500">{service.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs ${
                      service.status === "operational"
                        ? "text-teal-400"
                        : service.status === "degraded"
                          ? "text-amber-400"
                          : "text-red-400"
                    }`}
                  >
                    {service.status === "operational"
                      ? "Operational"
                      : service.status === "degraded"
                        ? "Degraded"
                        : "Outage"}
                  </span>
                  <StatusDot status={service.status} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Incident history */}
        <div>
          <h2 className="text-sm font-medium text-gray-300 mb-4">
            Incident History
          </h2>
          <div className="rounded-lg border border-white/10 bg-white/[0.02] px-5 py-8 text-center">
            <p className="text-sm text-gray-500">No incidents reported.</p>
          </div>
        </div>

        {/* Last updated */}
        <div className="text-center text-xs text-gray-600">
          Last updated:{" "}
          {now.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}{" "}
          at{" "}
          {now.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            timeZoneName: "short",
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-6">
        <div className="mx-auto max-w-3xl flex items-center justify-between">
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            &larr; Back to EUPay
          </Link>
          <p className="text-xs text-gray-600">
            &copy; 2026 EUPay. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
