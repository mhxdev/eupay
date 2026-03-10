"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  PartyPopper,
  AlertTriangle,
  Key,
  Eye,
  EyeOff,
  Copy,
  Check,
} from "lucide-react"
import { createApiKeyForApp, revokeApiKey } from "@/lib/actions"

export type ChecklistData = {
  hasApp: boolean
  appId: string | null
  hasStripe: boolean
  hasProduct: boolean
  hasSdkUsage: boolean
  hasTestTransaction: boolean
  dmaConfirmed: boolean
  isLive: boolean
  activeKeyIds: string[]
}

type Step = {
  key: string
  title: string
  description: string
  alwaysComplete?: boolean
  href?: string
  external?: boolean
  linkLabel?: string
  expandable?: boolean
}

const STEPS: Step[] = [
  {
    key: "account",
    title: "Create your account",
    description: "Sign up for EuroPay and complete onboarding.",
    alwaysComplete: true,
  },
  {
    key: "app",
    title: "Create your app",
    description: "Register your iOS app with its bundle ID.",
    alwaysComplete: true,
  },
  {
    key: "stripe",
    title: "Connect Stripe",
    description: "Connect your Stripe account to receive payments.",
    linkLabel: "Go",
  },
  {
    key: "keys",
    title: "Get your API keys",
    description: "Copy your test and live API keys for EuroPayKit.",
    expandable: true,
    linkLabel: "View",
  },
  {
    key: "product",
    title: "Create a product",
    description: "Set up a subscription or one-time purchase.",
    linkLabel: "Go",
  },
  {
    key: "sdk",
    title: "Integrate the SDK",
    description: "Add EuroPayKit to your Xcode project.",
    href: "/docs/getting-started",
    linkLabel: "Docs",
  },
  {
    key: "test",
    title: "Make a test purchase",
    description: "Verify your integration works end-to-end.",
    href: "/docs/getting-started#testing",
    linkLabel: "Guide",
  },
  {
    key: "dma",
    title: "Request Apple DMA entitlement",
    description: "Follow the DMA compliance setup guide.",
    linkLabel: "Setup guide",
  },
  {
    key: "live",
    title: "Go live",
    description: "Switch to production when ready.",
    linkLabel: "Go",
  },
]

function isStepComplete(step: Step, data: ChecklistData): boolean {
  if (step.alwaysComplete) return true
  switch (step.key) {
    case "stripe":
      return data.hasStripe
    case "keys":
      return true // always complete (auto-generated)
    case "product":
      return data.hasProduct
    case "sdk":
      return data.hasSdkUsage || data.hasTestTransaction
    case "test":
      return data.hasTestTransaction
    case "dma":
      return data.dmaConfirmed
    case "live":
      return data.isLive
    default:
      return false
  }
}

function getStepHref(step: Step, data: ChecklistData): string | undefined {
  if (step.href) return step.href
  if (!data.appId) return undefined
  switch (step.key) {
    case "stripe":
      return `/dashboard/apps/${data.appId}`
    case "product":
      return `/dashboard/apps/${data.appId}/products`
    case "dma":
      return `/dashboard/apps/${data.appId}/dma-checklist`
    case "live":
      return `/dashboard/apps/${data.appId}`
    default:
      return undefined
  }
}

// ── API Key Section (expandable inside checklist) ────────────────

