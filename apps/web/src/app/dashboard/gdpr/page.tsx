import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
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
import { GdprCustomerSearch } from "@/components/dashboard/GdprCustomerSearch"
import { ShieldCheck } from "lucide-react"

export default async function GdprPage() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  // Fetch audit logs for all apps belonging to this developer
  const auditLogs = await prisma.gdprAuditLog.findMany({
    where: { app: { clerkUserId: userId } },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { app: { select: { name: true } } },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">GDPR Tools</h1>
        <p className="text-muted-foreground">
          Export and delete customer data in compliance with EU data protection regulations.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-primary mt-0.5" />
          <div className="space-y-1">
            <CardTitle className="text-base">GDPR Compliance</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            <strong>Art. 15 — Right of Access:</strong> Use the Export button to download
            all data held for a customer as a JSON file.
          </p>
          <Separator />
          <p>
            <strong>Art. 17 — Right to Erasure:</strong> Use the Delete button to
            anonymise a customer&apos;s personal data. Email, name, and Stripe references
            are removed.
          </p>
          <Separator />
          <p>
            <strong>Art. 20 — Data Portability:</strong> The exported JSON is
            machine-readable and includes all customer, entitlement, and transaction
            records.
          </p>
          <Separator />
          <p>
            <strong>GoBD Retention:</strong> Financial transaction records are retained
            for 10-year tax compliance even after personal data deletion.
          </p>
        </CardContent>
      </Card>

      <GdprCustomerSearch />

      {/* GDPR Audit Log */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Audit Log</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {auditLogs.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-muted-foreground">
              No GDPR actions recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>User ID</TableHead>
                    <TableHead>App</TableHead>
                    <TableHead>Requested By</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        {log.action === "EXPORT" ? (
                          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400">
                            Export
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400">
                            Delete
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <code className="text-xs font-mono">{log.userId}</code>
                      </TableCell>
                      <TableCell className="text-sm">{log.app.name}</TableCell>
                      <TableCell>
                        <code className="text-xs font-mono text-muted-foreground">
                          {log.requestedBy.slice(0, 16)}…
                        </code>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {log.createdAt.toLocaleString("en-GB")}
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
