// GET /api/v1/checkout/success
// Verify checkout session and confirm entitlement was granted.
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { authenticateRequest, isAuthError, authErrorResponse } from '@/lib/auth'

const querySchema = z.object({
  sessionId: z.string().min(1),
})

export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req)
  if (isAuthError(auth)) return authErrorResponse(auth)

  const parsed = querySchema.safeParse({
    sessionId: req.nextUrl.searchParams.get('sessionId'),
  })
  if (!parsed.success) {
    return NextResponse.json({ error: 'Missing sessionId parameter' }, { status: 400 })
  }

  if (!auth.app.stripeConnectId) {
    return NextResponse.json({ error: 'No Stripe account connected.' }, { status: 422 })
  }
  const connectOpts = { stripeAccount: auth.app.stripeConnectId }

  const session = await stripe.checkout.sessions.retrieve(parsed.data.sessionId, connectOpts)

  if (session.metadata?.appId !== auth.appId) {
    return NextResponse.json({ error: 'Session does not belong to this app' }, { status: 403 })
  }

  const transaction = await prisma.transaction.findUnique({
    where: { stripeCheckoutSessionId: session.id },
  })

  // If webhook hasn't fired yet but Stripe confirms payment, return processing status
  if (!transaction || transaction.status === 'PENDING') {
    if (session.payment_status === 'paid') {
      return NextResponse.json({
        sessionId: session.id,
        paymentStatus: session.payment_status,
        transactionStatus: transaction?.status ?? 'processing',
        message: 'Payment confirmed, access will be granted shortly',
      })
    }
  }

  return NextResponse.json({
    sessionId: session.id,
    paymentStatus: session.payment_status,
    transactionStatus: transaction?.status ?? 'UNKNOWN',
  })
}
