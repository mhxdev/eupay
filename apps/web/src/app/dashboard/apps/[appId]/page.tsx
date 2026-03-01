import { auth } from "@clerk/nextjs/server"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ApiKeySection } from "@/components/dashboard/ApiKeySection"
import { ModeToggle } from "@/components/dashboard/ModeToggle"
import { SandboxBanner } from "@/components/dashboard/SandboxBanner"
import { Package, Users, Webhook, ExternalLink } from "lucide-react"

export default async function AppDetailPage({
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
      apiKeys: { orderBy: { createdAt: "desc" } },
      _count: { select: { products: true, customers: true, transactions: true } },
    },
  })

  if (!app || app.clerkUserId !== userId) notFound()

  const apiKeysForClient = app.apiKeys.map((k) => ({
    id: k.id,
    keyPrefix: k.keyPrefix,
    name: k.name,
    isActive: k.isActive,
    lastUsedAt: k.lastUsedAt?.toISOString() ?? null,
    createdAt: k.createdAt.toISOString(),
  }))

  const navItems = [
    { href: `/dashboard/apps/${appId}/products`, label: "Products", icon: Package, count: app._count.products },
    { href: `/dashboard/apps/${appId}/subscribers`, label: "Subscribers", icon: Users, count: app._count.customers },
    { href: `/dashboard/apps/${appId}/webhooks`, label: "Webhook Logs", icon: Webhook, count: null },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{app.name}</h1>
          <p className="text-muted-foreground font-mono text-sm">{app.bundleId}</p>
        </div>
        <ModeToggle appId={appId} mode={app.mode} />
      </div>

      {app.mode === "sandbox" && <SandboxBanner />}

      {!app.dmaEntitlementConfirmed && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="flex items-start gap-3 py-4">
            <ExternalLink className="h-5 w-5 text-orange-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-orange-900">
                DMA Entitlement Required
              </p>
              <p className="text-sm text-orange-700">
                Before going live, ensure you have Apple&apos;s External Purchase Link entitlement.{" "}
                <a
                  href="https://developer.apple.com/contact/request/download/external_purchase.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-medium"
                >
                  Request here
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{item.label}</CardTitle>
                <item.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {item.count !== null && (
                  <p className="text-2xl font-bold">{item.count}</p>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Separator />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>App Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">App ID</span>
              <code className="font-mono text-xs">{app.id}</code>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Bundle ID</span>
              <code className="font-mono text-xs">{app.bundleId}</code>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created</span>
              <span>{app.createdAt.toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Mode</span>
              {app.mode === "sandbox" ? (
                <Badge className="bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-100">SANDBOX</Badge>
              ) : (
                <Badge className="bg-teal-100 text-teal-800 border-teal-300 hover:bg-teal-100">LIVE</Badge>
              )}
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">DMA Status</span>
              {app.dmaEntitlementConfirmed ? (
                <Badge variant="secondary">Confirmed</Badge>
              ) : (
                <Badge variant="outline">Pending</Badge>
              )}
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Revenue</span>
              <span className="font-medium">{app._count.transactions} transactions</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <ApiKeySection appId={appId} keys={apiKeysForClient} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
