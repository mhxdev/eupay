// MIGRATED to payment provider abstraction — see src/lib/payment/
// POST /api/v1/portal
// Creates a billing portal session for end-user subscription management.
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { authenticateRequest, isAuthError, authErrorResponse } from '@/lib/auth'
import { getPaymentProvider, ProviderType } from '@/lib/payment'

const portalSchema = z.object({
  userId: z.string().min(1),
  returnUrl: z.string().min(1),
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

  const parsed = portalSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  // Resolve the payment provider from the app's configuration
  const provider = getPaymentProvider(auth.app.paymentProvider as ProviderType)

  // Determine the merchant's connected account ID for the active provider
  const providerId = auth.app.stripeConnectId ?? auth.app.rootlineAccountId
  if (!providerId) {
    return NextResponse.json({ error: 'No payment account connected.' }, { status: 422 })
  }

  const customer = await prisma.customer.findUnique({
    where: {
      appId_externalUserId: {
        appId: auth.appId,
        externalUserId: parsed.data.userId,
      },
    },
  })

  if (!customer) {
    return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
  }

  const session = await provider.createBillingPortalSession({
    merchantCtx: { providerId },
    customer: customer.stripeCustomerId,
    returnUrl: parsed.data.returnUrl,
  })

  return NextResponse.json({ url: session.url })
}
