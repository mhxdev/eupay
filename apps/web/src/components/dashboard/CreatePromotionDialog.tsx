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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus } from "lucide-react"
import { createPromotion } from "@/lib/actions"

type ProductOption = { id: string; name: string }

export function CreatePromotionDialog({
  appId,
  products,
}: {
  appId: string
  products: ProductOption[]
}) {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<string>("PERCENT_OFF")
  const [duration, setDuration] = useState<string>("ONCE")
  const [productId, setProductId] = useState<string>("")
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(formData: FormData) {
    setError(null)
    formData.set("appId", appId)
    formData.set("type", type)
    formData.set("duration", duration)
    if (productId && productId !== "all") {
      formData.set("productId", productId)
    }
    startTransition(async () => {
      try {
        await createPromotion(formData)
        setOpen(false)
        setType("PERCENT_OFF")
        setDuration("ONCE")
        setProductId("")
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to create promotion")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Promotion
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Promotion</DialogTitle>
          <DialogDescription>
            Creates a Stripe coupon on your connected account. If a promo code is
            set, customers can enter it at checkout.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="promo-name">Internal Name</Label>
            <Input
              id="promo-name"
              name="name"
              placeholder="Launch 20% off"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Discount Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENT_OFF">Percent Off</SelectItem>
                  <SelectItem value="AMOUNT_OFF">Amount Off</SelectItem>
                  <SelectItem value="TRIAL_EXTENSION">Extended Trial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Duration</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ONCE">Once</SelectItem>
                  <SelectItem value="REPEATING">Repeating</SelectItem>
                  <SelectItem value="FOREVER">Forever</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {type === "PERCENT_OFF" && (
            <div className="space-y-2">
              <Label htmlFor="percentOff">Percent Off</Label>
              <Input
                id="percentOff"
                name="percentOff"
                type="number"
                step="0.1"
                min="1"
                max="100"
                placeholder="20"
                required
              />
            </div>
          )}

          {type === "AMOUNT_OFF" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amountOffCents">Amount Off (cents)</Label>
                <Input
                  id="amountOffCents"
                  name="amountOffCents"
                  type="number"
                  min="1"
                  placeholder="500"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="promo-currency">Currency</Label>
                <Input
                  id="promo-currency"
                  name="currency"
                  defaultValue="eur"
                />
              </div>
            </div>
          )}

          {type === "TRIAL_EXTENSION" && (
            <div className="space-y-2">
              <Label htmlFor="trialDays">Extra Trial Days</Label>
              <Input
                id="trialDays"
                name="trialDays"
                type="number"
                min="1"
                placeholder="7"
                required
              />
            </div>
          )}

          {duration === "REPEATING" && (
            <div className="space-y-2">
              <Label htmlFor="durationInMonths">Duration (months)</Label>
              <Input
                id="durationInMonths"
                name="durationInMonths"
                type="number"
                min="1"
                placeholder="3"
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="code">Promo Code (optional)</Label>
            <Input
              id="code"
              name="code"
              placeholder="LAUNCH20"
              className="uppercase"
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to auto-apply via the SDK. If set, customers enter this
              code at checkout.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Apply To</Label>
              <Select value={productId || "all"} onValueChange={(v) => setProductId(v === "all" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxRedemptions">Max Redemptions</Label>
              <Input
                id="maxRedemptions"
                name="maxRedemptions"
                type="number"
                min="1"
                placeholder="Unlimited"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiresAt">Expires At (optional)</Label>
            <Input id="expiresAt" name="expiresAt" type="date" />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Creating in Stripe..." : "Create Promotion"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
