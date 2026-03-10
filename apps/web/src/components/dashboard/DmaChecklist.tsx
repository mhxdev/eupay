"use client"

import { useTransition } from "react"
import Link from "next/link"
import { CheckCircle2, Circle, ExternalLink } from "lucide-react"
import { updateDmaChecklist } from "@/lib/actions"
import type { DmaChecklistKey } from "@/lib/actions"

export type DmaStepDef = {
  key: DmaChecklistKey
  title: string
  description: string
  href?: string
  hrefLabel?: string
  external?: boolean
  href2?: string
  href2Label?: string
  autoDetected?: boolean
}

export function DmaChecklist({
  appId,
  steps,
  state,
}: {
  appId: string
  steps: DmaStepDef[]
  state: Record<string, boolean>
}) {
  return (
    <ul className="space-y-3">
      {steps.map((step, idx) => {
        const completed = state[step.key] ?? false
        return (
          <DmaChecklistItem
            key={step.key}
            appId={appId}
            step={step}
            index={idx}
            completed={completed}
          />
        )
      })}
    </ul>
  )
}

function DmaChecklistItem({
  appId,
  step,
  index,
  completed,
}: {
  appId: string
  step: DmaStepDef
  index: number
  completed: boolean
}) {
  const [isPending, startTransition] = useTransition()

  function handleToggle() {
    if (step.autoDetected) return
    startTransition(async () => {
      await updateDmaChecklist(appId, step.key, !completed)
    })
  }

  return (
    <li
      className={`rounded-md border p-4 transition-colors ${
        completed
          ? "border-l-4 border-l-teal-500 border-t-border border-r-border border-b-border bg-teal-500/5"
          : "border-l-4 border-l-muted border-t-border border-r-border border-b-border"
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={handleToggle}
          disabled={isPending || step.autoDetected}
          className="mt-0.5 shrink-0"
          title={step.autoDetected ? "Auto-detected" : completed ? "Mark incomplete" : "Mark complete"}
        >
          {completed ? (
            <CheckCircle2 className="h-5 w-5 text-teal-500" />
          ) : (
            <Circle className={`h-5 w-5 ${isPending ? "text-muted-foreground/50 animate-pulse" : "text-muted-foreground"}`} />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={`text-sm font-medium ${completed ? "text-teal-400" : ""}`}>
              Step {index + 1}: {step.title}
            </p>
            {step.autoDetected && completed && (
              <span className="text-xs text-muted-foreground">Auto-detected</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {step.description}
          </p>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {step.href && (
              <StepLink href={step.href} label={step.hrefLabel ?? "Open"} external={step.external} />
            )}
            {step.href2 && (
              <StepLink href={step.href2} label={step.href2Label ?? "Open"} external={false} />
            )}
          </div>
        </div>
      </div>
    </li>
  )
}

function StepLink({
  href,
  label,
  external,
}: {
  href: string
  label: string
  external?: boolean
}) {
  return (
    <Link
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="inline-flex items-center gap-1 text-xs text-teal-500 hover:text-teal-400"
    >
      {label}
      {external && <ExternalLink className="h-3 w-3" />}
    </Link>
  )
}
