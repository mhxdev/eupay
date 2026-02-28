"use client"

import { useState } from "react"
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
import { ChevronDown, ChevronRight } from "lucide-react"

export type WebhookEventRow = {
  id: string
  type: string
  status: string
  error: string | null
  createdAt: string
  processedAt: string | null
  payload: string
}

const statusStyles: Record<string, string> = {
  PROCESSED: "bg-green-100 text-green-800 hover:bg-green-100",
  PENDING: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
  FAILED: "bg-red-100 text-red-800 hover:bg-red-100",
}

export function WebhookLog({ events }: { events: WebhookEventRow[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8"></TableHead>
            <TableHead>Event Type</TableHead>
            <TableHead>Event ID</TableHead>
            <TableHead>Timestamp</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Error</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                No webhook events received yet.
              </TableCell>
            </TableRow>
          ) : (
            events.map((event) => (
              <>
                <TableRow
                  key={event.id}
                  className="cursor-pointer"
                  onClick={() =>
                    setExpandedId(expandedId === event.id ? null : event.id)
                  }
                >
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      {expandedId === event.id ? (
                        <ChevronDown className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <code className="text-sm font-mono">{event.type}</code>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs font-mono text-muted-foreground">
                      {event.id.slice(0, 20)}...
                    </code>
                  </TableCell>
                  <TableCell className="text-sm">
                    {new Date(event.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge className={statusStyles[event.status] ?? ""}>
                      {event.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {event.error ? (
                      <span className="text-sm text-destructive truncate max-w-[200px] block">
                        {event.error}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
                {expandedId === event.id && (
                  <TableRow key={`${event.id}-payload`}>
                    <TableCell colSpan={6} className="bg-muted/50 p-4">
                      <pre className="text-xs font-mono whitespace-pre-wrap overflow-auto max-h-80">
                        {event.payload}
                      </pre>
                    </TableCell>
                  </TableRow>
                )}
              </>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
