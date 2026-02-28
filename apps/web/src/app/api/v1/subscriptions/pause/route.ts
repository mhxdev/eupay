// POST /api/v1/subscriptions/pause
// Pause a subscription by setting pause_collection on Stripe.
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { authenticateRequest, isAuthError, authErrorResponse } from '@/lib/auth'

const pauseSchema = z.object({
  userId: z.string().min(1),
  entitlementId: z.string().min(1),
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

  const parsed = pauseSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const entitlement = await prisma.entitlement.findUnique({
    where: { id: parsed.data.entitlementId },
    include: { customer: true },
  })

  if (!entitlement || !entitlement.stripeSubscriptionId) {
    return NextResponse.json({ error: 'Subscription entitlement not found' }, { status: 404 })
  }

  if (entitlement.customer.appId !== auth.appId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (entitlement.status === 'PAUSED') {
    return NextResponse.json({ error: 'Subscription is already paused' }, { status: 409 })
  }

  if (entitlement.status !== 'ACTIVE') {
    return NextResponse.json({ error: 'Only active subscriptions can be paused' }, { status: 400 })
  }

  // Pause collection in Stripe — invoices won't be generated while paused
  await stripe.subscriptions.update(entitlement.stripeSubscriptionId, {
    pause_collection: { behavior: 'mark_uncollectible' },
  })

  await prisma.entitlement.update({
    where: { id: entitlement.id },
    data: { status: 'PAUSED' },
  })

  return NextResponse.json({ success: true, status: 'PAUSED' })
}