function ApiKeySection({
  appId,
  activeKeyIds,
  generatedTestKey,
  generatedLiveKey,
  onKeysGenerated,
}: {
  appId: string
  activeKeyIds: string[]
  generatedTestKey: string | null
  generatedLiveKey: string | null
  onKeysGenerated: (testKey: string, liveKey: string) => void
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleGenerateNewKeys() {
    setError(null)
    startTransition(async () => {
      try {
        // Revoke existing active keys
        for (const keyId of activeKeyIds) {
          await revokeApiKey(keyId)
        }
        // Generate new pair
        const testResult = await createApiKeyForApp(appId, "Test", "test")
        const liveResult = await createApiKeyForApp(appId, "Live", "live")
        onKeysGenerated(testResult.apiKey, liveResult.apiKey)
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to generate keys")
      }
    })
  }

  if (generatedTestKey && generatedLiveKey) {
    return (
      <div className="mt-3 space-y-3 rounded-md border border-border bg-muted/30 p-3">
        <div className="rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2">
          <p className="text-xs font-medium text-amber-500">
            Save these keys now — they won&apos;t be shown again
          </p>
        </div>
        <KeyDisplay label="Test Key (development)" apiKey={generatedTestKey} />
        <KeyDisplay label="Live Key (production)" apiKey={generatedLiveKey} />
        <p className="text-xs text-amber-500">
          Only use the live key when you&apos;re ready to accept real payments.
        </p>
      </div>
    )
  }

  return (
    <div className="mt-3 space-y-2 rounded-md border border-border bg-muted/30 p-3">
      <p className="text-xs text-muted-foreground">
        Your API keys were generated when you created your app. If you
        didn&apos;t save them, generate new ones below.
      </p>
      <Button
        variant="outline"
        size="sm"
        onClick={handleGenerateNewKeys}
        disabled={isPending}
      >
        <Key className="h-3.5 w-3.5 mr-1.5" />
        {isPending ? "Generating..." : "Generate New Keys"}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

function KeyDisplay({ label, apiKey }: { label: string; apiKey: string }) {
  const [visible, setVisible] = useState(false)
  const [copied, setCopied] = useState(false)

  const masked = apiKey.slice(0, 12) + "\u2022".repeat(20)

  function handleCopy() {
    navigator.clipboard.writeText(apiKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div>
      <p className="text-xs font-medium text-foreground mb-1">{label}</p>
      <div className="flex items-center gap-1.5">
        <code className="flex-1 rounded bg-background px-2 py-1.5 text-xs font-mono break-all select-all">
          {visible ? apiKey : masked}
        </code>
        <button
          onClick={() => setVisible(!visible)}
          className="shrink-0 rounded p-1.5 text-muted-foreground hover:text-foreground"
          title={visible ? "Hide" : "Show"}
        >
          {visible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </button>
        <button
          onClick={handleCopy}
          className="shrink-0 rounded p-1.5 text-muted-foreground hover:text-foreground"
          title="Copy"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  )
}

// ── Main Checklist Component ─────────────────────────────────────

export function OnboardingChecklist({ data }: { data: ChecklistData }) {
  const [collapsed, setCollapsed] = useState(false)
  const [expandedKey, setExpandedKey] = useState<string | null>(null)
  const [generatedTestKey, setGeneratedTestKey] = useState<string | null>(null)
  const [generatedLiveKey, setGeneratedLiveKey] = useState<string | null>(null)

  const completedCount = STEPS.filter((s) => isStepComplete(s, data)).length
  const allComplete = completedCount === STEPS.length

  if (allComplete) {
    return (
      <Card className="border-teal-500/30 bg-teal-500/5">
        <CardContent className="flex items-center gap-3 py-4">
          <PartyPopper className="h-5 w-5 text-teal-400 shrink-0" />
          <div>
            <p className="text-sm font-medium text-teal-300">
              You&apos;re live!
            </p>
            <p className="text-xs text-teal-400/70">
              Your app is fully set up and accepting EU payments.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Find the first incomplete step that isn't "keys" (since keys are always "complete")
  const nextActionKey = STEPS.find(
    (s) => !isStepComplete(s, data)
  )?.key

  return (
    <Card>
      <CardHeader
        className="cursor-pointer select-none pb-3"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {collapsed ? (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
            <CardTitle className="text-base">Getting Started</CardTitle>
            <Badge variant="secondary" className="text-xs">
              {completedCount}/{STEPS.length}
            </Badge>
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-teal-500 transition-all"
            style={{ width: `${(completedCount / STEPS.length) * 100}%` }}
          />
        </div>
      </CardHeader>

      {!collapsed && (
        <CardContent className="pt-0 space-y-2">
          {/* Stripe callout when not connected */}
          {!data.hasStripe && data.appId && (
            <div className="mb-3 flex items-center gap-3 rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2.5">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-amber-500">
                  Connect Stripe to start accepting payments
                </p>
                <p className="text-xs text-amber-500/70">
                  Required before you can create products or process transactions.
                </p>
              </div>
              <Link
                href={`/dashboard/apps/${data.appId}`}
                className="shrink-0 rounded-md bg-amber-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-400 transition-colors"
              >
                Connect
              </Link>
            </div>
          )}

          <ul className="space-y-3">
            {STEPS.map((step) => {
              const complete = isStepComplete(step, data)
              const isNext = step.key === nextActionKey
              const href = getStepHref(step, data)
              const isExpanded = expandedKey === step.key

              return (
                <li key={step.key}>
                  <div className={`flex items-start gap-3 ${isNext ? "rounded-md bg-muted/50 -mx-2 px-2 py-1.5" : ""}`}>
                    {complete ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-500" />
                    ) : (
                      <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-sm font-medium ${complete && step.key !== "keys" ? "text-muted-foreground line-through" : ""}`}
                      >
                        {step.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                    {step.expandable && data.appId ? (
                      <button
                        onClick={() => setExpandedKey(isExpanded ? null : step.key)}
                        className="mt-0.5 shrink-0 text-xs text-teal-500 hover:text-teal-400"
                      >
                        {isExpanded ? "Hide" : step.linkLabel ?? "View"}
                      </button>
                    ) : href ? (
                      <Link
                        href={href}
                        target={step.external ? "_blank" : undefined}
                        rel={step.external ? "noopener noreferrer" : undefined}
                        className="mt-0.5 shrink-0 text-xs text-teal-500 hover:text-teal-400 flex items-center gap-1"
                      >
                        {step.linkLabel ?? "Go"}
                        {step.external && (
                          <ExternalLink className="h-3 w-3" />
                        )}
                      </Link>
                    ) : null}
                  </div>

                  {/* Expandable API key section */}
                  {step.key === "keys" && isExpanded && data.appId && (
                    <div className="ml-7">
                      <ApiKeySection
                        appId={data.appId}
                        activeKeyIds={data.activeKeyIds}
                        generatedTestKey={generatedTestKey}
                        generatedLiveKey={generatedLiveKey}
                        onKeysGenerated={(t, l) => {
                          setGeneratedTestKey(t)
                          setGeneratedLiveKey(l)
                        }}
                      />
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </CardContent>
      )}
    </Card>
  )
}
