// POST /api/v1/subscriptions/resume
// Resume a paused subscription by removing pause_collection from Stripe.
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { authenticateRequest, isAuthError, authErrorResponse } from '@/lib/auth'

const resumeSchema = z.object({
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

  const parsed = resumeSchema.safeParse(body)
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

  if (entitlement.status !== 'PAUSED') {
    return NextResponse.json({ error: 'Subscription is not paused' }, { status: 400 })
  }

  // Remove pause_collection to resume billing
  await stripe.subscriptions.update(entitlement.stripeSubscriptionId, {
    pause_collection: '',
  })

  // Retrieve subscription to get current period dates
  const subscription = await stripe.subscriptions.retrieve(
    entitlement.stripeSubscriptionId
  )
  const firstItem = subscription.items.data[0]

  await prisma.entitlement.update({
    where: { id: entitlement.id },
    data: {
      status: 'ACTIVE',
      currentPeriodStart: firstItem
        ? new Date(firstItem.current_period_start * 1000)
        : undefined,
      currentPeriodEnd: firstItem
        ? new Date(firstItem.current_period_end * 1000)
        : undefined,
    },
  })

  return NextResponse.json({ success: true, status: 'ACTIVE' })
}
