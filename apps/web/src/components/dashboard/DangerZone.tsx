"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { AlertTriangle } from "lucide-react"

export function DangerZone() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [confirmation, setConfirmation] = useState("")
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch("/api/dashboard/settings", { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete account")
      router.push("/")
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete account")
      setDeleting(false)
    }
  }

  return (
    <Card className="border-red-300 dark:border-red-800">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <CardTitle className="text-base text-red-600 dark:text-red-400">
            Danger Zone
          </CardTitle>
        </div>
        <CardDescription>
          Irreversible actions that permanently affect your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Delete Account</p>
            <p className="text-sm text-muted-foreground">
              Permanently delete your account, all apps, API keys, and data.
            </p>
          </div>

          <Dialog open={open} onOpenChange={(v) => { setOpen(v); setConfirmation(""); }}>
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm">
                Delete Account
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Account</DialogTitle>
                <DialogDescription>
                  This action is permanent. All your apps, API keys, products,
                  and customer data will be deleted. This cannot be undone.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-2 py-2">
                <Label htmlFor="confirm-delete">
                  Type <span className="font-mono font-bold">DELETE</span> to confirm
                </Label>
                <Input
                  id="confirm-delete"
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                  placeholder="DELETE"
                  autoComplete="off"
                />
              </div>

              <DialogFooter>
                <Button
                  variant="destructive"
                  disabled={confirmation !== "DELETE" || deleting}
                  onClick={handleDelete}
                >
                  {deleting ? "Deleting…" : "Permanently Delete Account"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  )
}
