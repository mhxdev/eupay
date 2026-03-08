"use client"

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"

// ── Checkout Funnel Chart ─────────────────────────────────────
export type DailyFunnel = {
  date: string
  created: number
  completed: number
}

export function CheckoutFunnelChart({ data }: { data: DailyFunnel[] }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
        No checkout data yet
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="date"
          interval={6}
          tick={{ fontSize: 12 }}
          className="fill-muted-foreground"
        />
        <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
        <Tooltip
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid hsl(var(--border))",
            backgroundColor: "hsl(var(--card))",
          }}
        />
        <Line
          type="monotone"
          dataKey="created"
          name="Sessions Created"
          stroke="hsl(var(--muted-foreground))"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="completed"
          name="Sessions Completed"
          stroke="hsl(160, 60%, 45%)"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

// ── SDK Events Daily Chart ────────────────────────────────────
export type DailySdkEvents = {
  date: string
  events: number
}

export function SdkEventsChart({ data }: { data: DailySdkEvents[] }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">
        No SDK event data yet
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="date" interval={6} tick={{ fontSize: 12 }} className="fill-muted-foreground" />
        <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
        <Tooltip
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid hsl(var(--border))",
            backgroundColor: "hsl(var(--card))",
          }}
        />
        <Line type="monotone" dataKey="events" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}

// ── Region Donut Chart ────────────────────────────────────────
export type RegionData = {
  name: string
  value: number
}

const REGION_COLORS = ["hsl(160, 60%, 45%)", "hsl(220, 15%, 50%)"]

export function RegionDonutChart({ data }: { data: RegionData[] }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
        No region data
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={75}
          paddingAngle={2}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={REGION_COLORS[i % REGION_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}

// ── SDK Version Bar Chart ─────────────────────────────────────
export type SdkVersionData = {
  version: string
  count: number
}

export function SdkVersionChart({ data }: { data: SdkVersionData[] }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
        No SDK version data
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 50 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis type="number" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
        <YAxis dataKey="version" type="category" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
        <Tooltip
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid hsl(var(--border))",
            backgroundColor: "hsl(var(--card))",
          }}
        />
        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// ── Subscription Growth Bar Chart ─────────────────────────────
export type DailySubGrowth = {
  date: string
  net: number
}

export function SubGrowthChart({ data }: { data: DailySubGrowth[] }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">
        No subscription data yet
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="date" interval={6} tick={{ fontSize: 12 }} className="fill-muted-foreground" />
        <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
        <Tooltip
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid hsl(var(--border))",
            backgroundColor: "hsl(var(--card))",
          }}
        />
        <Bar
          dataKey="net"
          fill="hsl(160, 60%, 45%)"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
