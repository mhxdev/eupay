// POST /api/v1/checkout/validate
// Checks if a preloaded checkout session is still valid.
// Called by the iOS SDK before presenting a cached session.
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { authenticateRequest, isAuthError, authErrorResponse } from '@/lib/auth'

const validateSchema = z.object({
  sessionId: z.string(),
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

  const parsed = validateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { sessionId } = parsed.data

  if (!auth.app.stripeConnectId) {
    return NextResponse.json(
      { error: 'No Stripe account connected.' },
      { status: 422 }
    )
  }

  const connectOpts: Stripe.RequestOptions = { stripeAccount: auth.app.stripeConnectId }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {}, connectOpts)

    const now = Math.floor(Date.now() / 1000)
    const isValid = session.status === 'open' && session.expires_at > now

    return NextResponse.json({
      valid: isValid,
      status: session.status,
      expiresAt: new Date(session.expires_at * 1000).toISOString(),
    })
  } catch {
    // Session not found or Stripe error — treat as invalid
    return NextResponse.json({
      valid: false,
      status: 'unknown',
      expiresAt: null,
    })
  }
}
