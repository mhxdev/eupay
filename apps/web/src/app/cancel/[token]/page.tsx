import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { verifyRetentionToken } from "@/lib/retention-jwt"
import { CancelFlow } from "./CancelFlow"

export default async function CancelPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  const payload = await verifyRetentionToken(token)
  if (!payload) notFound()

  const [app, entitlement, retentionConfig] = await Promise.all([
    prisma.app.findUnique({
      where: { id: payload.appId },
      select: { name: true },
    }),
    prisma.entitlement.findUnique({
      where: { id: payload.entitlementId },
      include: { product: { select: { name: true } } },
    }),
    prisma.retentionConfig.findUnique({
      where: { appId: payload.appId },
    }),
  ])

  if (!app || !entitlement) notFound()

  const surveyQuestions = retentionConfig?.enabled
    ? (retentionConfig.surveyQuestions as string[])
    : ["Too expensive", "Not using it enough", "Found a better alternative", "Other"]

  const retentionOffers = retentionConfig?.enabled
    ? (retentionConfig.retentionOffers as {
        type: "discount" | "pause" | "downgrade"
        label: string
        discountPercent?: number
        pauseDays?: number
        downgradeProductId?: string
      }[])
    : []

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 shadow-2xl">
          <CancelFlow
            token={token}
            appName={app.name}
            productName={entitlement.product.name}
            surveyQuestions={surveyQuestions}
            retentionOffers={retentionOffers}
          />
        </div>
        <p className="text-center text-xs text-zinc-600 mt-4">
          Powered by EuroPay
        </p>
      </div>
    </div>
  )
}
