"use client"

import { useEffect, useState, useCallback } from "react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TrendingUp, Hash, RefreshCw } from "lucide-react"

type Period = "7d" | "30d" | "90d"

type DataPoint = {
  date: string
  revenue: number
  transactions: number
}

type AnalyticsData = {
  series: DataPoint[]
  totals: {
    revenue: number
    transactions: number
    mrr: number
  }
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

function formatDateLabel(dateStr: string, period: Period) {
  const date = new Date(dateStr + "T00:00:00")
  if (period === "7d") {
    return date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric" })
  }
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" })
}

const PERIODS: { value: Period; label: string }[] = [
  { value: "7d", label: "7D" },
  { value: "30d", label: "30D" },
  { value: "90d", label: "90D" },
]

export function AppRevenueChart({ appId }: { appId: string }) {
  const [period, setPeriod] = useState<Period>("30d")
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async (p: Period) => {
    setLoading(true)
    try {
      const res = await fetch(
        `/api/dashboard/apps/${appId}/analytics?period=${p}`
      )
      if (res.ok) {
        setData(await res.json())
      }
    } finally {
      setLoading(false)
    }
  }, [appId])

  useEffect(() => {
    fetchData(period)
  }, [period, fetchData])

  const tickInterval =
    period === "7d" ? 0 : period === "30d" ? 4 : 13

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Revenue</CardTitle>
        <div className="flex gap-1">
          {PERIODS.map((p) => (
            <Button
              key={p.value}
              variant={period === p.value ? "default" : "outline"}
              size="sm"
              className="h-7 px-3 text-xs"
              onClick={() => setPeriod(p.value)}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary stats */}
        {loading ? (
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[0, 1, 2].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 w-20 rounded bg-muted animate-pulse" />
                <div className="h-7 w-24 rounded bg-muted animate-pulse" />
              </div>
            ))}
          </div>
        ) : data ? (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Total Revenue
              </p>
              <p className="text-xl font-bold">
                {formatCurrency(data.totals.revenue)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Hash className="h-3 w-3" />
                Transactions
              </p>
              <p className="text-xl font-bold">
                {data.totals.transactions}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <RefreshCw className="h-3 w-3" />
                MRR
              </p>
              <p className="text-xl font-bold">
                {formatCurrency(data.totals.mrr)}
              </p>
            </div>
          </div>
        ) : null}

        {/* Chart */}
        {loading ? (
          <div className="h-[300px] rounded bg-muted animate-pulse" />
        ) : !data || data.totals.transactions === 0 ? (
          <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
            <TrendingUp className="h-8 w-8 mb-2" />
            <p className="text-sm">No transactions in this period</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart
              data={data.series}
              margin={{ top: 5, right: 20, bottom: 5, left: 20 }}
            >
              <defs>
                <linearGradient id="appRevGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tickFormatter={(v) => formatDateLabel(v, period)}
                interval={tickInterval}
                tick={{ fontSize: 11 }}
                className="fill-muted-foreground"
              />
              <YAxis
                tickFormatter={(v) => formatCurrency(v)}
                tick={{ fontSize: 11 }}
                className="fill-muted-foreground"
              />
              <Tooltip
                labelFormatter={(label) => {
                  const d = new Date(label + "T00:00:00")
                  return d.toLocaleDateString("en-GB", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                }}
                formatter={(value, name) => [
                  name === "revenue"
                    ? formatCurrency(value as number)
                    : String(value),
                  name === "revenue" ? "Revenue" : "Transactions",
                ]}
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid hsl(var(--border))",
                  backgroundColor: "hsl(var(--card))",
                }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#14b8a6"
                strokeWidth={2}
                fill="url(#appRevGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
