"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function ModeToggle({ appId, mode }: { appId: string; mode: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showConfirm, setShowConfirm] = useState(false)

  const isSandbox = mode === "sandbox"

  async function switchMode(newMode: "sandbox" | "live") {
    startTransition(async () => {
      await fetch(`/api/v1/apps/${appId}/mode`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: newMode }),
      })
      router.refresh()
    })
  }

  function handleToggleClick() {
    if (isSandbox) {
      // Switching to live — confirm first
      setShowConfirm(true)
    } else {
      // Switching to sandbox — no confirmation
      switchMode("sandbox")
    }
  }

  function handleConfirmLive() {
    setShowConfirm(false)
    switchMode("live")
  }

  return (
    <>
      <div className="flex items-center gap-3">
        {isSandbox ? (
          <Badge className="bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20">
            SANDBOX
          </Badge>
        ) : (
          <Badge className="bg-teal-100 text-teal-800 border-teal-300 hover:bg-teal-100 dark:bg-teal-500/10 dark:text-teal-400 dark:border-teal-500/20">
            LIVE
          </Badge>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={handleToggleClick}
          disabled={isPending}
        >
          {isPending
            ? "Switching..."
            : isSandbox
              ? "Switch to Live"
              : "Switch to Sandbox"}
        </Button>
      </div>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Switch to Live Mode?</DialogTitle>
            <DialogDescription>
              Are you sure? Live mode processes real payments. Make sure your
              Stripe account is configured and your app is ready for production.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmLive} disabled={isPending}>
              {isPending ? "Switching..." : "Yes, go live"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
