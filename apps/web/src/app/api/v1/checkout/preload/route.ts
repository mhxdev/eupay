// POST /api/v1/checkout/preload
// Pre-creates a Stripe Checkout Session for faster presentation.
// Called by the iOS SDK before the user taps "Buy".
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import Stripe from 'stripe'
import * as Sentry from '@sentry/nextjs'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { authenticateRequest, isAuthError, authErrorResponse } from '@/lib/auth'
import { createCheckoutSession, resolvePromotion } from '@/lib/checkout'

const preloadSchema = z.object({
  productId: z.string(),
  userId: z.string(),
  locale: z.string().optional().default('en'),
  promotionId: z.string().optional(),
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

  const parsed = preloadSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { productId, userId, locale, promotionId } = parsed.data

  // Validate product belongs to this app
  const product = await prisma.product.findFirst({
    where: { id: productId, appId: auth.appId, isActive: true },
  })
  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }
  if (!product.syncedToStripe) {
    return NextResponse.json({ error: { code: 'product_not_synced', message: "This product hasn't been synced to Stripe yet. Connect your Stripe account to start accepting payments." } }, { status: 422 })
  }

  if (!auth.app.stripeConnectId) {
    return NextResponse.json(
      { error: 'No Stripe account connected.' },
      { status: 422 }
    )
  }

  const connectOpts: Stripe.RequestOptions = { stripeAccount: auth.app.stripeConnectId }

  // Get or create Stripe customer
  let customer = await prisma.customer.findUnique({
    where: { appId_externalUserId: { appId: auth.appId, externalUserId: userId } },
  })

  if (!customer) {
    const stripeCustomer = await stripe.customers.create({
      metadata: { appId: auth.appId, externalUserId: userId },
    }, connectOpts)
    customer = await prisma.customer.create({
      data: {
        appId: auth.appId,
        externalUserId: userId,
        stripeCustomerId: stripeCustomer.id,
      },
    })
  }

  // Resolve promotion
  const resolvedPromotion = await resolvePromotion(auth.appId, promotionId)

  // The SDK provides success/cancel URLs at purchase time, but Stripe requires
  // them at session creation. Use placeholder URLs — the SDK will open the
  // session URL directly in SFSafariViewController.
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://europay.dev'
  const successUrl = `${baseUrl}/api/v1/checkout/success?session_id={CHECKOUT_SESSION_ID}`
  const cancelUrl = `${baseUrl}/checkout/cancelled`

  let session: Stripe.Checkout.Session
  try {
    session = await createCheckoutSession({
      appId: auth.appId,
      stripeCustomerId: customer.stripeCustomerId,
      product,
      userId,
      locale,
      successUrl,
      cancelUrl,
      stripeConnectId: auth.app.stripeConnectId,
      platformFeePercent: auth.app.platformFeePercent ?? 1.5,
      resolvedPromotion,
      isPreload: true,
    })
  } catch (err) {
    if (err instanceof Stripe.errors.StripeError) {
      Sentry.captureException(err)
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: err.statusCode ?? 500 }
      )
    }
    throw err
  }

  // Log pending transaction
  await prisma.transaction.create({
    data: {
      appId: auth.appId,
      customerId: customer.id,
      productId: product.id,
      stripeCheckoutSessionId: session.id,
      amountTotal: 0,
      amountSubtotal: 0,
      amountTax: 0,
      currency: product.currency,
      status: 'PENDING',
    },
  })

  // Compute promotional amount if a discount applies
  let promotionalAmountCents: number | undefined
  if (resolvedPromotion) {
    if (resolvedPromotion.type === 'PERCENT_OFF') {
      const promo = await prisma.promotion.findUnique({ where: { id: resolvedPromotion.id } })
      if (promo?.percentOff) {
        promotionalAmountCents = Math.round(product.amountCents * (1 - promo.percentOff / 100))
      }
    } else if (resolvedPromotion.type === 'AMOUNT_OFF') {
      const promo = await prisma.promotion.findUnique({ where: { id: resolvedPromotion.id } })
      if (promo?.amountOffCents) {
        promotionalAmountCents = Math.max(0, product.amountCents - promo.amountOffCents)
      }
    }
  }

  return NextResponse.json({
    sessionId: session.id,
    sessionUrl: session.url,
    expiresAt: new Date(session.expires_at * 1000).toISOString(),
    productId: product.id,
    amountCents: product.amountCents,
    currency: product.currency,
    ...(promotionalAmountCents !== undefined ? { promotionalAmountCents } : {}),
  })
}
