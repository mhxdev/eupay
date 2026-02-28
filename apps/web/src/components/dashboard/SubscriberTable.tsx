"use client"

import { useState, useMemo } from "react"
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from "@tanstack/react-table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Search, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react"
import { SubscriberActions } from "./SubscriberActions"

export type SubscriberRow = {
  customerId: string
  email: string | null
  externalUserId: string
  productName: string
  status: string
  since: string
  nextBilling: string | null
  cancelAtPeriodEnd: boolean
  lifetimeRevenue: number
  currency: string
  entitlementId: string
  stripeSubscriptionId: string | null
  stripeCustomerId: string
}

const columnHelper = createColumnHelper<SubscriberRow>()

function formatPrice(cents: number, currency: string) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100)
}

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800 hover:bg-green-100",
  EXPIRED: "bg-gray-100 text-gray-800 hover:bg-gray-100",
  CANCELLED: "bg-red-100 text-red-800 hover:bg-red-100",
  PAUSED: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
}

const columns = [
  columnHelper.accessor("email", {
    header: "Email",
    cell: (info) => (
      <span className="font-medium">
        {info.getValue() ?? (
          <span className="text-muted-foreground italic">
            {info.row.original.externalUserId}
          </span>
        )}
      </span>
    ),
  }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: (info) => {
      const val = info.getValue()
      return (
        <div className="flex items-center gap-1.5">
          <Badge className={statusColors[val] ?? ""}>
            {val}
          </Badge>
          {info.row.original.cancelAtPeriodEnd && (
            <span className="text-xs text-muted-foreground">(cancelling)</span>
          )}
        </div>
      )
    },
  }),
  columnHelper.accessor("productName", {
    header: "Product",
  }),
  columnHelper.accessor("since", {
    header: "Since",
    cell: (info) => new Date(info.getValue()).toLocaleDateString(),
  }),
  columnHelper.accessor("nextBilling", {
    header: "Next Billing",
    cell: (info) => {
      const val = info.getValue()
      return val ? new Date(val).toLocaleDateString() : "—"
    },
  }),
  columnHelper.accessor("lifetimeRevenue", {
    header: "Revenue",
    cell: (info) =>
      formatPrice(info.getValue(), info.row.original.currency),
  }),
  columnHelper.display({
    id: "actions",
    header: "",
    cell: (info) => (
      <SubscriberActions
        entitlementId={info.row.original.entitlementId}
        stripeSubscriptionId={info.row.original.stripeSubscriptionId}
        stripeCustomerId={info.row.original.stripeCustomerId}
        productName={info.row.original.productName}
        email={info.row.original.email}
        status={info.row.original.status}
      />
    ),
  }),
]

export function SubscriberTable({ data }: { data: SubscriberRow[] }) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const filteredData = useMemo(() => {
    if (statusFilter === "all") return data
    return data.filter((d) => d.status === statusFilter)
  }, [data, statusFilter])

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 20 } },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by email..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
            <SelectItem value="EXPIRED">Expired</SelectItem>
            <SelectItem value="PAUSED">Paused</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="cursor-pointer select-none"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No subscribers found.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredData.length} subscriber{filteredData.length !== 1 ? "s" : ""}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
