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
import { SandboxBanner } from "@/components/dashboard/SandboxBanner"
import { ReportButton } from "@/components/dashboard/ReportButton"
import { ArrowLeft, AlertTriangle } from "lucide-react"

function formatCurrency(cents: number, currency: string) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100)
}

export default async function AppleReportingPage({
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
      id: true,
      name: true,
      clerkUserId: true,
      mode: true,
      appleKeyId: true,
      appleIssuerId: true,
      applePrivateKey: true,
      appleBundleId: true,
    },
  })
  if (!app || app.clerkUserId !== userId) notFound()

  const hasCredentials = !!(app.appleKeyId && app.appleIssuerId && app.applePrivateKey && app.appleBundleId)

  const transactions = await prisma.transaction.findMany({
    where: { appId },
    orderBy: { createdAt: "desc" },
    take: 50,
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
  const pending = transactions.filter((t) => t.appleReportStatus !== "REPORTED" && t.appleReportStatus !== "FAILED").length

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
          <h1 className="text-2xl font-bold">Apple Reporting</h1>
          <p className="text-muted-foreground">{app.name}</p>
        </div>
      </div>

      {app.mode === "sandbox" && <SandboxBanner />}

      {!hasCredentials && (
        <Card className="border-orange-200 bg-orange-50 dark:border-orange-500/20 dark:bg-orange-500/5">
          <CardContent className="flex items-start gap-3 py-4">
            <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-orange-900 dark:text-orange-300">
                Apple credentials not configured
              </p>
              <p className="text-sm text-orange-700 dark:text-orange-400/80">
                You need to set your Apple Key ID, Issuer ID, Private Key, and Bundle ID before reporting.{" "}
                <Link href={`/dashboard/apps/${appId}`} className="underline font-medium">
                  Configure in app settings
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
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
            <p className="text-2xl font-bold text-muted-foreground">{pending}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
      </div>

      {/* Transactions table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Transactions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {transactions.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-muted-foreground text-sm">No transactions yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-[700px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Report Status</TableHead>
                    <TableHead>Reported At</TableHead>
                    <TableHead>Error</TableHead>
                    <TableHead className="text-right">Action</TableHead>
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
                      <TableCell className="text-sm">
                        {tx.createdAt.toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {tx.appleReportStatus === "REPORTED" ? (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-500/10 dark:text-green-400">Reported</Badge>
                        ) : tx.appleReportStatus === "FAILED" ? (
                          <Badge className="bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400">Failed</Badge>
                        ) : (
                          <Badge variant="secondary">Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {tx.appleReportedAt ? tx.appleReportedAt.toLocaleString() : "—"}
                      </TableCell>
                      <TableCell>
                        {tx.appleReportError ? (
                          <span className="text-xs text-destructive truncate max-w-[150px] block">
                            {tx.appleReportError}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {tx.appleReportStatus !== "REPORTED" && hasCredentials && (
                          <ReportButton appId={appId} transactionId={tx.id} />
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
