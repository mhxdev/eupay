import { auth } from "@clerk/nextjs/server"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CreateProductDialog } from "@/components/dashboard/CreateProductDialog"
import { ProductToggle } from "@/components/dashboard/ProductToggle"
import { SyncProductsButton } from "@/components/dashboard/SyncProductsButton"
import { SandboxBanner } from "@/components/dashboard/SandboxBanner"
import { ArrowLeft, AlertTriangle } from "lucide-react"

function formatPrice(cents: number, currency: string) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100)
}

export default async function ProductsPage({
  params,
}: {
  params: Promise<{ appId: string }>
}) {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const { appId } = await params

  const app = await prisma.app.findUnique({ where: { id: appId } })
  if (!app || app.clerkUserId !== userId) notFound()

  const products = await prisma.product.findMany({
    where: { appId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { entitlements: true } } },
  })

  const hasStripe = !!app.stripeConnectId
  const unsyncedCount = products.filter((p) => !p.syncedToStripe).length

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
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-muted-foreground">{app.name}</p>
        </div>
        <CreateProductDialog appId={appId} hasStripe={hasStripe} />
      </div>

      {app.mode === "sandbox" && <SandboxBanner />}

      {unsyncedCount > 0 && (
        <div className="flex items-center gap-3 rounded-md border border-amber-500/30 bg-amber-500/5 px-4 py-3">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-amber-500">
              {unsyncedCount} product{unsyncedCount > 1 ? "s" : ""} pending Stripe sync
            </p>
            <p className="text-xs text-amber-500/70">
              {hasStripe
                ? "These products need to be synced to your Stripe account."
                : "Connect Stripe to sync these products and start accepting payments."}
            </p>
          </div>
          {hasStripe && <SyncProductsButton appId={appId} />}
        </div>
      )}

      {products.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground">
              No products yet. Create your first product to start accepting payments.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Mobile: card layout */}
          <div className="space-y-3 md:hidden">
            {products.map((product) => (
              <Card key={product.id}>
                <CardContent className="py-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-sm">
                        {product.name}
                        {product.trialDays && product.trialDays > 0 ? (
                          <span className="ml-1 text-xs text-muted-foreground">
                            ({product.trialDays}d trial)
                          </span>
                        ) : null}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatPrice(product.amountCents, product.currency)}
                        {product.interval && `/${product.interval}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {!product.syncedToStripe ? (
                        <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20">Pending sync</Badge>
                      ) : product.isActive ? (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                      <ProductToggle productId={product.id} isActive={product.isActive} />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <Badge variant="outline">
                      {product.productType === "SUBSCRIPTION" ? `${product.interval}ly` : "One-time"}
                    </Badge>
                    <span className="text-muted-foreground">{product._count.entitlements} subscribers</span>
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
                    <TableHead>Type</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stripe Price ID</TableHead>
                    <TableHead>App Store ID</TableHead>
                    <TableHead>Subscribers</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">
                        {product.name}
                        {product.trialDays && product.trialDays > 0 ? (
                          <span className="ml-2 text-xs text-muted-foreground">
                            ({product.trialDays}d trial)
                          </span>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {product.productType === "SUBSCRIPTION"
                            ? `${product.interval}ly`
                            : "One-time"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatPrice(product.amountCents, product.currency)}
                        {product.interval && (
                          <span className="text-muted-foreground">
                            /{product.interval}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {product.syncedToStripe ? (
                          <code className="text-xs font-mono">{product.stripePriceId}</code>
                        ) : (
                          <span className="text-xs text-amber-500">Pending sync</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {product.appStoreProductId ? (
                          <span className="flex items-center gap-1 text-xs">
                            <code className="font-mono">{product.appStoreProductId}</code>
                            <Badge variant="secondary" className="text-[10px]">Mapped</Badge>
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>{product._count.entitlements}</TableCell>
                      <TableCell>
                        {!product.syncedToStripe ? (
                          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20">Pending sync</Badge>
                        ) : product.isActive ? (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <ProductToggle
                          productId={product.id}
                          isActive={product.isActive}
                        />
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
