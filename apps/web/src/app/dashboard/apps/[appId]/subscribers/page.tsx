import { auth } from "@clerk/nextjs/server"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Card, CardContent } from "@/components/ui/card"
import { SubscriberTable, type SubscriberRow } from "@/components/dashboard/SubscriberTable"
import { SandboxBanner } from "@/components/dashboard/SandboxBanner"
import { ArrowLeft } from "lucide-react"

export default async function SubscribersPage({
  params,
}: {
  params: Promise<{ appId: string }>
}) {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const { appId } = await params

  const app = await prisma.app.findUnique({ where: { id: appId } })
  if (!app || app.clerkUserId !== userId) notFound()

  // Fetch all entitlements with customer and product data, plus lifetime revenue
  const entitlements = await prisma.entitlement.findMany({
    where: {
      product: { appId },
    },
    include: {
      customer: {
        include: {
          transactions: {
            where: { status: "SUCCEEDED" },
            select: { amountTotal: true, currency: true },
          },
        },
      },
      product: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  const subscribers: SubscriberRow[] = entitlements.map((e) => {
    const totalRevenue = e.customer.transactions.reduce(
      (sum, t) => sum + t.amountTotal,
      0
    )
    const currency =
      e.customer.transactions[0]?.currency ?? "eur"

    return {
      customerId: e.customerId,
      email: e.customer.email,
      externalUserId: e.customer.externalUserId,
      productName: e.product.name,
      status: e.status,
      since: e.createdAt.toISOString(),
      nextBilling: e.currentPeriodEnd?.toISOString() ?? null,
      cancelAtPeriodEnd: e.cancelAtPeriodEnd,
      lifetimeRevenue: totalRevenue,
      currency,
      entitlementId: e.id,
      stripeSubscriptionId: e.stripeSubscriptionId,
      stripeCustomerId: e.customer.stripeCustomerId,
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/dashboard/apps/${appId}`}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Subscribers</h1>
          <p className="text-muted-foreground">{app.name}</p>
        </div>
      </div>

      {app.mode === "sandbox" && <SandboxBanner />}

      <Card>
        <CardContent className="pt-6">
          <SubscriberTable data={subscribers} />
        </CardContent>
      </Card>
    </div>
  )
}
