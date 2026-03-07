import { auth } from "@clerk/nextjs/server"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CreatePromotionDialog } from "@/components/dashboard/CreatePromotionDialog"
import { PromotionToggle, PromotionDelete } from "@/components/dashboard/PromotionActions"
import { SandboxBanner } from "@/components/dashboard/SandboxBanner"
import { ArrowLeft } from "lucide-react"

function formatDiscount(promo: {
  type: string
  percentOff: number | null
  amountOffCents: number | null
  currency: string
  trialDays: number | null
}) {
  if (promo.type === "PERCENT_OFF" && promo.percentOff) return `${promo.percentOff}% off`
  if (promo.type === "AMOUNT_OFF" && promo.amountOffCents) {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: promo.currency.toUpperCase(),
    }).format(promo.amountOffCents / 100) + " off"
  }
  if (promo.type === "TRIAL_EXTENSION" && promo.trialDays) return `+${promo.trialDays} trial days`
  return "—"
}

export default async function PromotionsPage({
  params,
}: {
  params: Promise<{ appId: string }>
}) {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const { appId } = await params

  const app = await prisma.app.findUnique({ where: { id: appId } })
  if (!app || app.clerkUserId !== userId) notFound()

  const [promotions, products] = await Promise.all([
    prisma.promotion.findMany({
      where: { appId },
      orderBy: { createdAt: "desc" },
      include: {
        product: { select: { name: true } },
        _count: { select: { redemptions: true } },
      },
    }),
    prisma.product.findMany({
      where: { appId, isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/dashboard/apps/${appId}`}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Promotions</h1>
          <p className="text-muted-foreground">{app.name}</p>
        </div>
        <CreatePromotionDialog appId={appId} products={products} />
      </div>

      {app.mode === "sandbox" && <SandboxBanner />}

      {promotions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground">
              No promotions yet. Create one to offer discounts or extended trials.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Mobile: card layout */}
          <div className="space-y-3 md:hidden">
            {promotions.map((promo) => (
              <Card key={promo.id}>
                <CardContent className="py-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-sm">{promo.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDiscount(promo)}
                      </p>
                    </div>
                    <StatusBadge status={promo.status} />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {promo.code && (
                      <Badge variant="outline">
                        <code>{promo.code}</code>
                      </Badge>
                    )}
                    <span className="text-muted-foreground">
                      {promo._count.redemptions} redemptions
                    </span>
                    <span className="text-muted-foreground">
                      {promo.product ? promo.product.name : "All products"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <PromotionToggle
                      promotionId={promo.id}
                      isActive={promo.status === "ACTIVE"}
                    />
                    <PromotionDelete promotionId={promo.id} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop: table layout */}
          <Card className="hidden md:block">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Applies To</TableHead>
                    <TableHead>Redemptions</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {promotions.map((promo) => (
                    <TableRow key={promo.id}>
                      <TableCell className="font-medium">{promo.name}</TableCell>
                      <TableCell>
                        {promo.code ? (
                          <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
                            {promo.code}
                          </code>
                        ) : (
                          <span className="text-xs text-muted-foreground">Auto</span>
                        )}
                      </TableCell>
                      <TableCell>{formatDiscount(promo)}</TableCell>
                      <TableCell className="capitalize">
                        {promo.duration.toLowerCase()}
                        {promo.duration === "REPEATING" && promo.durationInMonths
                          ? ` (${promo.durationInMonths}mo)`
                          : ""}
                      </TableCell>
                      <TableCell>
                        {promo.product ? promo.product.name : "All"}
                      </TableCell>
                      <TableCell>
                        {promo._count.redemptions}
                        {promo.maxRedemptions
                          ? ` / ${promo.maxRedemptions}`
                          : ""}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {promo.expiresAt
                          ? promo.expiresAt.toLocaleDateString("en-GB")
                          : "Never"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={promo.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <PromotionToggle
                            promotionId={promo.id}
                            isActive={promo.status === "ACTIVE"}
                          />
                          <PromotionDelete promotionId={promo.id} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "ACTIVE":
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20">
          Active
        </Badge>
      )
    case "PAUSED":
      return <Badge variant="secondary">Paused</Badge>
    case "EXPIRED":
      return <Badge variant="outline">Expired</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}
