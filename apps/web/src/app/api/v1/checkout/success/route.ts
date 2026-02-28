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

  const session = await stripe.checkout.sessions.retrieve(parsed.data.sessionId)

  if (session.metadata?.appId !== auth.appId) {
    return NextResponse.json({ error: 'Session does not belong to this app' }, { status: 403 })
  }

  const transaction = await prisma.transaction.findUnique({
    where: { stripeCheckoutSessionId: session.id },
  })

  return NextResponse.json({
    sessionId: session.id,
    paymentStatus: session.payment_status,
    transactionStatus: transaction?.status ?? 'UNKNOWN',
  })
}
