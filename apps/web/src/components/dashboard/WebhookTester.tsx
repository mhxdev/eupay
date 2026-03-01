"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Send } from "lucide-react"

const EVENT_TYPES = [
  { value: "checkout.completed", label: "checkout.completed" },
  { value: "subscription.created", label: "subscription.created" },
  { value: "subscription.cancelled", label: "subscription.cancelled" },
  { value: "subscription.paused", label: "subscription.paused" },
  { value: "subscription.resumed", label: "subscription.resumed" },
  { value: "refund.completed", label: "refund.completed" },
  { value: "entitlement.granted", label: "entitlement.granted" },
]

type TestResult = {
  success: boolean
  statusCode: number
  responseTime: number
  responseBody: string
}

export function WebhookTester({
  appId,
  hasUrl,
}: {
  appId: string
  hasUrl: boolean
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [eventType, setEventType] = useState("")
  const [result, setResult] = useState<TestResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handleSendTest() {
    if (!eventType) return
    setError(null)
    setResult(null)
    startTransition(async () => {
      try {
        const res = await fetch(`/api/v1/apps/${appId}/webhooks/test`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventType }),
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error ?? "Failed to send test event")
          return
        }
        setResult(data)
        router.refresh()
      } catch {
        setError("Network error")
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Test Webhook</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasUrl ? (
          <p className="text-sm text-muted-foreground">
            Configure a webhook URL above to send test events.
          </p>
        ) : (
          <>
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-2">
                <Select value={eventType} onValueChange={setEventType}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        <code className="text-xs">{t.label}</code>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleSendTest}
                disabled={isPending || !eventType}
                size="sm"
                className="shrink-0"
              >
                <Send className="h-4 w-4 mr-1" />
                {isPending ? "Sending..." : "Send Test Event"}
              </Button>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            {result && (
              <div
                className={`rounded-md border p-3 space-y-2 ${
                  result.success
                    ? "border-green-200 bg-green-50"
                    : "border-red-200 bg-red-50"
                }`}
              >
                <div className="flex items-center gap-3 text-sm">
                  <Badge
                    className={
                      result.success
                        ? "bg-green-100 text-green-800 hover:bg-green-100"
                        : "bg-red-100 text-red-800 hover:bg-red-100"
                    }
                  >
                    {result.success ? "Delivered" : "Failed"}
                  </Badge>
                  <span className="text-muted-foreground">
                    Status: <strong>{result.statusCode || "N/A"}</strong>
                  </span>
                  <span className="text-muted-foreground">
                    {result.responseTime}ms
                  </span>
                </div>
                {result.responseBody && (
                  <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap overflow-auto max-h-40 mt-2">
                    {result.responseBody}
                  </pre>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
