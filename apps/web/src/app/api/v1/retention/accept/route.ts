// POST /api/v1/retention/accept
// Accepts a retention offer (discount, pause, or downgrade).
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { stripe } from "@/lib/stripe"
import { verifyRetentionToken } from "@/lib/retention-jwt"

const schema = z.object({
  token: z.string(),
  reason: z.string().optional(),
  offerType: z.enum(["discount", "pause", "downgrade"]),
  discountPercent: z.number().optional(),
  pauseDays: z.number().optional(),
  downgradeProductId: z.string().optional(),
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

  const { token, reason, offerType, discountPercent, pauseDays, downgradeProductId } = parsed.data

  const payload = await verifyRetentionToken(token)
  if (!payload) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 })
  }

  // Get app's Stripe Connect ID
  const app = await prisma.app.findUnique({
    where: { id: payload.appId },
    select: { stripeConnectId: true },
  })
  if (!app?.stripeConnectId) {
    return NextResponse.json({ error: "App not configured for payments" }, { status: 400 })
  }

  const connectOpts = { stripeAccount: app.stripeConnectId }
  const offerLabel = `${offerType}_${discountPercent ?? pauseDays ?? "downgrade"}`
  let message = ""

  try {
    switch (offerType) {
      case "discount": {
        const pct = discountPercent ?? 20
        const couponId = `retention_${pct}pct_3mo_${payload.appId}`
        try {
          await stripe.coupons.retrieve(couponId, connectOpts)
        } catch {
          await stripe.coupons.create(
            {
              id: couponId,
              percent_off: pct,
              duration: "repeating",
              duration_in_months: 3,
              name: `${pct}% off for 3 months (retention)`,
              metadata: { appId: payload.appId, type: "retention" },
            },
            connectOpts
          )
        }

        await stripe.subscriptions.update(
          payload.stripeSubscriptionId,
          {
            discounts: [{ coupon: couponId }],
            cancel_at_period_end: false,
          },
          connectOpts
        )

        await prisma.entitlement.update({
          where: { id: payload.entitlementId },
          data: { cancelAtPeriodEnd: false },
        })

        message = `${pct}% discount applied for 3 months.`
        break
      }

      case "pause": {
        const days = pauseDays ?? 30
        const resumesAt = Math.floor(Date.now() / 1000) + days * 86400

        await stripe.subscriptions.update(
          payload.stripeSubscriptionId,
          {
            pause_collection: { behavior: "void", resumes_at: resumesAt },
            cancel_at_period_end: false,
          },
          connectOpts
        )

        await prisma.entitlement.update({
          where: { id: payload.entitlementId },
          data: { status: "PAUSED", cancelAtPeriodEnd: false },
        })

        message = `Subscription paused for ${days} days.`
        break
      }

      case "downgrade": {
        if (!downgradeProductId) {
          return NextResponse.json({ error: "Downgrade product required" }, { status: 400 })
        }

        const newProduct = await prisma.product.findUnique({
          where: { id: downgradeProductId },
          select: { stripePriceId: true, name: true, id: true },
        })
        if (!newProduct) {
          return NextResponse.json({ error: "Downgrade product not found" }, { status: 404 })
        }

        // Get current subscription to find the item
        const sub = await stripe.subscriptions.retrieve(
          payload.stripeSubscriptionId,
          connectOpts
        )
        const subItem = sub.items.data[0]
        if (!subItem) {
          return NextResponse.json({ error: "No subscription item found" }, { status: 400 })
        }

        await stripe.subscriptionItems.update(
          subItem.id,
          { price: newProduct.stripePriceId },
          connectOpts
        )

        await stripe.subscriptions.update(
          payload.stripeSubscriptionId,
          { cancel_at_period_end: false },
          connectOpts
        )

        await prisma.entitlement.update({
          where: { id: payload.entitlementId },
          data: { productId: newProduct.id, cancelAtPeriodEnd: false },
        })

        message = `Downgraded to ${newProduct.name}.`
        break
      }
    }
  } catch (err) {
    console.error("[Retention] Stripe error:", err)
    return NextResponse.json({ error: "Failed to apply offer" }, { status: 500 })
  }

  // Record the cancel event
  const outcome =
    offerType === "discount"
      ? "SAVED_DISCOUNT"
      : offerType === "pause"
      ? "SAVED_PAUSE"
      : "SAVED_DOWNGRADE"

  await prisma.cancelEvent.create({
    data: {
      appId: payload.appId,
      customerId: payload.customerId,
      entitlementId: payload.entitlementId,
      reason,
      offerPresented: offerLabel,
      offerAccepted: true,
      outcome: outcome as "SAVED_DISCOUNT" | "SAVED_PAUSE" | "SAVED_DOWNGRADE",
      stripeSubscriptionId: payload.stripeSubscriptionId,
    },
  })

  return NextResponse.json({ success: true, message })
}
