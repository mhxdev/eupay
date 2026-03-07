import { auth } from "@clerk/nextjs/server"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { RetentionConfigForm } from "@/components/dashboard/RetentionConfigForm"
import { ArrowLeft } from "lucide-react"

export default async function RetentionPage({
  params,
}: {
  params: Promise<{ appId: string }>
}) {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const { appId } = await params

  const app = await prisma.app.findUnique({
    where: { id: appId },
    include: {
      retentionConfig: true,
      products: {
        where: { isActive: true, productType: "SUBSCRIPTION" },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      },
    },
  })

  if (!app || app.clerkUserId !== userId) notFound()

  const config = app.retentionConfig
    ? {
        enabled: app.retentionConfig.enabled,
        surveyQuestions: app.retentionConfig.surveyQuestions as string[],
        retentionOffers: app.retentionConfig.retentionOffers as {
          type: "discount" | "pause" | "downgrade"
          label: string
          discountPercent?: number
          pauseDays?: number
          downgradeProductId?: string
        }[],
      }
    : { enabled: false, surveyQuestions: [], retentionOffers: [] }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/dashboard/apps/${appId}`}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-2xl font-bold">Retention</h1>
      </div>

      <RetentionConfigForm
        appId={appId}
        config={config}
        products={app.products}
      />
    </div>
  )
}
