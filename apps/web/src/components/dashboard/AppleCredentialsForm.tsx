"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export type AppleCredentials = {
  appleKeyId: string | null
  appleIssuerId: string | null
  applePrivateKey: string | null
  appleBundleId: string | null
}

export function AppleCredentialsForm({
  appId,
  credentials,
}: {
  appId: string
  credentials: AppleCredentials
}) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)

    const fd = new FormData(e.currentTarget)
    const body: Record<string, string> = {}
    for (const key of ["appleKeyId", "appleIssuerId", "applePrivateKey", "appleBundleId"] as const) {
      const val = fd.get(key)
      if (typeof val === "string" && val.trim()) {
        body[key] = val.trim()
      }
    }

    try {
      const res = await fetch(`/api/v1/apps/${appId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error ?? "Failed to save")
      }

      toast.success("Apple credentials saved")
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="appleKeyId">Apple Key ID</Label>
        <Input
          id="appleKeyId"
          name="appleKeyId"
          placeholder={credentials.appleKeyId ?? "e.g. ABC123DEFG"}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="appleIssuerId">Apple Issuer ID</Label>
        <Input
          id="appleIssuerId"
          name="appleIssuerId"
          placeholder={credentials.appleIssuerId ?? "e.g. 12345678-1234-1234-1234-123456789012"}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="applePrivateKey">Apple Private Key (.p8)</Label>
        <Textarea
          id="applePrivateKey"
          name="applePrivateKey"
          rows={4}
          className="font-mono text-xs"
          placeholder={
            credentials.applePrivateKey
              ? "••••••••  (key saved — paste new key to replace)"
              : "Paste the contents of your .p8 file"
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="appleBundleId">Apple Bundle ID</Label>
        <Input
          id="appleBundleId"
          name="appleBundleId"
          placeholder={credentials.appleBundleId ?? "e.g. com.example.myapp"}
        />
      </div>

      <Button type="submit" size="sm" disabled={saving}>
        {saving ? "Saving…" : "Save credentials"}
      </Button>
    </form>
  )
}
