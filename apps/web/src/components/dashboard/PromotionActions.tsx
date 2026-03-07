"use client"

import { useTransition } from "react"
import { Button } from "@/components/ui/button"
import { togglePromotionStatus, deletePromotion } from "@/lib/actions"
import { Trash2 } from "lucide-react"

export function PromotionToggle({
  promotionId,
  isActive,
}: {
  promotionId: string
  isActive: boolean
}) {
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      variant={isActive ? "outline" : "secondary"}
      size="sm"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => { await togglePromotionStatus(promotionId, !isActive) })
      }
    >
      {isPending ? "..." : isActive ? "Pause" : "Activate"}
    </Button>
  )
}

export function PromotionDelete({
  promotionId,
}: {
  promotionId: string
}) {
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 text-destructive hover:text-destructive"
      disabled={isPending}
      onClick={() => {
        if (!confirm("Delete this promotion? This will also delete it from Stripe.")) return
        startTransition(async () => { await deletePromotion(promotionId) })
      }}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  )
}
