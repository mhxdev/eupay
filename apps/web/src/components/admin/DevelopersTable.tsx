"use client"

import { useState } from "react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PlatformFeeEditor } from "./PlatformFeeEditor"
import { Search } from "lucide-react"

export type DeveloperRow = {
  clerkUserId: string
  email: string
  name: string
  appsCount: number
  volume: number
  transactions: number
  stripeConnected: boolean
  feePercent: number
  firstAppId: string
  lastTxDate: string | null
  joinedDate: string
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100)
}

export function DevelopersTable({ developers }: { developers: DeveloperRow[] }) {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)
  const perPage = 15

  const filtered = search.trim()
    ? developers.filter(
        (d) =>
          d.email.toLowerCase().includes(search.toLowerCase()) ||
          d.name.toLowerCase().includes(search.toLowerCase())
      )
    : developers

  const totalPages = Math.ceil(filtered.length / perPage)
  const paginated = filtered.slice(page * perPage, (page + 1) * perPage)

  return (
    <div className="space-y-3">
      <div className="relative w-64">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search by email or name..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0) }}
          className="pl-9 h-9 text-sm"
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Name</TableHead>
            <TableHead className="text-right">Apps</TableHead>
            <TableHead className="text-right">Volume</TableHead>
            <TableHead className="text-right">Txns</TableHead>
            <TableHead>Stripe</TableHead>
            <TableHead>Fee</TableHead>
            <TableHead>Last Txn</TableHead>
            <TableHead>Joined</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginated.map((dev) => (
            <TableRow
              key={dev.clerkUserId}
              className="cursor-pointer hover:bg-white/[0.03]"
            >
              <TableCell>
                <Link
                  href={`/admin/developers/${dev.clerkUserId}`}
                  className="hover:underline text-sm"
                >
                  {dev.email}
                </Link>
              </TableCell>
              <TableCell className="text-sm">{dev.name || "\u2014"}</TableCell>
              <TableCell className="text-right">{dev.appsCount}</TableCell>
              <TableCell className="text-right text-sm">
                {formatCurrency(dev.volume)}
              </TableCell>
              <TableCell className="text-right">{dev.transactions}</TableCell>
              <TableCell>
                {dev.stripeConnected ? (
                  <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="destructive">Not connected</Badge>
                )}
              </TableCell>
              <TableCell>
                <PlatformFeeEditor appId={dev.firstAppId} currentFee={dev.feePercent} />
              </TableCell>
              <TableCell className="text-muted-foreground text-xs">
                {dev.lastTxDate ?? "Never"}
              </TableCell>
              <TableCell className="text-muted-foreground text-xs">
                {dev.joinedDate}
              </TableCell>
            </TableRow>
          ))}
          {filtered.length === 0 && (
            <TableRow>
              <TableCell colSpan={9} className="text-center text-muted-foreground">
                {search ? "No developers match your search" : "No developers yet"}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-muted-foreground">
            Showing {page * perPage + 1}–{Math.min((page + 1) * perPage, filtered.length)} of {filtered.length}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="px-2.5 py-1 text-xs rounded border border-border disabled:opacity-30 hover:bg-white/[0.05]"
            >
              Prev
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="px-2.5 py-1 text-xs rounded border border-border disabled:opacity-30 hover:bg-white/[0.05]"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
