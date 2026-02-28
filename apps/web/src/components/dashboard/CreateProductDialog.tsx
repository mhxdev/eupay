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
import { Plus } from "lucide-react"
import { createProduct } from "@/lib/actions"

export function CreateProductDialog({ appId }: { appId: string }) {
  const [open, setOpen] = useState(false)
  const [productType, setProductType] = useState<string>("SUBSCRIPTION")
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(formData: FormData) {
    setError(null)
    formData.set("appId", appId)
    formData.set("productType", productType)
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
              <Label htmlFor="amountCents">Price (cents)</Label>
              <Input
                id="amountCents"
                name="amountCents"
                type="number"
                placeholder="999"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Input id="currency" name="currency" defaultValue="eur" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="appStoreProductId">App Store Product ID</Label>
              <Input
                id="appStoreProductId"
                name="appStoreProductId"
                placeholder="com.app.pro"
              />
            </div>
          </div>

          {productType === "SUBSCRIPTION" && (
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="interval">Interval</Label>
                <Select name="interval" defaultValue="month">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month">Monthly</SelectItem>
                    <SelectItem value="year">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="intervalCount">Count</Label>
                <Input
                  id="intervalCount"
                  name="intervalCount"
                  type="number"
                  defaultValue="1"
                  min="1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="trialDays">Trial Days</Label>
                <Input
                  id="trialDays"
                  name="trialDays"
                  type="number"
                  defaultValue="0"
                  min="0"
                />
              </div>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Creating in Stripe..." : "Create Product"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
