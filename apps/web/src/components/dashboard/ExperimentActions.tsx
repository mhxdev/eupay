"use client"

import { useTransition } from "react"
import { updateExperimentStatus, deleteExperiment } from "@/lib/actions"
import { Button } from "@/components/ui/button"
import { Play, Pause, CheckCircle, Trash2 } from "lucide-react"

export function ExperimentStatusButton({
  experimentId,
  currentStatus,
}: {
  experimentId: string
  currentStatus: string
}) {
  const [isPending, startTransition] = useTransition()

  if (currentStatus === "COMPLETED") return null

  const nextStatus =
    currentStatus === "DRAFT" || currentStatus === "PAUSED"
      ? ("RUNNING" as const)
      : ("PAUSED" as const)

  const label =
    currentStatus === "DRAFT"
      ? "Start"
      : currentStatus === "PAUSED"
      ? "Resume"
      : "Pause"

  const Icon = nextStatus === "RUNNING" ? Play : Pause

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await updateExperimentStatus(experimentId, nextStatus)
        })
      }
    >
      <Icon className="h-3 w-3 mr-1" /> {label}
    </Button>
  )
}

export function ExperimentCompleteButton({
  experimentId,
  currentStatus,
}: {
  experimentId: string
  currentStatus: string
}) {
  const [isPending, startTransition] = useTransition()

  if (currentStatus !== "RUNNING" && currentStatus !== "PAUSED") return null

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await updateExperimentStatus(experimentId, "COMPLETED")
        })
      }
    >
      <CheckCircle className="h-3 w-3 mr-1" /> Complete
    </Button>
  )
}

export function ExperimentDeleteButton({
  experimentId,
  currentStatus,
}: {
  experimentId: string
  currentStatus: string
}) {
  const [isPending, startTransition] = useTransition()

  if (currentStatus !== "DRAFT") return null

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await deleteExperiment(experimentId)
        })
      }
    >
      <Trash2 className="h-3 w-3" />
    </Button>
  )
}
