"use client"

import { useState, useTransition } from "react"
import { saveRetentionConfig } from "@/lib/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Trash2, GripVertical } from "lucide-react"

type RetentionOffer = {
  type: "discount" | "pause" | "downgrade"
  label: string
  discountPercent?: number
  pauseDays?: number
  downgradeProductId?: string
}

type Props = {
  appId: string
  config: {
    enabled: boolean
    surveyQuestions: string[]
    retentionOffers: RetentionOffer[]
  }
  products: { id: string; name: string }[]
}

export function RetentionConfigForm({ appId, config, products }: Props) {
  const [isPending, startTransition] = useTransition()
  const [enabled, setEnabled] = useState(config.enabled)
  const [questions, setQuestions] = useState<string[]>(
    config.surveyQuestions.length > 0
      ? config.surveyQuestions
      : ["Too expensive", "Not using it enough", "Found a better alternative", "Missing features", "Other"]
  )
  const [offers, setOffers] = useState<RetentionOffer[]>(
    config.retentionOffers.length > 0
      ? config.retentionOffers
      : []
  )

  function addQuestion() {
    setQuestions([...questions, ""])
  }

  function removeQuestion(idx: number) {
    setQuestions(questions.filter((_, i) => i !== idx))
  }

  function updateQuestion(idx: number, value: string) {
    const updated = [...questions]
    updated[idx] = value
    setQuestions(updated)
  }

  function addOffer(type: "discount" | "pause" | "downgrade") {
    const newOffer: RetentionOffer =
      type === "discount"
        ? { type: "discount", label: "Get 20% off for 3 months", discountPercent: 20 }
        : type === "pause"
        ? { type: "pause", label: "Pause for 30 days", pauseDays: 30 }
        : { type: "downgrade", label: "Switch to a lower plan", downgradeProductId: products[0]?.id ?? "" }
    setOffers([...offers, newOffer])
  }

  function removeOffer(idx: number) {
    setOffers(offers.filter((_, i) => i !== idx))
  }

  function updateOffer(idx: number, patch: Partial<RetentionOffer>) {
    const updated = [...offers]
    updated[idx] = { ...updated[idx], ...patch } as RetentionOffer
    setOffers(updated)
  }

  function handleSave() {
    const fd = new FormData()
    fd.set("appId", appId)
    fd.set("enabled", String(enabled))
    fd.set("surveyQuestions", JSON.stringify(questions.filter(Boolean)))
    fd.set("retentionOffers", JSON.stringify(offers))
    startTransition(async () => {
      await saveRetentionConfig(fd)
    })
  }

  return (
    <div className="space-y-6">
      {/* Enable / Disable toggle */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Save the Sale</CardTitle>
              <CardDescription className="mt-1">
                Intercept cancellations with a survey and retention offer before the subscription ends.
              </CardDescription>
            </div>
            <Button
              variant={enabled ? "default" : "outline"}
              size="sm"
              onClick={() => setEnabled(!enabled)}
            >
              {enabled ? "Enabled" : "Disabled"}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Survey Questions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cancel Reasons (Survey)</CardTitle>
          <CardDescription>
            Users select one reason before seeing a retention offer. Keep it to 3-6 options.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {questions.map((q, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input
                value={q}
                onChange={(e) => updateQuestion(idx, e.target.value)}
                placeholder="Cancel reason..."
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeQuestion(idx)}
                disabled={questions.length <= 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addQuestion}>
            <Plus className="h-4 w-4 mr-1" /> Add Reason
          </Button>
        </CardContent>
      </Card>

      {/* Retention Offers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Retention Offers</CardTitle>
          <CardDescription>
            After the survey, present one or more offers to save the customer. EU law requires the cancel option to always be visible and accessible.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {offers.map((offer, idx) => (
            <div key={idx} className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="capitalize">{offer.type}</Badge>
                <Button variant="ghost" size="icon" onClick={() => removeOffer(idx)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label className="text-xs">Button Label</Label>
                  <Input
                    value={offer.label}
                    onChange={(e) => updateOffer(idx, { label: e.target.value })}
                    placeholder="Offer label..."
                  />
                </div>

                {offer.type === "discount" && (
                  <div>
                    <Label className="text-xs">Discount %</Label>
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={offer.discountPercent ?? 20}
                      onChange={(e) => updateOffer(idx, { discountPercent: parseInt(e.target.value) || 20 })}
                    />
                  </div>
                )}

                {offer.type === "pause" && (
                  <div>
                    <Label className="text-xs">Pause Days</Label>
                    <Input
                      type="number"
                      min={1}
                      max={90}
                      value={offer.pauseDays ?? 30}
                      onChange={(e) => updateOffer(idx, { pauseDays: parseInt(e.target.value) || 30 })}
                    />
                  </div>
                )}

                {offer.type === "downgrade" && (
                  <div>
                    <Label className="text-xs">Downgrade Product</Label>
                    <Select
                      value={offer.downgradeProductId ?? ""}
                      onValueChange={(v) => updateOffer(idx, { downgradeProductId: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
          ))}

          {offers.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No offers configured. Add at least one to retain cancelling users.
            </p>
          )}

          <Separator />

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => addOffer("discount")}>
              <Plus className="h-4 w-4 mr-1" /> Discount
            </Button>
            <Button variant="outline" size="sm" onClick={() => addOffer("pause")}>
              <Plus className="h-4 w-4 mr-1" /> Pause
            </Button>
            {products.length > 0 && (
              <Button variant="outline" size="sm" onClick={() => addOffer("downgrade")}>
                <Plus className="h-4 w-4 mr-1" /> Downgrade
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Preview</CardTitle>
          <CardDescription>How the cancellation flow appears to your users.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border bg-zinc-950 text-white p-6 space-y-4 max-w-sm mx-auto">
            <h3 className="text-lg font-semibold">We&apos;re sorry to see you go</h3>
            <p className="text-sm text-zinc-400">Why are you cancelling?</p>
            <div className="space-y-2">
              {questions.filter(Boolean).slice(0, 3).map((q, i) => (
                <div key={i} className="rounded border border-zinc-700 px-3 py-2 text-sm cursor-pointer hover:border-zinc-500">
                  {q}
                </div>
              ))}
              {questions.filter(Boolean).length > 3 && (
                <p className="text-xs text-zinc-500">+{questions.filter(Boolean).length - 3} more</p>
              )}
            </div>
            {offers.length > 0 && (
              <>
                <Separator className="bg-zinc-800" />
                <p className="text-sm text-zinc-400">Before you go, how about:</p>
                {offers.slice(0, 2).map((o, i) => (
                  <div key={i} className="rounded bg-teal-600/20 border border-teal-500/30 px-3 py-2 text-sm text-teal-300">
                    {o.label}
                  </div>
                ))}
              </>
            )}
            <button className="w-full text-center text-xs text-zinc-500 underline cursor-pointer">
              Cancel subscription
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? "Saving..." : "Save Configuration"}
        </Button>
      </div>
    </div>
  )
}
