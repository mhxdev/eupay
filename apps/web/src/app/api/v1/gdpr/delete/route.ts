// DELETE /api/v1/gdpr/delete?userId=xxx
// Anonymises PII. Retains financial records for 10-year tax compliance (GoBD).
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { authenticateRequest, isAuthError, authErrorResponse } from '@/lib/auth'

export async function DELETE(req: NextRequest) {
  const auth = await authenticateRequest(req)
  if (isAuthError(auth)) return authErrorResponse(auth)

  const userId = req.nextUrl.searchParams.get('userId')
  if (!userId) {
    return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 })
  }

  const customer = await prisma.customer.findUnique({
    where: { appId_externalUserId: { appId: auth.appId, externalUserId: userId } },
  })

  if (!customer) {
    return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
  }

  if (customer.deletedAt) {
    return NextResponse.json({ error: 'Customer data already deleted' }, { status: 409 })
  }

  // Delete from Stripe (best effort) — only if a connected account exists
  if (auth.app.stripeConnectId) {
    try {
      await stripe.customers.del(customer.stripeCustomerId, {
        stripeAccount: auth.app.stripeConnectId,
      })
    } catch {
      // Stripe deletion may fail if already deleted — continue
    }
  }

  // Anonymise in our DB — retain financial records for tax compliance
  await prisma.customer.update({
    where: { id: customer.id },
    data: {
      email: null,
      name: null,
      stripeCustomerId: `deleted_${customer.id}`,
      deletedAt: new Date(),
    },
  })

  return NextResponse.json({ success: true, deletedAt: new Date().toISOString() })
}
