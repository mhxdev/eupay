"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Copy, RefreshCw, Save } from "lucide-react"

export function WebhookConfig({
  appId,
  webhookUrl,
  hasSecret,
  webhookVersion,
}: {
  appId: string
  webhookUrl: string | null
  hasSecret: boolean
  webhookVersion: "v1" | "v2"
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [url, setUrl] = useState(webhookUrl ?? "")
  const [version, setVersion] = useState(webhookVersion)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [newSecret, setNewSecret] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  function handleSaveUrl() {
    setError(null)
    setSuccess(null)
    if (!url.trim()) {
      setError("Webhook URL is required")
      return
    }
    startTransition(async () => {
      try {
        const res = await fetch(`/api/v1/apps/${appId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ webhookUrl: url }),
        })
        if (!res.ok) {
          const data = await res.json()
          setError(data.error ?? "Failed to save")
          return
        }
        setSuccess("Webhook URL saved")
        router.refresh()
      } catch {
        setError("Network error")
      }
    })
  }

  function handleGenerateSecret() {
    setError(null)
    setSuccess(null)
    setNewSecret(null)
    startTransition(async () => {
      try {
        const secret = `whsec_${Array.from(crypto.getRandomValues(new Uint8Array(24)))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("")}`

        const res = await fetch(`/api/v1/apps/${appId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ webhookSecret: secret }),
        })
        if (!res.ok) {
          const data = await res.json()
          setError(data.error ?? "Failed to generate secret")
          return
        }
        setNewSecret(secret)
        router.refresh()
      } catch {
        setError("Network error")
      }
    })
  }

  function handleVersionChange(newVersion: "v1" | "v2") {
    setError(null)
    setSuccess(null)
    startTransition(async () => {
      try {
        const res = await fetch(`/api/v1/apps/${appId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ webhookVersion: newVersion }),
        })
        if (!res.ok) {
          const data = await res.json()
          setError(data.error ?? "Failed to update format")
          return
        }
        setVersion(newVersion)
        setSuccess(`Webhook format updated to ${newVersion.toUpperCase()}`)
        router.refresh()
      } catch {
        setError("Network error")
      }
    })
  }

  function handleCopy() {
    if (newSecret) {
      navigator.clipboard.writeText(newSecret)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Webhook Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="webhookUrl">Endpoint URL</Label>
          <div className="flex gap-2">
            <Input
              id="webhookUrl"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://yourapp.com/api/webhooks/eupay"
              className="flex-1"
            />
            <Button
              onClick={handleSaveUrl}
              disabled={isPending}
              size="sm"
              className="shrink-0"
            >
              <Save className="h-4 w-4 mr-1" />
              {isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Webhook Format</Label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleVersionChange("v1")}
              disabled={isPending || version === "v1"}
              className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                version === "v1"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/50"
              }`}
            >
              V1 (Legacy)
            </button>
            <button
              type="button"
              onClick={() => handleVersionChange("v2")}
              disabled={isPending || version === "v2"}
              className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                version === "v2"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/50"
              }`}
            >
              V2 (Recommended)
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            {version === "v2"
              ? "Clean EuroPay-native event types (e.g. purchase.completed, subscription.cancelled)"
              : "Stripe event types with EuroPay enrichment (e.g. checkout.session.completed)"}
          </p>
        </div>

        <div className="space-y-2">
          <Label>Signing Secret</Label>
          <div className="flex items-center gap-2">
            {hasSecret && !newSecret && (
              <Badge variant="secondary" className="text-xs">
                Configured
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateSecret}
              disabled={isPending}
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              {hasSecret ? "Regenerate" : "Generate"} Secret
            </Button>
          </div>
          {newSecret && (
            <div className="mt-2 rounded-md border border-amber-300/40 bg-amber-50 p-3 space-y-2">
              <p className="text-xs font-medium text-amber-900">
                Save this secret — it won&apos;t be shown again
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs font-mono text-amber-800 break-all">
                  {newSecret}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="shrink-0"
                >
                  <Copy className="h-3.5 w-3.5 mr-1" />
                  {copied ? "Copied!" : "Copy"}
                </Button>
              </div>
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-green-600">{success}</p>}
      </CardContent>
    </Card>
  )
}
