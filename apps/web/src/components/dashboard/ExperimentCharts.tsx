"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts"

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
]

const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  fontSize: 12,
}

type VariantMetric = { name: string; value: number }

export function VariantBarChart({
  data,
  valueLabel,
  formatValue,
}: {
  data: VariantMetric[]
  valueLabel: string
  formatValue?: (v: number) => string
}) {
  return (
    <div className="h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: 10, right: 10 }}>
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            tickFormatter={formatValue}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(v?: number) => [formatValue ? formatValue(v ?? 0) : (v ?? 0), valueLabel]}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((_, idx) => (
              <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

type TrendPoint = { date: string; [variant: string]: string | number }

export function ParticipantTrendChart({
  data,
  variantNames,
}: {
  data: TrendPoint[]
  variantNames: string[]
}) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        Not enough data for trend chart.
      </p>
    )
  }

  return (
    <div className="h-[250px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ left: 0, right: 20 }}>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          />
          <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend />
          {variantNames.map((name, idx) => (
            <Line
              key={name}
              type="monotone"
              dataKey={name}
              stroke={COLORS[idx % COLORS.length]}
              strokeWidth={2}
              dot={{ r: 2 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
