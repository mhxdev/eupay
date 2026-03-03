"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Loader2, Send } from "lucide-react"

export function ReportAllPendingButton({
  appId,
  transactionIds,
}: {
  appId: string
  transactionIds: string[]
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)

  async function handleReportAll() {
    setLoading(true)
    setProgress(0)
    let succeeded = 0
    let failed = 0

    for (let i = 0; i < transactionIds.length; i++) {
      try {
        const res = await fetch("/api/v1/apple/report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ appId, transactionId: transactionIds[i] }),
        })
        const data = await res.json()
        if (res.ok && data.success) {
          succeeded++
        } else {
          failed++
        }
      } catch {
        failed++
      }
      setProgress(i + 1)
    }

    if (failed === 0) {
      toast.success(`All ${succeeded} transactions reported to Apple`)
    } else {
      toast.warning(`${succeeded} reported, ${failed} failed`)
    }

    setLoading(false)
    router.refresh()
  }

  if (transactionIds.length === 0) return null

  return (
    <Button onClick={handleReportAll} disabled={loading} size="sm">
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Reporting {progress}/{transactionIds.length}…
        </>
      ) : (
        <>
          <Send className="mr-2 h-4 w-4" />
          Report All Pending ({transactionIds.length})
        </>
      )}
    </Button>
  )
}
