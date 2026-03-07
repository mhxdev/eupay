"use client"

import { useState, useTransition } from "react"
import { createExperiment } from "@/lib/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Plus, Trash2 } from "lucide-react"

type Variant = {
  name: string
  allocationPercent: number
  config: string // JSON string for editing
  configMode: "simple" | "advanced"
  kvPairs: { key: string; value: string; type: "string" | "number" | "boolean" }[]
}

const PLACEMENTS = [
  "paywall",
  "upgrade_prompt",
  "cancel_flow",
  "migration",
]

function defaultVariants(): Variant[] {
  return [
    {
      name: "Control",
      allocationPercent: 50,
      config: "{}",
      configMode: "simple",
      kvPairs: [],
    },
    {
      name: "Variant A",
      allocationPercent: 50,
      config: "{}",
      configMode: "simple",
      kvPairs: [],
    },
  ]
}

function kvToJson(
  pairs: { key: string; value: string; type: "string" | "number" | "boolean" }[]
): string {
  const obj: Record<string, unknown> = {}
  for (const p of pairs) {
    if (!p.key) continue
    if (p.type === "number") obj[p.key] = Number(p.value) || 0
    else if (p.type === "boolean") obj[p.key] = p.value === "true"
    else obj[p.key] = p.value
  }
  return JSON.stringify(obj, null, 2)
}

