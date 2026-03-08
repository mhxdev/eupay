"use client"

import { useState, useTransition } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { updatePlatformFee } from "@/lib/actions"
import { Pencil, Check, X } from "lucide-react"

export function PlatformFeeEditor({
  appId,
  currentFee,
}: {
  appId: string
  currentFee: number
}) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(currentFee.toString())
  const [note, setNote] = useState("")
  const [isPending, startTransition] = useTransition()

  const isCustom = currentFee !== 1.5

  function handleSave() {
    const num = parseFloat(value)
    if (isNaN(num) || num < 0 || num > 15) return
    startTransition(async () => {
      await updatePlatformFee(appId, num, note || undefined)
      setEditing(false)
      setNote("")
    })
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1">
          <Input
            type="number"
            step="0.1"
            min="0"
            max="15"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="h-7 w-20 text-xs"
            disabled={isPending}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave()
              if (e.key === "Escape") {
                setEditing(false)
                setNote("")
              }
            }}
          />
          <span className="text-xs text-muted-foreground">%</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleSave}
            disabled={isPending}
          >
            <Check className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => {
              setValue(currentFee.toString())
              setEditing(false)
              setNote("")
            }}
            disabled={isPending}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
        <Input
          type="text"
          placeholder="Note (e.g. Annual deal agreed via email)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="h-6 w-56 text-xs"
          disabled={isPending}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave()
          }}
        />
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1">
      <span
        className={
          isCustom
            ? "text-teal-600 dark:text-teal-400 font-medium"
            : ""
        }
      >
        {currentFee}%
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={() => setEditing(true)}
      >
        <Pencil className="h-3 w-3" />
      </Button>
    </div>
  )
}
