import { auth } from "@clerk/nextjs/server"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ReportAllPendingButton } from "@/components/dashboard/ReportAllPendingButton"
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Settings,
  FileText,
} from "lucide-react"

function formatCurrency(cents: number, currency: string) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100)
}

export default async function DmaPage({
  params,
}: {
  params: Promise<{ appId: string }>
}) {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const { appId } = await params

  const app = await prisma.app.findUnique({
    where: { id: appId },
    select: {
      name: true,
      clerkUserId: true,
      dmaEntitlementConfirmed: true,
      appleKeyId: true,
      appleIssuerId: true,
      applePrivateKey: true,
      appleBundleId: true,
    },
  })
  if (!app || app.clerkUserId !== userId) notFound()

  const hasCredentials = !!(
    app.appleKeyId &&
    app.appleIssuerId &&
    app.applePrivateKey &&
    app.appleBundleId
  )

  const transactions = await prisma.transaction.findMany({
    where: { appId, status: "SUCCEEDED" },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      amountTotal: true,
      currency: true,
      createdAt: true,
      appleReportStatus: true,
      appleReportedAt: true,
      appleReportError: true,
    },
  })

  const reported = transactions.filter((t) => t.appleReportStatus === "REPORTED").length
  const failed = transactions.filter((t) => t.appleReportStatus === "FAILED").length
  const pending = transactions.filter(
    (t) => t.appleReportStatus !== "REPORTED" && t.appleReportStatus !== "FAILED"
  )

  const pendingIds = pending.map((t) => t.id)

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
          <h1 className="text-2xl font-bold">DMA Compliance</h1>
          <p className="text-muted-foreground">{app.name}</p>
        </div>
      </div>

      {/* Status cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Apple Credentials Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Apple Credentials
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              {hasCredentials ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm text-green-700 dark:text-green-400">
                    Configured
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <span className="text-sm text-red-700 dark:text-red-400">
                    Not configured
                  </span>
                </>
              )}
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href={`/dashboard/apps/${appId}`}>
                {hasCredentials ? "View Settings" : "Configure Now"}
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* DMA Entitlement Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              DMA Entitlement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              {app.dmaEntitlementConfirmed ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm text-green-700 dark:text-green-400">
                    Confirmed
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  <span className="text-sm text-orange-700 dark:text-orange-400">
                    Pending
                  </span>
                </>
              )}
            </div>
            {!app.dmaEntitlementConfirmed && (
              <p className="text-xs text-muted-foreground">
                Apply for Apple&apos;s External Purchase Link Entitlement in App Store
                Connect before going live.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Reporting summary */}
      <div className="grid gap-4 grid-cols-3">
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{reported}</p>
            <p className="text-xs text-muted-foreground">Reported</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{failed}</p>
            <p className="text-xs text-muted-foreground">Failed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-muted-foreground">{pending.length}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
      </div>

      {/* Report All Pending + links */}
      <div className="flex flex-wrap items-center gap-3">
        {hasCredentials && (
          <ReportAllPendingButton appId={appId} transactionIds={pendingIds} />
        )}
        <Button asChild variant="outline" size="sm">
          <Link href={`/dashboard/apps/${appId}/apple-reporting`}>
            <FileText className="mr-2 h-4 w-4" />
            Individual Reporting
          </Link>
        </Button>
        <Button asChild variant="ghost" size="sm">
          <a
            href="https://developer.apple.com/documentation/externalpurchaseserverapi"
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Apple API Docs
          </a>
        </Button>
      </div>

      {/* Transaction reporting table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Transaction Reporting</CardTitle>
          <CardDescription>
            Status of Apple External Purchase Server API reports for succeeded transactions.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {transactions.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-muted-foreground text-sm">No succeeded transactions yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-[700px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reported At</TableHead>
                    <TableHead>Error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>
                        <code className="text-xs font-mono">{tx.id.slice(0, 16)}…</code>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatCurrency(tx.amountTotal, tx.currency)}
                      </TableCell>
                      <TableCell>
                        {tx.appleReportStatus === "REPORTED" ? (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-500/10 dark:text-green-400">
                            Reported
                          </Badge>
                        ) : tx.appleReportStatus === "FAILED" ? (
                          <Badge className="bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400">
                            Failed
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {tx.appleReportedAt
                          ? tx.appleReportedAt.toLocaleString("en-GB")
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {tx.appleReportError ? (
                          <span className="text-xs text-destructive truncate max-w-[200px] block">
                            {tx.appleReportError}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
