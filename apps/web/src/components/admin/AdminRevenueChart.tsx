"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

export type DailyRevenue = {
  date: string
  revenue: number
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value / 100)
}

export function AdminRevenueChart({ data }: { data: DailyRevenue[] }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        No revenue data yet
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="date"
          interval="preserveStartEnd"
          tickFormatter={(v) => {
            const [m, d] = v.split("-")
            const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
            return months[parseInt(m) - 1] + " " + parseInt(d)
          }}
          tick={{ fontSize: 11 }}
          className="fill-muted-foreground"
          minTickGap={40}
        />
        <YAxis
          tickFormatter={(v) => formatCurrency(v)}
          tick={{ fontSize: 11 }}
          className="fill-muted-foreground"
        />
        <Tooltip
          formatter={(value) => [formatCurrency(value as number), "Platform Fee"]}
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid hsl(var(--border))",
            backgroundColor: "hsl(var(--card))",
          }}
        />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
