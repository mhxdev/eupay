"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  PartyPopper,
} from "lucide-react"

export type ChecklistData = {
  hasApp: boolean
  hasProduct: boolean
  hasWebhook: boolean
  dmaConfirmed: boolean
}

type Step = {
  key: string
  title: string
  description: string
  alwaysComplete?: boolean
  href?: string
  external?: boolean
  manual?: boolean
}

const STEPS: Step[] = [
  {
    key: "account",
    title: "Create your EuroPay account",
    description: "Sign up for EuroPay and complete onboarding.",
    alwaysComplete: true,
  },
  {
    key: "app",
    title: "Create your first app",
    description: "Register your iOS app with its bundle ID.",
    href: "/dashboard/apps",
  },
  {
    key: "sdk",
    title: "Install EuroPayKit SDK",
    description: "Add the Swift package to your Xcode project.",
    href: "/docs/integration-guide",
    manual: true,
  },
  {
    key: "product",
    title: "Create your first product",
    description: "Set up a subscription or one-time purchase in your app.",
    href: "/dashboard/apps",
  },
  {
    key: "webhook",
    title: "Configure a webhook endpoint",
    description: "Receive real-time payment event notifications.",
    href: "/docs/api-reference",
  },
  {
    key: "dma",
    title: "Request Apple DMA entitlement",
    description:
      "Apply for the External Purchase Link entitlement in App Store Connect.",
    href: "https://developer.apple.com/contact/request/alternative-distribution-EU",
    external: true,
    manual: true,
  },
  {
    key: "live",
    title: "Go live",
    description:
      "Once Apple approves your entitlement, confirm it in your app settings.",
    href: "/dashboard/apps",
  },
]

function isStepComplete(step: Step, data: ChecklistData): boolean {
  if (step.alwaysComplete) return true
  switch (step.key) {
    case "app":
      return data.hasApp
    case "product":
      return data.hasProduct
    case "webhook":
      return data.hasWebhook
    case "live":
      return data.dmaConfirmed
    default:
      return false
  }
}

export function OnboardingChecklist({ data }: { data: ChecklistData }) {
  const [collapsed, setCollapsed] = useState(false)

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
        <CardContent className="pt-0">
          <ul className="space-y-3">
            {STEPS.map((step) => {
              const complete = isStepComplete(step, data)
              return (
                <li key={step.key} className="flex items-start gap-3">
                  {complete ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-500" />
                  ) : (
                    <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm font-medium ${complete ? "text-muted-foreground line-through" : ""}`}
                    >
                      {step.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                  {!complete && step.href && (
                    <Link
                      href={step.href}
                      target={step.external ? "_blank" : undefined}
                      rel={step.external ? "noopener noreferrer" : undefined}
                      className="mt-0.5 shrink-0 text-xs text-teal-500 hover:text-teal-400 flex items-center gap-1"
                    >
                      {step.external ? "Open" : "Go"}
                      {step.external && (
                        <ExternalLink className="h-3 w-3" />
                      )}
                    </Link>
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
