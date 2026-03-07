// POST /api/v1/retention/token
// Generates a short-lived JWT for the public cancellation page.
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { authenticateRequest, isAuthError, authErrorResponse } from "@/lib/auth"
import { createRetentionToken } from "@/lib/retention-jwt"

const schema = z.object({
  userId: z.string(),
  productId: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req)
  if (isAuthError(auth)) return authErrorResponse(auth)

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { userId, productId } = parsed.data

  // Find the customer
  const customer = await prisma.customer.findUnique({
    where: { appId_externalUserId: { appId: auth.appId, externalUserId: userId } },
  })
  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 })
  }

  // Find an active subscription entitlement
  const entitlementWhere: { customerId: string; status: "ACTIVE"; productId?: string } = {
    customerId: customer.id,
    status: "ACTIVE",
  }
  if (productId) entitlementWhere.productId = productId

  const entitlement = await prisma.entitlement.findFirst({
    where: entitlementWhere,
    include: { product: { select: { name: true } } },
  })

  if (!entitlement || !entitlement.stripeSubscriptionId) {
    return NextResponse.json({ error: "No active subscription found" }, { status: 404 })
  }

  const token = await createRetentionToken({
    appId: auth.appId,
    customerId: customer.id,
    entitlementId: entitlement.id,
    stripeSubscriptionId: entitlement.stripeSubscriptionId,
    externalUserId: userId,
  })

  const cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/cancel/${token}`

  return NextResponse.json({
    token,
    cancelUrl,
    expiresIn: 3600,
    productName: entitlement.product.name,
  })
}
