"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function StripeConnect({
  appId,
  stripeConnectId,
}: {
  appId: string
  stripeConnectId: string | null
}) {
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams.get("connected") === "true") {
      toast.success("Stripe account connected successfully")
    }
    if (searchParams.get("connect_error") === "true") {
      toast.error("Failed to connect Stripe account")
    }
  }, [searchParams])

  if (stripeConnectId) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20">
          Stripe Connected
        </Badge>
        <code className="text-xs font-mono text-muted-foreground">
          {stripeConnectId}
        </code>
        <Link href={`/api/stripe/disconnect?appId=${appId}`}>
          <Button variant="ghost" size="sm" className="text-muted-foreground text-xs h-7">
            Disconnect
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <Link href={`/api/stripe/connect?appId=${appId}`}>
      <Button
        size="sm"
        className="bg-[#635bff] hover:bg-[#7a73ff] text-white"
      >
        Connect Stripe
      </Button>
    </Link>
  )
}
