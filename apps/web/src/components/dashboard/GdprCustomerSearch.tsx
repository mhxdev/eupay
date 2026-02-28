"use client"

import { useState, useTransition } from "react"
import {
  searchCustomersForGdpr,
  exportCustomerData,
  deleteCustomerData,
  type GdprCustomerResult,
} from "@/lib/actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Search, Download, Trash2, Loader2 } from "lucide-react"

export function GdprCustomerSearch() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<GdprCustomerResult[]>([])
  const [searched, setSearched] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [exportingId, setExportingId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<GdprCustomerResult | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  function handleSearch() {
    if (!query.trim()) return
    startTransition(async () => {
      const data = await searchCustomersForGdpr(query)
      setResults(data)
      setSearched(true)
    })
  }

  async function handleExport(customerId: string) {
    setExportingId(customerId)
    try {
      const data = await exportCustomerData(customerId)
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `gdpr-export-${customerId}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      alert(err instanceof Error ? err.message : "Export failed")
    } finally {
      setExportingId(null)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      await deleteCustomerData(deleteTarget.id)
      // Update local state to reflect deletion
      setResults((prev) =>
        prev.map((c) =>
          c.id === deleteTarget.id ? { ...c, email: null, deletedAt: new Date() } : c
        )
      )
      setDeleteTarget(null)
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Search Customers</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSearch()
            }}
            className="flex gap-3"
          >
            <Input
              placeholder="Search by email or user ID..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="max-w-md"
            />
            <Button type="submit" disabled={isPending || !query.trim()}>
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              <span className="ml-2">Search</span>
            </Button>
          </form>
        </CardContent>
      </Card>

      {searched && (
        <Card>
          <CardHeader>
            <CardTitle>
              Results{" "}
              <span className="text-muted-foreground font-normal text-sm">
                ({results.length} found)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {results.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No customers found matching &quot;{query}&quot;.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>User ID</TableHead>
                    <TableHead>App</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-sm">
                        {c.email ?? "—"}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {c.externalUserId}
                      </TableCell>
                      <TableCell>{c.appName}</TableCell>
                      <TableCell>
                        {new Date(c.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </TableCell>
                      <TableCell>
                        {c.deletedAt ? (
                          <Badge variant="destructive">Deleted</Badge>
                        ) : (
                          <Badge variant="secondary">Active</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleExport(c.id)}
                            disabled={exportingId === c.id}
                          >
                            {exportingId === c.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Download className="h-3.5 w-3.5" />
                            )}
                            <span className="ml-1.5">Export</span>
                          </Button>
                          {!c.deletedAt && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setDeleteTarget(c)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span className="ml-1.5">Delete</span>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm GDPR Deletion</DialogTitle>
            <DialogDescription>
              This will permanently anonymise all personal data for this customer.
              Financial records are retained for 10-year tax compliance (GoBD).
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deleteTarget && (
            <div className="rounded-md border p-3 text-sm space-y-1">
              <p>
                <strong>Email:</strong> {deleteTarget.email ?? "—"}
              </p>
              <p>
                <strong>User ID:</strong> {deleteTarget.externalUserId}
              </p>
              <p>
                <strong>App:</strong> {deleteTarget.appName}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Delete Customer Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
