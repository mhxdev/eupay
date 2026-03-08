// POST /api/v1/checkout/create
// Creates a Stripe Checkout Session. Called by the iOS SDK when user taps purchase.
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import Stripe from 'stripe'
import * as Sentry from '@sentry/nextjs'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { authenticateRequest, isAuthError, authErrorResponse } from '@/lib/auth'
import { createCheckoutSession, resolvePromotion } from '@/lib/checkout'

const checkoutCreateSchema = z.object({
  productId: z.string().min(1),
  userId: z.string().min(1),
  userEmail: z.string().email().optional(),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
  // iOS SDK should send: Locale.current.language.languageCode?.identifier ?? "en"
  locale: z.string().length(2).default('en'),
  appleExternalPurchaseToken: z.string().optional(),
  // Promotion support
  promotionId: z.string().optional(),
  promoCode: z.string().optional(),
  trialDays: z.number().int().min(1).optional(),
  // Preload support — reuse an existing session if still valid
  preloadedSessionId: z.string().optional(),
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

  const parsed = checkoutCreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const {
    productId,
    userId,
    userEmail,
    successUrl,
    cancelUrl,
    locale,
    appleExternalPurchaseToken,
    promotionId,
    promoCode,
    trialDays: requestTrialDays,
    preloadedSessionId,
  } = parsed.data

  // Require connected Stripe account
  if (!auth.app.stripeConnectId) {
    return NextResponse.json(
      { error: 'No Stripe account connected. Connect your Stripe account in the dashboard.' },
      { status: 422 }
    )
  }

  const connectOpts: Stripe.RequestOptions = { stripeAccount: auth.app.stripeConnectId }

  // ── Try to reuse a preloaded session ──────────────────────────
  if (preloadedSessionId) {
    try {
      const existing = await stripe.checkout.sessions.retrieve(
        preloadedSessionId,
        {},
        connectOpts
      )
      if (existing.status === 'open' && existing.expires_at > Math.floor(Date.now() / 1000)) {
        return NextResponse.json({
          sessionId: existing.id,
          checkoutUrl: existing.url,
          expiresAt: new Date(existing.expires_at * 1000).toISOString(),
        })
      }
    } catch {
      // Session not found or retrieval failed — fall through to create a fresh one
    }
  }

  // Validate product belongs to this app
  const product = await prisma.product.findFirst({
    where: { id: productId, appId: auth.appId, isActive: true },
  })
  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  // Idempotency: check if user already has an active entitlement for this product
  const existingCustomer = await prisma.customer.findUnique({
    where: { appId_externalUserId: { appId: auth.appId, externalUserId: userId } },
  })
  if (existingCustomer) {
    const existingEntitlement = await prisma.entitlement.findFirst({
      where: { customerId: existingCustomer.id, productId, status: 'ACTIVE' },
    })
    if (existingEntitlement) {
      return NextResponse.json(
        { error: 'already_entitled', message: 'User already has an active entitlement for this product' },
        { status: 409 }
      )
    }
  }

  // Get or create Stripe customer
  let customer = await prisma.customer.findUnique({
    where: { appId_externalUserId: { appId: auth.appId, externalUserId: userId } },
  })

  if (!customer) {
    const stripeCustomer = await stripe.customers.create({
      email: userEmail,
      metadata: { appId: auth.appId, externalUserId: userId },
    }, connectOpts)
    customer = await prisma.customer.create({
      data: {
        appId: auth.appId,
        externalUserId: userId,
        stripeCustomerId: stripeCustomer.id,
        email: userEmail,
      },
    })
  }

  // Resolve promotion
  const resolvedPromotion = await resolvePromotion(auth.appId, promotionId, promoCode)

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
      appleExternalPurchaseToken,
      resolvedPromotion,
      requestTrialDays,
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

  return NextResponse.json({
    sessionId: session.id,
    checkoutUrl: session.url,
    expiresAt: new Date(session.expires_at * 1000).toISOString(),
  })
}
