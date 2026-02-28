import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CreateAppDialog } from "@/components/dashboard/CreateAppDialog"
import { Package, Key, Users, ArrowRight } from "lucide-react"

export default async function AppsPage() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const apps = await prisma.app.findMany({
    where: { clerkUserId: userId },
    include: {
      _count: { select: { products: true, customers: true, apiKeys: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Your Apps</h1>
          <p className="text-muted-foreground">
            Register iOS apps and manage API keys.
          </p>
        </div>
        <CreateAppDialog />
      </div>

      {apps.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No apps yet</h3>
            <p className="text-muted-foreground text-center max-w-sm">
              Register your first iOS app to get an API key for the EUPayKit SDK.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {apps.map((app) => (
            <Link key={app.id} href={`/dashboard/apps/${app.id}`}>
              <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{app.name}</CardTitle>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <CardDescription className="font-mono text-xs">
                    {app.bundleId}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Package className="h-3.5 w-3.5" />
                      {app._count.products} products
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {app._count.customers} customers
                    </span>
                    <span className="flex items-center gap-1">
                      <Key className="h-3.5 w-3.5" />
                      {app._count.apiKeys} keys
                    </span>
                  </div>
                  <div className="mt-3">
                    {app.dmaEntitlementConfirmed ? (
                      <Badge variant="secondary">DMA Confirmed</Badge>
                    ) : (
                      <Badge variant="outline">DMA Pending</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
