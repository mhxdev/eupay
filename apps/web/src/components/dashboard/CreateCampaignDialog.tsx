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
import { Plus, X } from "lucide-react"
import { createCampaign } from "@/lib/actions"

type ProductOption = { id: string; name: string; amountCents: number; currency: string }
type PromotionOption = { id: string; name: string }

type MappingRow = {
  appleProductId: string
  appleProductName: string
  applePriceCents: string
  appleCurrency: string
  euroPayProductId: string
}

const emptyMapping: MappingRow = {
  appleProductId: "",
  appleProductName: "",
  applePriceCents: "",
  appleCurrency: "EUR",
  euroPayProductId: "",
}

export function CreateCampaignDialog({
  appId,
  products,
  promotions,
}: {
  appId: string
  products: ProductOption[]
  promotions: PromotionOption[]
}) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Step 1: Basics
  const [name, setName] = useState("")
  const [title, setTitle] = useState("Switch & Save")
  const [subtitle, setSubtitle] = useState("Same features, lower price")
  const [ctaText, setCtaText] = useState("Switch & Save")

  // Step 2: Mappings
  const [mappings, setMappings] = useState<MappingRow[]>([{ ...emptyMapping }])

  // Step 3: Incentive
  const [discountPercent, setDiscountPercent] = useState("")
  const [promotionId, setPromotionId] = useState("")

  // Step 4: Audience
  const [audienceType, setAudienceType] = useState("ALL_SUBSCRIBERS")
  const [rolloutPercent, setRolloutPercent] = useState("100")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  function resetForm() {
    setStep(1)
    setName("")
    setTitle("Switch & Save")
    setSubtitle("Same features, lower price")
    setCtaText("Switch & Save")
    setMappings([{ ...emptyMapping }])
    setDiscountPercent("")
    setPromotionId("")
    setAudienceType("ALL_SUBSCRIBERS")
    setRolloutPercent("100")
    setStartDate("")
    setEndDate("")
    setError(null)
  }

  function addMapping() {
    setMappings([...mappings, { ...emptyMapping }])
  }

  function removeMapping(idx: number) {
    setMappings(mappings.filter((_, i) => i !== idx))
  }

  function updateMapping(idx: number, field: keyof MappingRow, value: string) {
    const updated = [...mappings]
    updated[idx] = { ...updated[idx], [field]: value }
    setMappings(updated)
  }

  function handleSubmit() {
    setError(null)
    const formData = new FormData()
    formData.set("appId", appId)
    formData.set("name", name)
    formData.set("title", title)
    formData.set("subtitle", subtitle)
    formData.set("ctaText", ctaText)
    if (discountPercent) formData.set("discountPercent", discountPercent)
    if (promotionId && promotionId !== "none") formData.set("promotionId", promotionId)
    formData.set("audienceType", audienceType)
    formData.set("rolloutPercent", rolloutPercent)
    if (startDate) formData.set("startDate", startDate)
    if (endDate) formData.set("endDate", endDate)

    const validMappings = mappings
      .filter((m) => m.appleProductId && m.euroPayProductId && m.applePriceCents)
      .map((m) => ({
        appleProductId: m.appleProductId,
        appleProductName: m.appleProductName || m.appleProductId,
        applePriceCents: parseInt(m.applePriceCents, 10),
        appleCurrency: m.appleCurrency || "EUR",
        euroPayProductId: m.euroPayProductId,
      }))
    formData.set("mappings", JSON.stringify(validMappings))

    startTransition(async () => {
      try {
        await createCampaign(formData)
        setOpen(false)
        resetForm()
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to create campaign")
      }
    })
  }

  function getSavings(m: MappingRow) {
    const apple = parseInt(m.applePriceCents, 10)
    const ep = products.find((p) => p.id === m.euroPayProductId)
    if (!apple || !ep) return null
    const diff = apple - ep.amountCents
    if (diff <= 0) return null
    const pct = Math.round((diff / apple) * 100)
    return { cents: diff, percent: pct, epCents: ep.amountCents }
  }

  const totalSteps = 5

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Campaign
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Migration Campaign</DialogTitle>
          <DialogDescription>
            Step {step} of {totalSteps}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {step === 1 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="camp-name">Campaign Name</Label>
                <Input id="camp-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="EU Migration Q2 2026" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="camp-title">Display Title</Label>
                <Input id="camp-title" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="camp-subtitle">Subtitle</Label>
                <Input id="camp-subtitle" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="camp-cta">CTA Button Text</Label>
                <Input id="camp-cta" value={ctaText} onChange={(e) => setCtaText(e.target.value)} />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <p className="text-sm text-muted-foreground">Map Apple IAP products to EuroPay products.</p>
              {mappings.map((m, idx) => (
                <div key={idx} className="rounded-lg border p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Mapping {idx + 1}</span>
                    {mappings.length > 1 && (
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeMapping(idx)}>
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Apple Product ID</Label>
                      <Input value={m.appleProductId} onChange={(e) => updateMapping(idx, "appleProductId", e.target.value)} placeholder="com.app.pro_monthly" className="text-xs" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Apple Display Name</Label>
                      <Input value={m.appleProductName} onChange={(e) => updateMapping(idx, "appleProductName", e.target.value)} placeholder="Pro Monthly" className="text-xs" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Apple Price (cents)</Label>
                      <Input type="number" value={m.applePriceCents} onChange={(e) => updateMapping(idx, "applePriceCents", e.target.value)} placeholder="999" className="text-xs" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">EuroPay Product</Label>
                      <Select value={m.euroPayProductId || "select"} onValueChange={(v) => updateMapping(idx, "euroPayProductId", v === "select" ? "" : v)}>
                        <SelectTrigger className="text-xs">
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="select" disabled>Select product</SelectItem>
                          {products.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name} ({(p.amountCents / 100).toFixed(2)} {p.currency.toUpperCase()})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {(() => {
                    const s = getSavings(m)
                    if (!s) return null
                    return (
                      <p className="text-xs text-green-600 dark:text-green-400">
                        Saves {(s.cents / 100).toFixed(2)} EUR/mo ({s.percent}% less than Apple)
                      </p>
                    )
                  })()}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addMapping}>
                <Plus className="mr-1 h-3 w-3" /> Add Mapping
              </Button>
            </>
          )}

          {step === 3 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="camp-discount">Additional Discount % (optional)</Label>
                <Input id="camp-discount" type="number" min="0" max="100" step="1" value={discountPercent} onChange={(e) => setDiscountPercent(e.target.value)} placeholder="e.g. 20" />
                <p className="text-xs text-muted-foreground">Extra discount on the EuroPay price for migrating users.</p>
              </div>
              <div className="space-y-2">
                <Label>Link Promotion (optional)</Label>
                <Select value={promotionId || "none"} onValueChange={(v) => setPromotionId(v === "none" ? "" : v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No promotion</SelectItem>
                    {promotions.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <div className="space-y-2">
                <Label>Audience</Label>
                <Select value={audienceType} onValueChange={setAudienceType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL_SUBSCRIBERS">All subscribers</SelectItem>
                    <SelectItem value="NEW_SESSIONS_ONLY">New sessions only</SelectItem>
                    <SelectItem value="AFTER_N_DAYS">After N days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="camp-rollout">Rollout % (0-100)</Label>
                <Input id="camp-rollout" type="number" min="0" max="100" value={rolloutPercent} onChange={(e) => setRolloutPercent(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="camp-start">Start Date (optional)</Label>
                  <Input id="camp-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="camp-end">End Date (optional)</Label>
                  <Input id="camp-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </div>
            </>
          )}

          {step === 5 && (
            <div className="space-y-3 text-sm">
              <h4 className="font-medium">Review</h4>
              <div className="grid grid-cols-2 gap-2">
                <span className="text-muted-foreground">Name</span>
                <span>{name}</span>
                <span className="text-muted-foreground">Title</span>
                <span>{title}</span>
                <span className="text-muted-foreground">Product Mappings</span>
                <span>{mappings.filter((m) => m.appleProductId && m.euroPayProductId).length}</span>
                <span className="text-muted-foreground">Audience</span>
                <span className="capitalize">{audienceType.toLowerCase().replace(/_/g, " ")}</span>
                <span className="text-muted-foreground">Rollout</span>
                <span>{rolloutPercent}%</span>
              </div>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-between pt-2">
            <Button
              variant="outline"
              onClick={() => setStep(step - 1)}
              disabled={step === 1}
            >
              Back
            </Button>
            {step < totalSteps ? (
              <Button onClick={() => setStep(step + 1)} disabled={step === 1 && !name}>
                Next
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isPending}>
                {isPending ? "Creating..." : "Create Campaign"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
