"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { updateSendCustomerEmails } from "@/lib/actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle } from "lucide-react"

export function CustomerEmailToggle({
  appId,
  enabled,
}: {
  appId: string
  enabled: boolean
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [current, setCurrent] = useState(enabled)

  function handleToggle() {
    const newValue = !current
    setCurrent(newValue)
    startTransition(async () => {
      await updateSendCustomerEmails(appId, newValue)
      router.refresh()
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>End-customer emails</CardTitle>
            <CardDescription className="mt-1">
              When enabled, EuroPay sends purchase confirmations, withdrawal
              waiver confirmations, cancellation notifications, and other
              transactional emails to your customers on your behalf. When
              disabled, these emails are not sent — you are responsible for
              sending legally required transactional emails using the data
              provided in webhook events.
            </CardDescription>
          </div>
          <div className="flex items-center gap-3 ml-4 shrink-0">
            <Badge
              variant={current ? "secondary" : "outline"}
              className={
                current
                  ? "bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-500/10 dark:text-teal-400 dark:border-teal-500/20"
                  : ""
              }
            >
              {current ? "ON" : "OFF"}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggle}
              disabled={isPending}
            >
              {isPending
                ? "Saving..."
                : current
                  ? "Disable"
                  : "Enable"}
            </Button>
          </div>
        </div>
      </CardHeader>
      {!current && (
        <CardContent>
          <div className="flex gap-3 rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-500/20 dark:bg-orange-500/5">
            <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5 shrink-0" />
            <p className="text-sm text-orange-700 dark:text-orange-400/80">
              EU consumer law (Consumer Rights Directive 2011/83/EU) requires
              that customers receive confirmation of their purchase and
              withdrawal waiver. If you disable EuroPay emails, you must send
              these confirmations yourself using the data in webhook events.
              Failure to do so may expose you to legal liability.
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
