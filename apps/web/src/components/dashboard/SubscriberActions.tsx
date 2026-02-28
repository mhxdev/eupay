"use client"

import { useTransition } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, ExternalLink } from "lucide-react"
import { openCustomerPortal } from "@/lib/actions"
import { CancelSaveDialog } from "./CancelSaveDialog"

interface SubscriberActionsProps {
  entitlementId: string
  stripeSubscriptionId: string | null
  stripeCustomerId: string
  productName: string
  email: string | null
  status: string
}

export function SubscriberActions({
  entitlementId,
  stripeSubscriptionId,
  stripeCustomerId,
  productName,
  email,
  status,
}: SubscriberActionsProps) {
  const [isPending, startTransition] = useTransition()

  const hasSubscription = !!stripeSubscriptionId
  const isActive = status === "ACTIVE"

  function handleManage() {
    startTransition(async () => {
      try {
        const result = await openCustomerPortal(stripeCustomerId)
        window.open(result.url, "_blank")
      } catch (e) {
        console.error("Failed to open portal:", e)
      }
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {hasSubscription && (
          <DropdownMenuItem onClick={handleManage} disabled={isPending}>
            <ExternalLink className="h-3.5 w-3.5 mr-2" />
            {isPending ? "Opening..." : "Manage Subscription"}
          </DropdownMenuItem>
        )}
        {hasSubscription && isActive && (
          <>
            <DropdownMenuSeparator />
            <CancelSaveDialog
              entitlementId={entitlementId}
              stripeSubscriptionId={stripeSubscriptionId!}
              productName={productName}
              email={email}
            />
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
