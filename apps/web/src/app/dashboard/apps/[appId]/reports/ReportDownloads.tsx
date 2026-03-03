"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Download } from "lucide-react"

const currentYear = new Date().getFullYear()

export function ReportDownloads({ appId }: { appId: string }) {
  // Transaction export state
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")

  // VAT report state
  const [year, setYear] = useState(currentYear.toString())
  const [quarter, setQuarter] = useState("full")

  const txUrl = (() => {
    const params = new URLSearchParams()
    if (from) params.set("from", from)
    if (to) params.set("to", to)
    const qs = params.toString()
    return `/api/dashboard/apps/${appId}/export/transactions${qs ? `?${qs}` : ""}`
  })()

  const vatUrl = (() => {
    const params = new URLSearchParams({ year })
    if (quarter !== "full") params.set("quarter", quarter)
    return `/api/dashboard/apps/${appId}/export/vat?${params.toString()}`
  })()

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Transaction Export */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Transaction Export</CardTitle>
          <CardDescription>
            CSV format, includes all succeeded transactions. Suitable for
            bookkeeping.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="from">From</Label>
              <Input
                id="from"
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="to">To</Label>
              <Input
                id="to"
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
          </div>
          <Button asChild size="sm" className="w-full">
            <a href={txUrl} download>
              <Download className="mr-2 h-4 w-4" />
              Download Transactions CSV
            </a>
          </Button>
        </CardContent>
      </Card>

      {/* VAT Report */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">VAT Report</CardTitle>
          <CardDescription>
            GoBD-compliant VAT summary grouped by EU country and rate.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Year</Label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[currentYear, currentYear - 1, currentYear - 2].map((y) => (
                    <SelectItem key={y} value={y.toString()}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Quarter</Label>
              <Select value={quarter} onValueChange={setQuarter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full Year</SelectItem>
                  <SelectItem value="1">Q1</SelectItem>
                  <SelectItem value="2">Q2</SelectItem>
                  <SelectItem value="3">Q3</SelectItem>
                  <SelectItem value="4">Q4</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button asChild size="sm" className="w-full">
            <a href={vatUrl} download>
              <Download className="mr-2 h-4 w-4" />
              Download VAT Report CSV
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
