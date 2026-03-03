import { auth } from "@clerk/nextjs/server"
import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  const { userId } = await auth()
  if (!userId) {
    return new Response("Unauthorized", { status: 401 })
  }

  const { appId } = await params

  const app = await prisma.app.findUnique({
    where: { id: appId },
    select: { clerkUserId: true },
  })
  if (!app || app.clerkUserId !== userId) {
    return new Response("Not found", { status: 404 })
  }

  const transactions = await prisma.transaction.findMany({
    where: {
      appId,
      withdrawalWaivedAt: { not: null },
    },
    orderBy: { createdAt: "desc" },
    include: {
      product: { select: { name: true } },
      customer: { select: { externalUserId: true } },
    },
  })

  const header =
    "transaction_id,customer_external_id,amount_total,currency,waived_at,product_name"

  const rows = transactions.map((tx) => {
    const cells = [
      tx.id,
      tx.customer.externalUserId,
      tx.amountTotal,
      tx.currency,
      tx.withdrawalWaivedAt!.toISOString(),
      csvEscape(tx.product.name),
    ]
    return cells.join(",")
  })

  const csv = [header, ...rows].join("\n")
  const today = new Date().toISOString().slice(0, 10)

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="widerrufsrecht-${appId}-${today}.csv"`,
    },
  })
}

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}
