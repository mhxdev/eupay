import { auth } from "@clerk/nextjs/server"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ReportDownloads } from "./ReportDownloads"

function formatCurrency(cents: number, currency = "eur") {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency,
  }).format(cents / 100)
}

export default async function ReportsPage({
  params,
}: {
  params: Promise<{ appId: string }>
}) {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const { appId } = await params

  const app = await prisma.app.findUnique({
    where: { id: appId },
    select: { name: true, clerkUserId: true },
  })
  if (!app || app.clerkUserId !== userId) notFound()

  // Last 30 days of transactions for inline summary
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const recentTransactions = await prisma.transaction.findMany({
    where: {
      appId,
      status: "SUCCEEDED",
      createdAt: { gte: thirtyDaysAgo },
    },
    orderBy: { createdAt: "desc" },
    include: { product: { select: { name: true } } },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-muted-foreground">
          Export transactions and VAT reports for {app.name}.
        </p>
      </div>

      <ReportDownloads appId={appId} />

      {/* Transaction summary — last 30 days */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Last 30 Days</CardTitle>
          <CardDescription>
            {recentTransactions.length} succeeded transaction{recentTransactions.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">VAT</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentTransactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="text-xs text-muted-foreground">
                    {tx.createdAt.toLocaleDateString("en-GB")}
                  </TableCell>
                  <TableCell className="text-sm">{tx.product.name}</TableCell>
                  <TableCell className="text-right text-sm">
                    {formatCurrency(tx.amountTotal, tx.currency)}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {formatCurrency(tx.amountTax, tx.currency)}
                    {tx.vatRate != null && (
                      <span className="text-muted-foreground text-xs ml-1">
                        ({(tx.vatRate * 100).toFixed(0)}%)
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{tx.vatCountry ?? "—"}</TableCell>
                  <TableCell>
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      Succeeded
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {recentTransactions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No transactions in the last 30 days
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
