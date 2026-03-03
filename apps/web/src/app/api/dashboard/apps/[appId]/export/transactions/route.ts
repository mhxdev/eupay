import { auth } from "@clerk/nextjs/server"
import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: NextRequest,
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

  // Parse optional date range
  const fromParam = req.nextUrl.searchParams.get("from")
  const toParam = req.nextUrl.searchParams.get("to")

  const where: {
    appId: string
    status: "SUCCEEDED"
    createdAt?: { gte?: Date; lte?: Date }
  } = { appId, status: "SUCCEEDED" }

  if (fromParam || toParam) {
    where.createdAt = {}
    if (fromParam) where.createdAt.gte = new Date(fromParam)
    if (toParam) {
      const to = new Date(toParam)
      to.setHours(23, 59, 59, 999)
      where.createdAt.lte = to
    }
  }

  const transactions = await prisma.transaction.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      product: { select: { name: true } },
      customer: { select: { externalUserId: true } },
    },
  })

  const header =
    "transaction_id,date,product_name,amount_total,amount_subtotal,amount_tax,vat_rate,vat_country,currency,status,stripe_payment_intent_id,customer_external_id"

  const rows = transactions.map((tx) => {
    const cells = [
      tx.id,
      tx.createdAt.toISOString(),
      csvEscape(tx.product.name),
      tx.amountTotal,
      tx.amountSubtotal,
      tx.amountTax,
      tx.vatRate ?? "",
      tx.vatCountry ?? "",
      tx.currency,
      tx.status,
      tx.stripePaymentIntentId ?? "",
      tx.customer.externalUserId,
    ]
    return cells.join(",")
  })

  const csv = [header, ...rows].join("\n")
  const today = new Date().toISOString().slice(0, 10)

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="transactions-${appId}-${today}.csv"`,
    },
  })
}

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}
