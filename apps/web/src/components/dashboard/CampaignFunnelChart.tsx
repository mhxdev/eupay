"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"

type FunnelItem = { name: string; value: number }

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
]

export function CampaignFunnelChart({ data }: { data: FunnelItem[] }) {
  const max = Math.max(...data.map((d) => d.value), 1)

  return (
    <div className="space-y-4">
      {/* Simple bar funnel */}
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20 }}>
            <XAxis type="number" domain={[0, max]} hide />
            <YAxis
              type="category"
              dataKey="name"
              width={120}
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {data.map((_, idx) => (
                <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Conversion rates */}
      <div className="flex flex-wrap gap-3 text-xs">
        {data.map((item, idx) => {
          if (idx === 0) return null
          const prev = data[idx - 1].value
          const rate = prev > 0 ? Math.round((item.value / prev) * 100) : 0
          return (
            <span key={item.name} className="text-muted-foreground">
              {data[idx - 1].name} → {item.name}: <strong className="text-foreground">{rate}%</strong>
            </span>
          )
        })}
      </div>
    </div>
  )
}
