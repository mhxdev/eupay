// POST /api/v1/subscriptions/cancel
// Cancel a subscription at period end, or accept a save offer (20% off for 3 months).
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { authenticateRequest, isAuthError, authErrorResponse } from '@/lib/auth'

const cancelSchema = z.object({
  userId: z.string().min(1),
  entitlementId: z.string().min(1),
  acceptSaveOffer: z.boolean().optional().default(false),
})

export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req)
  if (isAuthError(auth)) return authErrorResponse(auth)

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = cancelSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  if (!auth.app.stripeConnectId) {
    return NextResponse.json({ error: 'No Stripe account connected.' }, { status: 422 })
  }
  const connectOpts = { stripeAccount: auth.app.stripeConnectId }

  const entitlement = await prisma.entitlement.findUnique({
    where: { id: parsed.data.entitlementId },
    include: { customer: true },
  })

  if (!entitlement || !entitlement.stripeSubscriptionId) {
    return NextResponse.json({ error: 'Subscription entitlement not found' }, { status: 404 })
  }

  // Verify the customer belongs to this app
  if (entitlement.customer.appId !== auth.appId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // ── Save offer flow ──────────────────────────────────────────
  if (parsed.data.acceptSaveOffer) {
    const couponId = `eupay_save_20pct_3mo_${auth.appId}`
    try {
      await stripe.coupons.retrieve(couponId, connectOpts)
    } catch {
      await stripe.coupons.create({
        id: couponId,
        percent_off: 20,
        duration: 'repeating',
        duration_in_months: 3,
        name: '20% off for 3 months (save offer)',
        metadata: { appId: auth.appId, type: 'save_offer' },
      }, connectOpts)
    }

    await stripe.subscriptions.update(entitlement.stripeSubscriptionId, {
      discounts: [{ coupon: couponId }],
      cancel_at_period_end: false,
    }, connectOpts)

    await prisma.entitlement.update({
      where: { id: entitlement.id },
      data: { cancelAtPeriodEnd: false },
    })

    return NextResponse.json({
      success: true,
      saveOfferApplied: true,
      discount: { percentOff: 20, durationMonths: 3 },
    })
  }

  // ── Standard cancellation ────────────────────────────────────
  // Cancel at period end (preferred — gives user remaining time)
  await stripe.subscriptions.update(entitlement.stripeSubscriptionId, {
    cancel_at_period_end: true,
  }, connectOpts)

  await prisma.entitlement.update({
    where: { id: entitlement.id },
    data: { cancelAtPeriodEnd: true },
  })

  return NextResponse.json({ success: true, cancelAtPeriodEnd: true })
}
