"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export function MarkReadButton({ regulatoryUpdateId }: { regulatoryUpdateId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleMarkRead() {
    setLoading(true)
    try {
      await fetch("/api/v1/regulatory/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ regulatoryUpdateId }),
      })
      router.refresh()
    } catch {
      // silent fail — page will refresh anyway
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleMarkRead} disabled={loading}>
      {loading ? "Marking…" : "Mark as read"}
    </Button>
  )
}
