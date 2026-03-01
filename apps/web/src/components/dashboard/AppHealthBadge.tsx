import { CheckCircle2, XCircle } from "lucide-react"

export type HealthData = {
  hasActiveProduct: boolean
  hasWebhook: boolean
  dmaConfirmed: boolean
  hasRecentTransaction: boolean
}

type HealthLevel = "healthy" | "attention" | "not-configured"

function getHealthScore(data: HealthData): number {
  let score = 0
  if (data.hasActiveProduct) score += 25
  if (data.hasWebhook) score += 25
  if (data.dmaConfirmed) score += 25
  if (data.hasRecentTransaction) score += 25
  return score
}

function getHealthLevel(score: number): HealthLevel {
  if (score === 100) return "healthy"
  if (score >= 50) return "attention"
  return "not-configured"
}

const LEVEL_CONFIG: Record<HealthLevel, { label: string; dotClass: string; textClass: string }> = {
  healthy: {
    label: "Healthy",
    dotClass: "bg-green-500",
    textClass: "text-green-700 dark:text-green-400",
  },
  attention: {
    label: "Needs attention",
    dotClass: "bg-amber-500",
    textClass: "text-amber-700 dark:text-amber-400",
  },
  "not-configured": {
    label: "Not configured",
    dotClass: "bg-gray-400 dark:bg-gray-500",
    textClass: "text-gray-500 dark:text-gray-400",
  },
}

const CHECKS = [
  { key: "hasActiveProduct" as const, label: "Active product" },
  { key: "hasWebhook" as const, label: "Webhook configured" },
  { key: "dmaConfirmed" as const, label: "DMA entitlement confirmed" },
  { key: "hasRecentTransaction" as const, label: "Recent transaction (30d)" },
]

export function AppHealthBadge({
  data,
  showDetails = false,
}: {
  data: HealthData
  showDetails?: boolean
}) {
  const score = getHealthScore(data)
  const level = getHealthLevel(score)
  const config = LEVEL_CONFIG[level]

  return (
    <div>
      <div className="flex items-center gap-1.5">
        <span className={`inline-block h-2 w-2 rounded-full ${config.dotClass}`} />
        <span className={`text-xs font-medium ${config.textClass}`}>
          {config.label}
        </span>
      </div>

      {showDetails && (
        <ul className="mt-3 space-y-1.5">
          {CHECKS.map((check) => {
            const passed = data[check.key]
            return (
              <li key={check.key} className="flex items-center gap-2">
                {passed ? (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-500" />
                ) : (
                  <XCircle className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                )}
                <span className={`text-xs ${passed ? "text-foreground" : "text-muted-foreground"}`}>
                  {check.label}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
