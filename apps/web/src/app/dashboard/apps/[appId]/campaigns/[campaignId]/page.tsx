import { auth } from "@clerk/nextjs/server"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  CampaignStatusButton,
  CampaignEndButton,
} from "@/components/dashboard/CampaignActions"
import { CampaignFunnelChart } from "@/components/dashboard/CampaignFunnelChart"
import { ArrowLeft } from "lucide-react"

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100)
}

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ appId: string; campaignId: string }>
}) {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const { appId, campaignId } = await params

  const campaign = await prisma.migrationCampaign.findUnique({
    where: { id: campaignId },
    include: {
      app: true,
      productMappings: {
        include: {
          euroPayProduct: { select: { name: true, amountCents: true, currency: true } },
        },
      },
      migrations: {
        orderBy: { updatedAt: "desc" },
      },
    },
  })

  if (!campaign || campaign.app.clerkUserId !== userId || campaign.appId !== appId) {
    notFound()
  }

  // Funnel data
  const prompted = campaign.migrations.filter(
    (m) => m.status !== "DISMISSED"
  ).length
  const clicked = campaign.migrations.filter(
    (m) => ["CLICKED", "PURCHASED", "APPLE_CANCELLED", "COMPLETED"].includes(m.status)
  ).length
  const purchased = campaign.migrations.filter(
    (m) => ["PURCHASED", "APPLE_CANCELLED", "COMPLETED"].includes(m.status)
  ).length
  const appleCancelled = campaign.migrations.filter(
    (m) => ["APPLE_CANCELLED", "COMPLETED"].includes(m.status)
  ).length
  const completed = campaign.migrations.filter(
    (m) => m.status === "COMPLETED"
  ).length

  const funnelData = [
    { name: "Prompted", value: prompted },
    { name: "Clicked", value: clicked },
    { name: "Purchased", value: purchased },
    { name: "Apple Cancelled", value: appleCancelled },
    { name: "Completed", value: completed },
  ]

  // Per-mapping stats
  const mappingStats = campaign.productMappings.map((m) => {
    const events = campaign.migrations.filter(
      (e) => e.appleProductId === m.appleProductId
    )
    const mappingPrompted = events.length
    const mappingMigrated = events.filter(
      (e) => e.status === "PURCHASED" || e.status === "COMPLETED"
    ).length
    const mappingSavings = events
      .filter((e) => e.status === "PURCHASED" || e.status === "COMPLETED")
      .reduce((s, e) => s + e.savingsCentsPerMonth, 0)
    return {
      ...m,
      prompted: mappingPrompted,
      migrated: mappingMigrated,
      totalSavings: mappingSavings,
    }
  })

  // Recent events
  const recentEvents = campaign.migrations.slice(0, 20)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/dashboard/apps/${appId}/campaigns`}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{campaign.name}</h1>
          <p className="text-muted-foreground">{campaign.app.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <CampaignStatusBadge status={campaign.status} />
          <CampaignStatusButton campaignId={campaign.id} currentStatus={campaign.status} />
          <CampaignEndButton campaignId={campaign.id} currentStatus={campaign.status} />
        </div>
      </div>

      {/* Config summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Campaign Configuration</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Title</span>
            <p className="font-medium">{campaign.title}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Subtitle</span>
            <p className="font-medium">{campaign.subtitle}</p>
          </div>
          <div>
            <span className="text-muted-foreground">CTA</span>
            <p className="font-medium">{campaign.ctaText}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Audience</span>
            <p className="font-medium capitalize">
              {campaign.audienceType.toLowerCase().replace(/_/g, " ")}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">Rollout</span>
            <p className="font-medium">{campaign.rolloutPercent}%</p>
          </div>
          <div>
            <span className="text-muted-foreground">Discount</span>
            <p className="font-medium">{campaign.discountPercent ? `${campaign.discountPercent}%` : "—"}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Start</span>
            <p className="font-medium">{campaign.startDate?.toLocaleDateString("en-GB") ?? "Immediate"}</p>
          </div>
          <div>
            <span className="text-muted-foreground">End</span>
            <p className="font-medium">{campaign.endDate?.toLocaleDateString("en-GB") ?? "Indefinite"}</p>
          </div>
        </CardContent>
      </Card>

      {/* Funnel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Migration Funnel</CardTitle>
        </CardHeader>
        <CardContent>
          <CampaignFunnelChart data={funnelData} />
        </CardContent>
      </Card>

      <Separator />

      {/* Product mappings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Product Mappings</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Apple Product</TableHead>
                <TableHead className="text-right">Apple Price</TableHead>
                <TableHead>EuroPay Product</TableHead>
                <TableHead className="text-right">EuroPay Price</TableHead>
                <TableHead className="text-right">Prompted</TableHead>
                <TableHead className="text-right">Migrated</TableHead>
                <TableHead className="text-right">Savings/mo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mappingStats.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{m.appleProductName}</p>
                      <code className="text-xs text-muted-foreground">{m.appleProductId}</code>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(m.applePriceCents)}</TableCell>
                  <TableCell className="font-medium text-sm">{m.euroPayProduct.name}</TableCell>
                  <TableCell className="text-right">{formatCurrency(m.euroPayProduct.amountCents)}</TableCell>
                  <TableCell className="text-right">{m.prompted}</TableCell>
                  <TableCell className="text-right">{m.migrated}</TableCell>
                  <TableCell className="text-right">{formatCurrency(m.totalSavings)}</TableCell>
                </TableRow>
              ))}
              {mappingStats.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No product mappings
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent events */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Migration Events</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Apple Product</TableHead>
                <TableHead className="text-right">Savings</TableHead>
                <TableHead>Prompted</TableHead>
                <TableHead>Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentEvents.map((evt) => (
                <TableRow key={evt.id}>
                  <TableCell className="font-mono text-xs">
                    {evt.userId.slice(0, 16)}…
                  </TableCell>
                  <TableCell>
                    <MigrationStatusBadge status={evt.status} />
                  </TableCell>
                  <TableCell className="text-xs">{evt.appleProductId}</TableCell>
                  <TableCell className="text-right text-xs">
                    {formatCurrency(evt.savingsCentsPerMonth)}/mo ({evt.savingsPercent.toFixed(0)}%)
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {evt.promptedAt.toLocaleDateString("en-GB")}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {evt.updatedAt.toLocaleDateString("en-GB")}
                  </TableCell>
                </TableRow>
              ))}
              {recentEvents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No migration events yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function CampaignStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "ACTIVE":
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20">Active</Badge>
    case "PAUSED":
      return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20">Paused</Badge>
    case "ENDED":
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20">Ended</Badge>
    default:
      return <Badge variant="secondary">Draft</Badge>
  }
}

function MigrationStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "COMPLETED":
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20">Completed</Badge>
    case "PURCHASED":
      return <Badge className="bg-teal-100 text-teal-800 hover:bg-teal-100 dark:bg-teal-500/10 dark:text-teal-400 dark:border-teal-500/20">Purchased</Badge>
    case "APPLE_CANCELLED":
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20">Apple Cancelled</Badge>
    case "CLICKED":
      return <Badge variant="secondary">Clicked</Badge>
    case "DISMISSED":
      return <Badge variant="outline">Dismissed</Badge>
    default:
      return <Badge variant="outline">Prompted</Badge>
  }
}
