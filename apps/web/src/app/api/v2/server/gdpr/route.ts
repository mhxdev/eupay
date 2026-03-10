import { NextRequest } from "next/server"
import { z } from "zod"
import { authenticateV2, isV2AuthError } from "@/lib/auth-v2"
import { v2Success, v2Error } from "@/lib/response-v2"
import { prisma } from "@/lib/prisma"
import { stripe } from "@/lib/stripe"

const schema = z.object({
  action: z.enum(["export", "delete"]),
  userId: z.string(),
})

export async function POST(req: NextRequest) {
  const auth = await authenticateV2(req)
  if (isV2AuthError(auth)) {
    return v2Error(auth.error.code, auth.error.message, auth.meta.requestId, auth.status)
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return v2Error("invalid_body", "Invalid JSON body", auth.requestId, 400)
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return v2Error("validation_error", parsed.error.issues.map((e) => e.message).join(", "), auth.requestId, 400)
  }

  const { action, userId } = parsed.data

  const customer = await prisma.customer.findUnique({
    where: { appId_externalUserId: { appId: auth.app.id, externalUserId: userId } },
    include: {
      entitlements: { include: { product: true } },
      transactions: true,
    },
  })

  if (!customer) {
    return v2Error("customer_not_found", "Customer not found", auth.requestId, 404)
  }

  if (action === "export") {
    // Log GDPR export action
    await prisma.gdprAuditLog.create({
      data: {
        appId: auth.app.id,
        action: "EXPORT",
        userId,
        requestedBy: auth.app.clerkUserId,
        ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
      },
    })

    return v2Success({
      customer: {
        externalUserId: customer.externalUserId,
        email: customer.email,
        name: customer.name,
        countryCode: customer.countryCode,
        gdprConsentAt: customer.gdprConsentAt?.toISOString() ?? null,
        createdAt: customer.createdAt.toISOString(),
      },
      entitlements: customer.entitlements.map((e) => ({
        productName: e.product.name,
        status: e.status.toLowerCase(),
        source: e.source.toLowerCase(),
        currentPeriodEnd: e.currentPeriodEnd?.toISOString() ?? null,
        cancelAtPeriodEnd: e.cancelAtPeriodEnd,
        createdAt: e.createdAt.toISOString(),
      })),
      transactions: customer.transactions.map((t) => ({
        amountTotal: t.amountTotal,
        amountSubtotal: t.amountSubtotal,
        amountTax: t.amountTax,
        vatRate: t.vatRate,
        vatCountry: t.vatCountry,
        currency: t.currency,
        status: t.status.toLowerCase(),
        createdAt: t.createdAt.toISOString(),
      })),
    }, auth.requestId)
  }

  // DELETE action
  if (customer.deletedAt) {
    return v2Error("already_deleted", "Customer data already deleted", auth.requestId, 409)
  }

  // Delete from Stripe (best effort)
  if (auth.app.stripeConnectId && !customer.stripeCustomerId.startsWith("pending_") && !customer.stripeCustomerId.startsWith("deleted_")) {
    try {
      await stripe.customers.del(customer.stripeCustomerId, {
        stripeAccount: auth.app.stripeConnectId,
      })
    } catch {
      // Stripe deletion may fail if already deleted — continue
    }
  }

  // Anonymise in DB — retain financial records for tax compliance
  await prisma.customer.update({
    where: { id: customer.id },
    data: {
      email: null,
      name: null,
      stripeCustomerId: `deleted_${customer.id}`,
      deletedAt: new Date(),
    },
  })

  // Log GDPR delete action
  await prisma.gdprAuditLog.create({
    data: {
      appId: auth.app.id,
      action: "DELETE",
      userId,
      requestedBy: auth.app.clerkUserId,
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    },
  })

  return v2Success({ deleted: true, deletedAt: new Date().toISOString() }, auth.requestId)
}
