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
import { CreateCampaignDialog } from "@/components/dashboard/CreateCampaignDialog"
import {
  CampaignStatusButton,
  CampaignEndButton,
  CampaignDeleteButton,
} from "@/components/dashboard/CampaignActions"
import { SandboxBanner } from "@/components/dashboard/SandboxBanner"
import { ArrowLeft } from "lucide-react"

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100)
}

export default async function CampaignsPage({
  params,
}: {
  params: Promise<{ appId: string }>
}) {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const { appId } = await params

  const app = await prisma.app.findUnique({ where: { id: appId } })
  if (!app || app.clerkUserId !== userId) notFound()

  const campaigns = await prisma.migrationCampaign.findMany({
    where: { appId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { productMappings: true, migrations: true } },
      migrations: {
        select: { status: true, savingsCentsPerMonth: true },
      },
    },
  })

  const [products, promotions] = await Promise.all([
    prisma.product.findMany({
      where: { appId, isActive: true },
      select: { id: true, name: true, amountCents: true, currency: true },
      orderBy: { name: "asc" },
    }),
    prisma.promotion.findMany({
      where: { appId, status: "ACTIVE" },
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
          <h1 className="text-2xl font-bold">Switch & Save Campaigns</h1>
          <p className="text-muted-foreground">{app.name}</p>
        </div>
        <CreateCampaignDialog appId={appId} products={products} promotions={promotions} />
      </div>

      {app.mode === "sandbox" && <SandboxBanner />}

      {campaigns.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground">
              No campaigns yet. Create one to start migrating Apple subscribers to direct billing.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {campaigns.map((c) => {
              const prompted = c.migrations.length
              const migrated = c.migrations.filter(
                (m) => m.status === "PURCHASED" || m.status === "COMPLETED"
              ).length
              const rate = prompted > 0 ? Math.round((migrated / prompted) * 100) : 0
              return (
                <Card key={c.id}>
                  <CardContent className="py-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <Link href={`/dashboard/apps/${appId}/campaigns/${c.id}`} className="hover:underline">
                        <p className="font-medium text-sm">{c.name}</p>
                      </Link>
                      <CampaignStatusBadge status={c.status} />
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>{c._count.productMappings} mappings</span>
                      <span>{prompted} prompted</span>
                      <span>{migrated} migrated ({rate}%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CampaignStatusButton campaignId={c.id} currentStatus={c.status} />
                      <CampaignEndButton campaignId={c.id} currentStatus={c.status} />
                      {c.status !== "ACTIVE" && <CampaignDeleteButton campaignId={c.id} />}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Desktop table */}
          <Card className="hidden md:block">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Mappings</TableHead>
                    <TableHead className="text-right">Prompted</TableHead>
                    <TableHead className="text-right">Migrated</TableHead>
                    <TableHead className="text-right">Rate</TableHead>
                    <TableHead className="text-right">Total Savings</TableHead>
                    <TableHead>Schedule</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((c) => {
                    const prompted = c.migrations.length
                    const migratedEvents = c.migrations.filter(
                      (m) => m.status === "PURCHASED" || m.status === "COMPLETED"
                    )
                    const migrated = migratedEvents.length
                    const rate = prompted > 0 ? Math.round((migrated / prompted) * 100) : 0
                    const totalSavings = migratedEvents.reduce(
                      (s, m) => s + m.savingsCentsPerMonth,
                      0
                    )
                    return (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">
                          <Link href={`/dashboard/apps/${appId}/campaigns/${c.id}`} className="hover:underline">
                            {c.name}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <CampaignStatusBadge status={c.status} />
                        </TableCell>
                        <TableCell className="text-right">{c._count.productMappings}</TableCell>
                        <TableCell className="text-right">{prompted}</TableCell>
                        <TableCell className="text-right">{migrated}</TableCell>
                        <TableCell className="text-right">{rate}%</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(totalSavings)}/mo
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {c.startDate ? c.startDate.toLocaleDateString("en-GB") : "—"}
                          {" → "}
                          {c.endDate ? c.endDate.toLocaleDateString("en-GB") : "∞"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <CampaignStatusButton campaignId={c.id} currentStatus={c.status} />
                            <CampaignEndButton campaignId={c.id} currentStatus={c.status} />
                            {c.status !== "ACTIVE" && <CampaignDeleteButton campaignId={c.id} />}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

function CampaignStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "ACTIVE":
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20">
          Active
        </Badge>
      )
    case "PAUSED":
      return (
        <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20">
          Paused
        </Badge>
      )
    case "ENDED":
      return (
        <Badge className="bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20">
          Ended
        </Badge>
      )
    default:
      return <Badge variant="secondary">Draft</Badge>
  }
}
