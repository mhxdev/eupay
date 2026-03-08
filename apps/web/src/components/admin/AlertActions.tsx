"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { acknowledgeAlert, resolveAlert } from "@/lib/actions"

export function AlertActions({
  alertId,
  status,
}: {
  alertId: string
  status: string
}) {
  const [isPending, startTransition] = useTransition()
  const [note, setNote] = useState("")
  const [showResolve, setShowResolve] = useState(false)

  return (
    <div className="flex flex-col gap-2 shrink-0">
      {status === "OPEN" && (
        <Button
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              await acknowledgeAlert(alertId)
            })
          }
        >
          Acknowledge
        </Button>
      )}
      {!showResolve ? (
        <Button
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => setShowResolve(true)}
        >
          Resolve
        </Button>
      ) : (
        <div className="flex flex-col gap-1">
          <input
            type="text"
            placeholder="Resolution note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="text-xs border rounded px-2 py-1 bg-background w-40"
          />
          <Button
            size="sm"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                await resolveAlert(alertId, note || undefined)
              })
            }
          >
            Confirm Resolve
          </Button>
        </div>
      )}
    </div>
  )
}
