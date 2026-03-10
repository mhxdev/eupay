"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { syncProductsToStripe } from "@/lib/actions"

export function SyncProductsButton({ appId }: { appId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<string | null>(null)

  function handleSync() {
    setResult(null)
    startTransition(async () => {
      try {
        const res = await syncProductsToStripe(appId)
        setResult(`Synced ${res.synced}/${res.total} products`)
        router.refresh()
      } catch (e) {
        setResult(e instanceof Error ? e.message : "Sync failed")
      }
    })
  }

  return (
    <div className="flex items-center gap-2 shrink-0">
      <Button
        variant="outline"
        size="sm"
        onClick={handleSync}
        disabled={isPending}
      >
        <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isPending ? "animate-spin" : ""}`} />
        {isPending ? "Syncing..." : "Sync to Stripe"}
      </Button>
      {result && (
        <span className="text-xs text-muted-foreground">{result}</span>
      )}
    </div>
  )
}
