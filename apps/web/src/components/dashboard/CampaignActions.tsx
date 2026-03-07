"use client"

import { useTransition } from "react"
import { Button } from "@/components/ui/button"
import { updateCampaignStatus, deleteCampaign } from "@/lib/actions"
import { Trash2 } from "lucide-react"

export function CampaignStatusButton({
  campaignId,
  currentStatus,
}: {
  campaignId: string
  currentStatus: string
}) {
  const [isPending, startTransition] = useTransition()

  if (currentStatus === "ENDED") return null

  const nextStatus = currentStatus === "ACTIVE" ? "PAUSED" : "ACTIVE"
  const label = currentStatus === "DRAFT"
    ? "Activate"
    : currentStatus === "ACTIVE"
    ? "Pause"
    : "Resume"

  return (
    <Button
      variant={currentStatus === "ACTIVE" ? "outline" : "secondary"}
      size="sm"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await updateCampaignStatus(campaignId, nextStatus as "ACTIVE" | "PAUSED")
        })
      }
    >
      {isPending ? "..." : label}
    </Button>
  )
}

export function CampaignEndButton({
  campaignId,
  currentStatus,
}: {
  campaignId: string
  currentStatus: string
}) {
  const [isPending, startTransition] = useTransition()

  if (currentStatus === "ENDED" || currentStatus === "DRAFT") return null

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={() => {
        if (!confirm("End this campaign? This cannot be undone.")) return
        startTransition(async () => {
          await updateCampaignStatus(campaignId, "ENDED")
        })
      }}
    >
      {isPending ? "..." : "End"}
    </Button>
  )
}

export function CampaignDeleteButton({
  campaignId,
}: {
  campaignId: string
}) {
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 text-destructive hover:text-destructive"
      disabled={isPending}
      onClick={() => {
        if (!confirm("Delete this campaign and all its data?")) return
        startTransition(async () => {
          await deleteCampaign(campaignId)
        })
      }}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  )
}
