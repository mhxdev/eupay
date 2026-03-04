// POST /api/v1/checkout/create
// Creates a Stripe Checkout Session. Called by the iOS SDK when user taps purchase.
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { authenticateRequest, isAuthError, authErrorResponse } from '@/lib/auth'

const checkoutCreateSchema = z.object({
  productId: z.string().min(1),
  userId: z.string().min(1),
  userEmail: z.string().email().optional(),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
  locale: z.string().length(2).default('de'),
  appleExternalPurchaseToken: z.string().optional(),
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

  const { productId, userId, userEmail, successUrl, cancelUrl, locale, appleExternalPurchaseToken } = parsed.data

  // Validate product belongs to this app
  const product = await prisma.product.findFirst({
    where: { id: productId, appId: auth.appId, isActive: true },
  })
  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  // Require Stripe Connect for BYOS
  if (!auth.app.stripeConnectId) {
    return NextResponse.json(
      { error: 'No Stripe account connected. Connect your Stripe account in the dashboard.' },
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

  // Build Checkout Session parameters
  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    customer: customer.stripeCustomerId,
    mode: product.productType === 'SUBSCRIPTION' ? 'subscription' : 'payment',
    line_items: [
      {
        price: product.stripePriceId,
        quantity: 1,
      },
    ],
    // Enable Stripe Tax for EU VAT (requires tax registration in Stripe Dashboard)
    // Set STRIPE_TAX_ENABLED=true in .env once Stripe Tax registrations are configured
    automatic_tax: { enabled: process.env.STRIPE_TAX_ENABLED === 'true' },
    // Collect billing address for VAT calculation
    billing_address_collection: 'required',
    // Payment methods auto-detected from Stripe Dashboard config per device/browser/location
    // (omitting payment_method_types enables all configured methods including Apple Pay, Google Pay, SEPA, Link, etc.)
    success_url: successUrl,
    cancel_url: cancelUrl,
    locale: locale as Stripe.Checkout.SessionCreateParams['locale'],
    // Metadata for webhook processing
    metadata: {
      appId: auth.appId,
      productId: product.id,
      externalUserId: userId,
      ...(appleExternalPurchaseToken ? { appleExternalPurchaseToken } : {}),
    },
    // EuroPay 1.5% platform fee (one-time payments)
    ...(product.productType !== 'SUBSCRIPTION' ? {
      payment_intent_data: {
        application_fee_amount: Math.round(product.amountCents * 0.015),
      },
    } : {}),
    // Phone collection off (GDPR minimisation)
    phone_number_collection: { enabled: false },
    // Custom fields for Widerrufsrecht waiver
    custom_fields: [
      {
        key: 'withdrawal_waiver',
        label: {
          type: 'custom',
          custom: 'Widerrufsrecht-Verzicht bestätigen',
        },
        type: 'dropdown',
        dropdown: {
          options: [{ label: 'Ja, Lieferung sofort — Widerruf entfällt', value: 'agreed' }],
        },
        optional: false,
      },
    ],
  }

  // Subscription: always apply 1.5% platform fee, add trial if applicable
  if (product.productType === 'SUBSCRIPTION') {
    sessionParams.subscription_data = {
      application_fee_percent: 1.5,
      metadata: { appId: auth.appId, productId: product.id },
      ...(product.trialDays && product.trialDays > 0
        ? { trial_period_days: product.trialDays }
        : {}),
    }
  }

  let session: Awaited<ReturnType<typeof stripe.checkout.sessions.create>>
  try {
    session = await stripe.checkout.sessions.create(sessionParams, connectOpts)
  } catch (err) {
    if (err instanceof Stripe.errors.StripeError) {
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
