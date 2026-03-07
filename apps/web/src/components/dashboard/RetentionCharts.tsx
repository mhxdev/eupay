"use client"

import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts"

const OUTCOME_COLORS: Record<string, string> = {
  "Saved (Discount)": "hsl(var(--chart-1))",
  "Saved (Pause)": "hsl(var(--chart-2))",
  "Saved (Downgrade)": "hsl(var(--chart-3))",
  "Cancelled": "hsl(var(--chart-5))",
}

type OutcomeData = { name: string; value: number }[]
type ReasonData = { reason: string; count: number }[]
type TrendData = { date: string; saveRate: number }[]

const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  fontSize: 12,
}

export function OutcomePieChart({ data }: { data: OutcomeData }) {
  if (data.every((d) => d.value === 0)) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        No cancellation events yet.
      </p>
    )
  }

  return (
    <div className="h-[250px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
            label={({ name, percent }: { name?: string; percent?: number }) =>
              `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`
            }
          >
            {data.map((entry) => (
              <Cell
                key={entry.name}
                fill={OUTCOME_COLORS[entry.name] ?? "hsl(var(--chart-4))"}
              />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

export function CancelReasonsChart({ data }: { data: ReasonData }) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        No cancel reasons recorded yet.
      </p>
    )
  }

  return (
    <div className="h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20 }}>
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="reason"
            width={160}
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="count" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function SaveRateTrendChart({ data }: { data: TrendData }) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        Not enough data for trend analysis.
      </p>
    )
  }

  return (
    <div className="h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ left: 0, right: 20 }}>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(v?: number) => [`${(v ?? 0).toFixed(0)}%`, "Save Rate"]}
          />
          <Line
            type="monotone"
            dataKey="saveRate"
            stroke="hsl(var(--chart-2))"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
