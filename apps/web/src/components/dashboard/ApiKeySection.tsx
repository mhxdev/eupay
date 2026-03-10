"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Copy, Check, Plus, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { createApiKeyForApp, revokeApiKey } from "@/lib/actions"

type ApiKeyData = {
  id: string
  keyPrefix: string
  name: string
  isActive: boolean
  lastUsedAt: string | null
  createdAt: string
}

export function ApiKeySection({
  appId,
  keys,
}: {
  appId: string
  keys: ApiKeyData[]
}) {
  const [newKey, setNewKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [showRevoked, setShowRevoked] = useState(false)

  function handleCreate(formData: FormData) {
    startTransition(async () => {
      const result = await createApiKeyForApp(appId, formData.get("keyName") as string)
      setNewKey(result.apiKey)
    })
  }

  function handleRevoke(keyId: string) {
    startTransition(async () => {
      await revokeApiKey(keyId)
    })
  }

  function handleCopy() {
    if (newKey) {
      navigator.clipboard.writeText(newKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">API Keys</h3>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setNewKey(null); setCopied(false) } }}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="mr-2 h-3.5 w-3.5" />
              New Key
            </Button>
          </DialogTrigger>
          <DialogContent>
            {newKey ? (
              <>
                <DialogHeader>
                  <DialogTitle>API Key Created</DialogTitle>
                  <DialogDescription>
                    Copy your API key now. It will not be shown again.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded bg-muted px-3 py-2 text-sm font-mono break-all">
                    {newKey}
                  </code>
                  <Button variant="outline" size="icon" onClick={handleCopy}>
                    {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <Button onClick={() => { setOpen(false); setNewKey(null) }}>Done</Button>
              </>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle>Create API Key</DialogTitle>
                </DialogHeader>
                <form action={handleCreate} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="keyName">Key Name</Label>
                    <Input id="keyName" name="keyName" placeholder="Production" required />
                  </div>
                  <Button type="submit" disabled={isPending} className="w-full">
                    {isPending ? "Creating..." : "Create Key"}
                  </Button>
                </form>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {keys.filter((key) => key.isActive || showRevoked).map((key) => (
          <div
            key={key.id}
            className="flex items-center justify-between rounded-md border px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <code className="text-sm font-mono">{key.keyPrefix}...</code>
              <span className="text-sm text-muted-foreground">{key.name}</span>
              {key.isActive ? (
                <Badge variant="secondary" className="text-xs">Active</Badge>
              ) : (
                <Badge variant="outline" className="text-xs">Revoked</Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {key.lastUsedAt && (
                <span className="text-xs text-muted-foreground">
                  Last used {new Date(key.lastUsedAt).toLocaleDateString()}
                </span>
              )}
              {key.isActive && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRevoke(key.id)}
                  disabled={isPending}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          </div>
        ))}
        {keys.some((k) => !k.isActive) && (
          <button
            onClick={() => setShowRevoked(!showRevoked)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {showRevoked ? "Hide" : "Show"} {keys.filter((k) => !k.isActive).length} revoked key{keys.filter((k) => !k.isActive).length !== 1 ? "s" : ""}
          </button>
        )}
      </div>
    </div>
  )
}
