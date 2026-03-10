"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Copy, Check, Info } from "lucide-react"
import { createApp } from "@/lib/actions"

export function CreateAppDialog() {
  const [open, setOpen] = useState(false)
  const [testApiKey, setTestApiKey] = useState<string | null>(null)
  const [liveApiKey, setLiveApiKey] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState<"test" | "live" | null>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      try {
        const result = await createApp(formData)
        setTestApiKey(result.testApiKey)
        setLiveApiKey(result.liveApiKey)
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to create app")
      }
    })
  }

  function handleCopy(key: string, type: "test" | "live") {
    navigator.clipboard.writeText(key)
    setCopiedKey(type)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  function handleClose() {
    setOpen(false)
    setTestApiKey(null)
    setLiveApiKey(null)
    setError(null)
    setCopiedKey(null)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : handleClose())}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Register App
        </Button>
      </DialogTrigger>
      <DialogContent>
        {testApiKey ? (
          <>
            <DialogHeader>
              <DialogTitle>App Created</DialogTitle>
              <DialogDescription>
                Copy your API keys now. They will not be shown again.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-1.5">Test Key (development)</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded bg-muted px-3 py-2 text-sm font-mono break-all">
                    {testApiKey}
                  </code>
                  <Button variant="outline" size="icon" onClick={() => handleCopy(testApiKey, "test")}>
                    {copiedKey === "test" ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-1.5">Live Key (production)</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded bg-muted px-3 py-2 text-sm font-mono break-all">
                    {liveApiKey}
                  </code>
                  <Button variant="outline" size="icon" onClick={() => handleCopy(liveApiKey!, "live")}>
                    {copiedKey === "live" ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Use the test key for development and the live key for production.
              </p>
              <Button onClick={handleClose} className="w-full">
                Done
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Register a New App</DialogTitle>
              <DialogDescription>
                Register your iOS app to get an API key for the EuroPayKit SDK.
              </DialogDescription>
            </DialogHeader>
            <form action={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">App Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="My iOS App"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bundleId" className="inline-flex items-center gap-1.5">
                  Apple Bundle ID
                  <span className="relative group">
                    <Info className="h-3.5 w-3.5 text-gray-400 hover:text-gray-200 cursor-help" />
                    <span className="invisible group-hover:visible absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 rounded-md bg-popover border border-border p-2 text-xs text-popover-foreground font-normal shadow-md z-50">
                      Your app&apos;s Bundle Identifier from Xcode. You can find it in Xcode &rarr; your project &rarr; General &rarr; Bundle Identifier (e.g., com.yourcompany.yourapp). It must match exactly &mdash; this is how EuroPay links to your iOS app.
                    </span>
                  </span>
                </Label>
                <Input
                  id="bundleId"
                  name="bundleId"
                  placeholder="com.example.myapp"
                  required
                />
              </div>
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "Creating..." : "Create App"}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