export function CreateExperimentDialog({ appId }: { appId: string }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [step, setStep] = useState(1)

  // Step 1
  const [name, setName] = useState("")
  const [placement, setPlacement] = useState("paywall")
  const [customPlacement, setCustomPlacement] = useState("")

  // Step 2
  const [variants, setVariants] = useState<Variant[]>(defaultVariants())

  // Step 3
  const [targetNewUsersOnly, setTargetNewUsersOnly] = useState(false)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const effectivePlacement = placement === "custom" ? customPlacement : placement
  const totalAllocation = variants.reduce((s, v) => s + v.allocationPercent, 0)

  function updateVariant(idx: number, patch: Partial<Variant>) {
    const updated = [...variants]
    updated[idx] = { ...updated[idx], ...patch }
    setVariants(updated)
  }

  function addVariant() {
    if (variants.length >= 4) return
    const letters = ["A", "B", "C", "D"]
    const name = `Variant ${letters[variants.length - 1] ?? variants.length}`
    setVariants([...variants, {
      name,
      allocationPercent: 0,
      config: "{}",
      configMode: "simple",
      kvPairs: [],
    }])
  }

  function removeVariant(idx: number) {
    if (variants.length <= 2) return
    setVariants(variants.filter((_, i) => i !== idx))
  }

  function updateKvPair(
    variantIdx: number,
    pairIdx: number,
    patch: Partial<{ key: string; value: string; type: "string" | "number" | "boolean" }>
  ) {
    const v = { ...variants[variantIdx] }
    const pairs = [...v.kvPairs]
    pairs[pairIdx] = { ...pairs[pairIdx], ...patch }
    v.kvPairs = pairs
    v.config = kvToJson(pairs)
    const updated = [...variants]
    updated[variantIdx] = v
    setVariants(updated)
  }

  function addKvPair(variantIdx: number) {
    const v = { ...variants[variantIdx] }
    v.kvPairs = [...v.kvPairs, { key: "", value: "", type: "string" }]
    const updated = [...variants]
    updated[variantIdx] = v
    setVariants(updated)
  }

  function removeKvPair(variantIdx: number, pairIdx: number) {
    const v = { ...variants[variantIdx] }
    v.kvPairs = v.kvPairs.filter((_, i) => i !== pairIdx)
    v.config = kvToJson(v.kvPairs)
    const updated = [...variants]
    updated[variantIdx] = v
    setVariants(updated)
  }

  function handleSubmit() {
    const fd = new FormData()
    fd.set("appId", appId)
    fd.set("name", name)
    fd.set("placement", effectivePlacement)
    fd.set("targetNewUsersOnly", String(targetNewUsersOnly))
    if (startDate) fd.set("startDate", startDate)
    if (endDate) fd.set("endDate", endDate)
    fd.set(
      "variants",
      JSON.stringify(
        variants.map((v) => ({
          name: v.name,
          allocationPercent: v.allocationPercent,
          config: JSON.parse(v.config || "{}"),
        }))
      )
    )
    startTransition(async () => {
      await createExperiment(fd)
      setOpen(false)
      resetForm()
    })
  }

  function resetForm() {
    setStep(1)
    setName("")
    setPlacement("paywall")
    setCustomPlacement("")
    setVariants(defaultVariants())
    setTargetNewUsersOnly(false)
    setStartDate("")
    setEndDate("")
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" /> Create Experiment
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            New Experiment — Step {step} of 4
          </DialogTitle>
        </DialogHeader>

        {/* Step indicators */}
        <div className="flex gap-1 mb-2">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full ${
                s <= step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label>Experiment Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Pricing Test Q2"
              />
            </div>
            <div>
              <Label>Placement</Label>
              <Select value={placement} onValueChange={setPlacement}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLACEMENTS.map((p) => (
                    <SelectItem key={p} value={p} className="capitalize">
                      {p.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">Custom...</SelectItem>
                </SelectContent>
              </Select>
              {placement === "custom" && (
                <Input
                  className="mt-2"
                  value={customPlacement}
                  onChange={(e) => setCustomPlacement(e.target.value)}
                  placeholder="my_custom_placement"
                />
              )}
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setStep(2)} disabled={!name || !effectivePlacement}>
                Next
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            {variants.map((v, idx) => (
              <div key={idx} className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">{v.name}</Badge>
                  {variants.length > 2 && (
                    <Button variant="ghost" size="icon" onClick={() => removeVariant(idx)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label className="text-xs">Name</Label>
                    <Input
                      value={v.name}
                      onChange={(e) => updateVariant(idx, { name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Allocation %</Label>
                    <Input
                      type="number"
                      min={1}
                      max={99}
                      value={v.allocationPercent}
                      onChange={(e) =>
                        updateVariant(idx, {
                          allocationPercent: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>

                <Separator />

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs">Config</Label>
                    <button
                      className="text-xs text-muted-foreground underline"
                      onClick={() =>
                        updateVariant(idx, {
                          configMode: v.configMode === "simple" ? "advanced" : "simple",
                        })
                      }
                    >
                      {v.configMode === "simple" ? "Advanced (JSON)" : "Simple (Key-Value)"}
                    </button>
                  </div>

                  {v.configMode === "simple" ? (
                    <div className="space-y-2">
                      {v.kvPairs.map((pair, pi) => (
                        <div key={pi} className="flex gap-2">
                          <Input
                            className="flex-1"
                            placeholder="key"
                            value={pair.key}
                            onChange={(e) => updateKvPair(idx, pi, { key: e.target.value })}
                          />
                          <Input
                            className="flex-1"
                            placeholder="value"
                            value={pair.value}
                            onChange={(e) => updateKvPair(idx, pi, { value: e.target.value })}
                          />
                          <Select
                            value={pair.type}
                            onValueChange={(t) =>
                              updateKvPair(idx, pi, { type: t as "string" | "number" | "boolean" })
                            }
                          >
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="string">string</SelectItem>
                              <SelectItem value="number">number</SelectItem>
                              <SelectItem value="boolean">bool</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeKvPair(idx, pi)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addKvPair(idx)}
                      >
                        <Plus className="h-3 w-3 mr-1" /> Add Key
                      </Button>
                    </div>
                  ) : (
                    <Textarea
                      rows={4}
                      className="font-mono text-xs"
                      value={v.config}
                      onChange={(e) => updateVariant(idx, { config: e.target.value })}
                    />
                  )}
                </div>
              </div>
            ))}

            {totalAllocation !== 100 && (
              <p className="text-sm text-red-500">
                Allocation must sum to 100% (currently {totalAllocation}%)
              </p>
            )}

            {variants.length < 4 && (
              <Button variant="outline" size="sm" onClick={addVariant}>
                <Plus className="h-4 w-4 mr-1" /> Add Variant
              </Button>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button onClick={() => setStep(3)} disabled={totalAllocation !== 100}>
                Next
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="newUsersOnly"
                checked={targetNewUsersOnly}
                onChange={(e) => setTargetNewUsersOnly(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="newUsersOnly">New users only (no previous purchases)</Label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-xs">Start Date (optional)</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs">End Date (optional)</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
              <Button onClick={() => setStep(4)}>Review</Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <div className="rounded-lg border p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name</span>
                <span className="font-medium">{name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Placement</span>
                <span className="font-medium capitalize">{effectivePlacement.replace(/_/g, " ")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Targeting</span>
                <span className="font-medium">{targetNewUsersOnly ? "New users only" : "All users"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Schedule</span>
                <span className="font-medium">
                  {startDate || "Immediate"} — {endDate || "Indefinite"}
                </span>
              </div>
              <Separator />
              <p className="text-muted-foreground">Variants</p>
              {variants.map((v, idx) => (
                <div key={idx} className="flex justify-between items-start">
                  <div>
                    <span className="font-medium">{v.name}</span>
                    <span className="text-muted-foreground ml-2">({v.allocationPercent}%)</span>
                  </div>
                  <code className="text-xs bg-muted px-2 py-1 rounded max-w-[200px] truncate">
                    {v.config}
                  </code>
                </div>
              ))}
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(3)}>Back</Button>
              <Button onClick={handleSubmit} disabled={isPending}>
                {isPending ? "Creating..." : "Create Experiment"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
