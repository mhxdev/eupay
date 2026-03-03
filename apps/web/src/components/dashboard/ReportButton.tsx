"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

export function ReportButton({ appId, transactionId }: { appId: string; transactionId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleReport() {
    setLoading(true)
    try {
      const res = await fetch("/api/v1/apple/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appId, transactionId }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error ?? "Report failed")
      }
      toast.success("Transaction reported to Apple")
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Report failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleReport} disabled={loading}>
      {loading ? "Reporting…" : "Report"}
    </Button>
  )
}
