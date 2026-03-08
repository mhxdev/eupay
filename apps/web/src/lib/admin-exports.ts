import { prisma } from "./prisma"
import { clerkClient } from "@clerk/nextjs/server"

function escapeCSV(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return ""
  const str = String(val)
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function csvRow(values: (string | number | null | undefined)[]): string {
  return values.map(escapeCSV).join(",")
}

/**
 * Export revenue CSV grouped by developer-app-day.
 */
export async function exportRevenueCSV(startDate?: Date, endDate?: Date): Promise<string> {
  const start = startDate ?? new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  const end = endDate ?? new Date()

  const transactions = await prisma.transaction.findMany({
    where: {
      status: "SUCCEEDED",
      createdAt: { gte: start, lte: end },
    },
    include: {
      app: { select: { name: true, clerkUserId: true } },
    },
    orderBy: { createdAt: "asc" },
  })

  // Batch fetch Clerk users for developer emails
  const clerkUserIds = [...new Set(transactions.map((t) => t.app.clerkUserId))]
  const emailMap = new Map<string, string>()
  try {
    const client = await clerkClient()
    const users = await client.users.getUserList({ userId: clerkUserIds, limit: 100 })
    for (const u of users.data) {
      emailMap.set(u.id, u.emailAddresses[0]?.emailAddress ?? u.id)
    }
  } catch {
    // Fallback: use Clerk IDs as emails
    for (const id of clerkUserIds) emailMap.set(id, id)
  }

  // Group by developer-app-day
  const groups = new Map<string, {
    date: string
    developerEmail: string
    appName: string
    txCount: number
    totalVolumeCents: number
    platformFeeCents: number
    currency: string
  }>()

  for (const tx of transactions) {
    const date = tx.createdAt.toISOString().split("T")[0]
    const key = `${tx.app.clerkUserId}|${tx.appId}|${date}`
    const existing = groups.get(key)
    const feeCents = tx.appliedFeeCents ?? Math.round(tx.amountTotal * 0.015)

    if (existing) {
      existing.txCount += 1
      existing.totalVolumeCents += tx.amountTotal
      existing.platformFeeCents += feeCents
    } else {
      groups.set(key, {
        date,
        developerEmail: emailMap.get(tx.app.clerkUserId) ?? tx.app.clerkUserId,
        appName: tx.app.name,
        txCount: 1,
        totalVolumeCents: tx.amountTotal,
        platformFeeCents: feeCents,
        currency: tx.currency,
      })
    }
  }

  const header = csvRow(["date", "developer_email", "app_name", "transaction_count", "total_volume_cents", "platform_fee_cents", "currency"])
  const rows = [...groups.values()].map((g) =>
    csvRow([g.date, g.developerEmail, g.appName, g.txCount, g.totalVolumeCents, g.platformFeeCents, g.currency])
  )

  return [header, ...rows].join("\n")
}

/**
 * Export developers CSV.
 */
export async function exportDevelopersCSV(): Promise<string> {
  const apps = await prisma.app.findMany({
    select: {
      id: true,
      name: true,
      companyName: true,
      clerkUserId: true,
      stripeConnectId: true,
      platformFeePercent: true,
      createdAt: true,
      _count: { select: { transactions: true } },
      transactions: {
        where: { status: "SUCCEEDED" },
        select: { amountTotal: true, appliedFeeCents: true },
      },
    },
  })

  // Group by developer
  const devMap = new Map<string, {
    clerkUserId: string
    companyName: string
    appsCount: number
    totalVolumeCents: number
    totalTransactions: number
    totalPlatformFeesCents: number
    stripeConnected: boolean
    currentFeePercent: number
    joinedDate: Date
  }>()

  for (const app of apps) {
    const vol = app.transactions.reduce((s, t) => s + t.amountTotal, 0)
    const fees = app.transactions.reduce((s, t) => s + (t.appliedFeeCents ?? Math.round(t.amountTotal * 0.015)), 0)
    const existing = devMap.get(app.clerkUserId)
    if (existing) {
      existing.appsCount += 1
      existing.totalVolumeCents += vol
      existing.totalTransactions += app._count.transactions
      existing.totalPlatformFeesCents += fees
      existing.stripeConnected = existing.stripeConnected || !!app.stripeConnectId
      if (app.createdAt < existing.joinedDate) existing.joinedDate = app.createdAt
      if (!existing.companyName && app.companyName) existing.companyName = app.companyName
    } else {
      devMap.set(app.clerkUserId, {
        clerkUserId: app.clerkUserId,
        companyName: app.companyName ?? "",
        appsCount: 1,
        totalVolumeCents: vol,
        totalTransactions: app._count.transactions,
        totalPlatformFeesCents: fees,
        stripeConnected: !!app.stripeConnectId,
        currentFeePercent: app.platformFeePercent,
        joinedDate: app.createdAt,
      })
    }
  }

  // Fetch Clerk user data
  const clerkUserIds = [...devMap.keys()]
  const emailMap = new Map<string, { email: string; name: string }>()
  try {
    const client = await clerkClient()
    const users = await client.users.getUserList({ userId: clerkUserIds, limit: 100 })
    for (const u of users.data) {
      emailMap.set(u.id, {
        email: u.emailAddresses[0]?.emailAddress ?? u.id,
        name: [u.firstName, u.lastName].filter(Boolean).join(" ") || "",
      })
    }
  } catch {
    for (const id of clerkUserIds) emailMap.set(id, { email: id, name: "" })
  }

  const header = csvRow([
    "email", "name", "company_name", "apps_count", "total_volume_cents",
    "total_transactions", "total_platform_fees_cents", "stripe_connected",
    "current_fee_percent", "joined_date",
  ])
  const rows = [...devMap.values()].map((d) => {
    const clerk = emailMap.get(d.clerkUserId)
    return csvRow([
      clerk?.email ?? d.clerkUserId, clerk?.name ?? "", d.companyName,
      d.appsCount, d.totalVolumeCents, d.totalTransactions, d.totalPlatformFeesCents,
      d.stripeConnected ? "yes" : "no", d.currentFeePercent,
      d.joinedDate.toISOString().split("T")[0],
    ])
  })

  return [header, ...rows].join("\n")
}

/**
 * Export a developer's transactions as CSV.
 */
export async function exportDeveloperTransactionsCSV(developerUserId: string): Promise<string> {
  const apps = await prisma.app.findMany({
    where: { clerkUserId: developerUserId },
    select: { id: true, name: true },
  })
  const appIds = apps.map((a) => a.id)
  const appMap = new Map(apps.map((a) => [a.id, a.name]))

  const transactions = await prisma.transaction.findMany({
    where: { appId: { in: appIds } },
    include: {
      product: { select: { name: true } },
      customer: { select: { email: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  const header = csvRow([
    "date", "app_name", "product_name", "amount_cents", "currency", "status",
    "applied_fee_percent", "applied_fee_cents", "stripe_payment_id", "customer_email",
  ])
  const rows = transactions.map((tx) =>
    csvRow([
      tx.createdAt.toISOString().split("T")[0],
      appMap.get(tx.appId) ?? tx.appId,
      tx.product.name,
      tx.amountTotal,
      tx.currency,
      tx.status,
      tx.appliedFeePercent,
      tx.appliedFeeCents,
      tx.stripePaymentIntentId,
      tx.customer.email,
    ])
  )

  return [header, ...rows].join("\n")
}
