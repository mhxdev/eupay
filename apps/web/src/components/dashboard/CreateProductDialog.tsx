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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Info, Plus } from "lucide-react"
import { createProduct } from "@/lib/actions"
import { getCurrencySymbol } from "@/lib/currencies"

const BILLING_CYCLES = [
  { value: "daily", label: "Daily", interval: "day", intervalCount: 1 },
  { value: "weekly", label: "Weekly", interval: "week", intervalCount: 1 },
  { value: "monthly", label: "Monthly", interval: "month", intervalCount: 1 },
  { value: "quarterly", label: "Quarterly", interval: "month", intervalCount: 3 },
  { value: "yearly", label: "Yearly", interval: "year", intervalCount: 1 },
] as const

export function CreateProductDialog({ appId, hasStripe }: { appId: string; hasStripe: boolean }) {
  const [open, setOpen] = useState(false)
  const [productType, setProductType] = useState<string>("SUBSCRIPTION")
  const [billingCycle, setBillingCycle] = useState("monthly")
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(formData: FormData) {
    setError(null)
    formData.set("appId", appId)
    formData.set("productType", productType)
    formData.set("currency", "eur")
    // Validate and convert euro input to cents for the server action
    const euroValue = (formData.get("priceEuros") as string).replace(",", ".")
    const parsed = parseFloat(euroValue)
    if (!euroValue || isNaN(parsed) || parsed <= 0) {
      setError("Enter a valid price greater than 0")
      return
    }
    formData.delete("priceEuros")
    formData.set("amountCents", String(Math.round(parsed * 100)))
    // Map billing cycle to interval + intervalCount
    if (productType === "SUBSCRIPTION") {
      const cycle = BILLING_CYCLES.find((c) => c.value === billingCycle) ?? BILLING_CYCLES[2]
      formData.set("interval", cycle.interval)
      formData.set("intervalCount", String(cycle.intervalCount))
    }
    startTransition(async () => {
      try {
        await createProduct(formData)
        setOpen(false)
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to create product")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Product</DialogTitle>
          <DialogDescription>
            Creates a Stripe product and price, then saves to your catalog.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          {!hasStripe && (
            <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2.5">
              <Info className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
              <p className="text-xs text-amber-500">
                Stripe not connected yet — your product will be saved and automatically synced to Stripe when you connect your account.
              </p>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="name">Product Name</Label>
            <Input id="name" name="name" placeholder="Pro Monthly" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Full access to premium features"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={productType} onValueChange={setProductType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SUBSCRIPTION">Subscription</SelectItem>
                  <SelectItem value="ONE_TIME">One-Time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priceEuros">Price</Label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                    {getCurrencySymbol("eur")}
                  </span>
                  <Input
                    id="priceEuros"
                    name="priceEuros"
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9]*[.,]?[0-9]*"
                    placeholder="9.99"
                    className="pl-7"
                    required
                  />
                </div>
                <span className="text-sm text-muted-foreground shrink-0">EUR</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5">
              <Label htmlFor="appStoreProductId" className="mb-0">App Store Product ID</Label>
              <span className="text-sm text-muted-foreground">(optional)</span>
              <span className="relative group">
                <Info className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground cursor-help" />
                <span className="invisible group-hover:visible absolute left-0 top-full mt-2 w-80 rounded-md border border-border bg-popover p-2 text-xs text-popover-foreground font-normal shadow-md z-50">
                  Your existing in-app purchase product ID from App Store Connect, found under your app &rarr; In-App Purchases (e.g., com.yourapp.pro_monthly). If you already sell this product via Apple IAP, enter the matching Product ID here &mdash; you&apos;ll need it when setting up Switch &amp; Save to migrate your existing Apple subscribers to EuroPay. If this is a new product with no Apple equivalent, leave this empty.
                </span>
              </span>
            </div>
            <Input
              id="appStoreProductId"
              name="appStoreProductId"
              placeholder="com.yourapp.pro_monthly"
            />
          </div>

          {productType === "SUBSCRIPTION" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Billing Cycle</Label>
                <Select value={billingCycle} onValueChange={setBillingCycle}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BILLING_CYCLES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="trialDays">Free Trial</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="trialDays"
                    name="trialDays"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    defaultValue="0"
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground shrink-0">days</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Set to 0 for no trial. You can also create trial offers via Promotions.
                </p>
              </div>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? (hasStripe ? "Creating in Stripe..." : "Saving...") : "Create Product"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
