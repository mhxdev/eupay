// POST /api/v1/retention/cancel
// Cancels the subscription at the end of the current period.
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { stripe } from "@/lib/stripe"
import { verifyRetentionToken } from "@/lib/retention-jwt"

const schema = z.object({
  token: z.string(),
  reason: z.string().optional(),
})

export async function POST(req: NextRequest) {
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

  const { token, reason } = parsed.data

  const payload = await verifyRetentionToken(token)
  if (!payload) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 })
  }

  const app = await prisma.app.findUnique({
    where: { id: payload.appId },
    select: { stripeConnectId: true },
  })
  if (!app?.stripeConnectId) {
    return NextResponse.json({ error: "App not configured for payments" }, { status: 400 })
  }

  try {
    await stripe.subscriptions.update(
      payload.stripeSubscriptionId,
      { cancel_at_period_end: true },
      { stripeAccount: app.stripeConnectId }
    )
  } catch (err) {
    console.error("[Retention] Cancel error:", err)
    return NextResponse.json({ error: "Failed to cancel subscription" }, { status: 500 })
  }

  await prisma.entitlement.update({
    where: { id: payload.entitlementId },
    data: { cancelAtPeriodEnd: true },
  })

  // Record the cancel event
  await prisma.cancelEvent.create({
    data: {
      appId: payload.appId,
      customerId: payload.customerId,
      entitlementId: payload.entitlementId,
      reason,
      offerPresented: null,
      offerAccepted: false,
      outcome: "CANCELLED",
      stripeSubscriptionId: payload.stripeSubscriptionId,
    },
  })

  return NextResponse.json({
    success: true,
    message: "Your subscription will end at the current billing period.",
  })
}
