"use client"

import { useTransition } from "react"
import { Button } from "@/components/ui/button"
import { toggleProduct } from "@/lib/actions"

export function ProductToggle({
  productId,
  isActive,
}: {
  productId: string
  isActive: boolean
}) {
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      variant={isActive ? "outline" : "secondary"}
      size="sm"
      disabled={isPending}
      onClick={() =>
        startTransition(() => toggleProduct(productId, !isActive))
      }
    >
      {isPending ? "..." : isActive ? "Deactivate" : "Activate"}
    </Button>
  )
}
