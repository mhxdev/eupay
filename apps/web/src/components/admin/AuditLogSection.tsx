"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export type AuditEventRow = {
  id: string
  category: string
  action: string
  resourceType: string | null
  resourceId: string | null
  details: Record<string, unknown> | null
  createdAt: string // ISO string (serialized from server)
}

const CATEGORY_COLORS: Record<string, string> = {
  email: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  webhook_delivery: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  entitlement: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  stripe_connect: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  apple_report: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
}

export function AuditLogSection({ events }: { events: AuditEventRow[] }) {
  const [filter, setFilter] = useState("all")
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered = filter === "all"
    ? events
    : events.filter((e) => e.category === filter)

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-44 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="email">Emails</SelectItem>
            <SelectItem value="webhook_delivery">Webhooks</SelectItem>
            <SelectItem value="entitlement">Entitlements</SelectItem>
            <SelectItem value="stripe_connect">Stripe</SelectItem>
            <SelectItem value="apple_report">Apple</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No audit events
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Resource</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((evt) => {
              const isExpanded = expandedId === evt.id
              const detailsStr = evt.details ? JSON.stringify(evt.details) : ""
              const preview = detailsStr.length > 100
                ? detailsStr.substring(0, 100) + "..."
                : detailsStr

              return (
                <TableRow
                  key={evt.id}
                  className="cursor-pointer hover:bg-white/[0.03]"
                  onClick={() => setExpandedId(isExpanded ? null : evt.id)}
                >
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(evt.createdAt).toLocaleDateString("en-GB")}{" "}
                    {new Date(evt.createdAt).toLocaleTimeString("en-GB", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </TableCell>
                  <TableCell>
                    <Badge className={CATEGORY_COLORS[evt.category] ?? ""}>
                      {evt.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{evt.action}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {evt.resourceType && evt.resourceId
                      ? `${evt.resourceType}: ${evt.resourceId.slice(0, 12)}...`
                      : "\u2014"}
                  </TableCell>
                  <TableCell className="text-xs max-w-xs">
                    {isExpanded ? (
                      <pre className="whitespace-pre-wrap text-xs bg-muted/50 p-2 rounded-md mt-1 max-h-48 overflow-auto">
                        {JSON.stringify(evt.details, null, 2)}
                      </pre>
                    ) : (
                      <span className="text-muted-foreground truncate block max-w-xs">
                        {preview || "\u2014"}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
