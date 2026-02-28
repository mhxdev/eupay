"use client"

import { useState, useTransition } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { XCircle } from "lucide-react"
import {
  applySaveOffer,
  cancelSubscriptionFromDashboard,
} from "@/lib/actions"

interface CancelSaveDialogProps {
  entitlementId: string
  stripeSubscriptionId: string
  productName: string
  email: string | null
}

export function CancelSaveDialog({
  entitlementId,
  productName,
  email,
}: CancelSaveDialogProps) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<"offer" | "done">("offer")
  const [result, setResult] = useState<"saved" | "cancelled" | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isCancelling, startCancelTransition] = useTransition()
  const [isSaving, startSaveTransition] = useTransition()

  function handleAcceptOffer() {
    setError(null)
    startSaveTransition(async () => {
      try {
        await applySaveOffer(entitlementId)
        setResult("saved")
        setStep("done")
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to apply offer")
      }
    })
  }

  function handleCancelAnyway() {
    setError(null)
    startCancelTransition(async () => {
      try {
        await cancelSubscriptionFromDashboard(entitlementId)
        setResult("cancelled")
        setStep("done")
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to cancel")
      }
    })
  }

  function handleOpenChange(isOpen: boolean) {
    setOpen(isOpen)
    if (!isOpen) {
      // Reset state when dialog closes
      setStep("offer")
      setResult(null)
      setError(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button className="w-full text-left px-2 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-sm">
          <span className="flex items-center gap-2">
            <XCircle className="h-3.5 w-3.5" />
            Cancel Subscription
          </span>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {step === "offer" ? (
          <>
            <DialogHeader>
              <DialogTitle>Cancel Subscription</DialogTitle>
              <DialogDescription>
                {email
                  ? `Before cancelling ${email}'s subscription to ${productName}, consider offering a discount to retain them.`
                  : `Before cancelling this subscription to ${productName}, consider offering a discount.`}
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-lg border bg-green-50 border-green-200 p-4 my-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                  Save Offer
                </Badge>
              </div>
              <p className="text-sm font-medium text-green-900">
                20% off for the next 3 months
              </p>
              <p className="text-xs text-green-700 mt-1">
                A coupon will be applied to this subscription. The subscriber
                keeps their access and gets a discount on upcoming renewals.
              </p>
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <div className="flex flex-col gap-2">
              <Button
                onClick={handleAcceptOffer}
                disabled={isSaving || isCancelling}
              >
                {isSaving ? "Applying offer..." : "Apply Save Offer"}
              </Button>
              <Button
                variant="destructive"
                onClick={handleCancelAnyway}
                disabled={isSaving || isCancelling}
              >
                {isCancelling
                  ? "Cancelling..."
                  : "Cancel Anyway"}
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>
                {result === "saved"
                  ? "Save Offer Applied"
                  : "Subscription Cancelled"}
              </DialogTitle>
              <DialogDescription>
                {result === "saved"
                  ? `A 20% discount for 3 months has been applied to ${productName}. The subscriber will continue with the reduced rate.`
                  : `The subscription to ${productName} will be cancelled at the end of the current billing period. The subscriber will retain access until then.`}
              </DialogDescription>
            </DialogHeader>

            <Button onClick={() => setOpen(false)} className="mt-2">
              Done
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
