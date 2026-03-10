import { NextRequest } from "next/server"
import { z } from "zod"
import { authenticateV2, isV2AuthError } from "@/lib/auth-v2"
import { v2Success, v2Error } from "@/lib/response-v2"
import { prisma } from "@/lib/prisma"
import { stripe } from "@/lib/stripe"
import { resolvePromotion, createCheckoutSession } from "@/lib/checkout"

const schema = z.object({
  productId: z.string(),
  userId: z.string(),
  locale: z.string().optional().default("en"),
  promotionId: z.string().optional(),
  promoCode: z.string().optional(),
  preload: z.boolean().optional().default(false),
  preloadedSessionId: z.string().optional(),
  idempotencyCheck: z.boolean().optional().default(true),
})

export async function POST(req: NextRequest) {
  const auth = await authenticateV2(req)
  if (isV2AuthError(auth)) {
    return v2Error(auth.error.code, auth.error.message, auth.meta.requestId, auth.status)
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return v2Error("invalid_body", "Invalid JSON body", auth.requestId, 400)
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return v2Error("validation_error", parsed.error.issues.map((e) => e.message).join(", "), auth.requestId, 400)
  }

  const { productId, userId, locale, promotionId, promoCode, preload, preloadedSessionId, idempotencyCheck } = parsed.data

  if (!auth.app.stripeConnectId) {
    return v2Error("no_stripe_account", "No Stripe account connected. Connect Stripe in the dashboard first.", auth.requestId, 400)
  }

  const connectOpts = { stripeAccount: auth.app.stripeConnectId }

  // If preloadedSessionId provided, validate it
  if (preloadedSessionId) {
    try {
      const existingSession = await stripe.checkout.sessions.retrieve(preloadedSessionId, connectOpts)
      if (existingSession.status === "open" && existingSession.url) {
  return v2Success({
          sessionId: existingSession.id,
          sessionUrl: existingSession.url,
          expiresAt: existingSession.expires_at
            ? new Date(existingSession.expires_at * 1000).toISOString()
            : null,
          productId,
          amountCents: existingSession.amount_total,
          currency: existingSession.currency,
        }, auth.requestId)
      }
      // Session expired or completed — fall through to create new one
    } catch {
      // Invalid session ID — fall through to create new one
    }
  }

  // Look up product
  const product = await prisma.product.findFirst({
    where: { id: productId, appId: auth.app.id, isActive: true },
  })
  if (!product) {
    return v2Error("product_not_found", "Product not found or inactive", auth.requestId, 404)
  }
  if (!product.syncedToStripe) {
    return v2Error("product_not_synced", "This product hasn't been synced to Stripe yet. Connect your Stripe account to start accepting payments.", auth.requestId, 422)
  }

  // Idempotency check
  if (idempotencyCheck) {
    // Check for existing non-expired checkout session
    const existingCheckout = await prisma.checkoutSession.findFirst({
      where: {
        appId: auth.app.id,
        productId,
        userId,
        status: "CREATED",
        createdAt: { gt: new Date(Date.now() - 30 * 60 * 1000) }, // within 30 min
      },
      orderBy: { createdAt: "desc" },
    })

    if (existingCheckout?.stripeSessionUrl) {
      // Validate session is still open
      try {
        const stripeSession = await stripe.checkout.sessions.retrieve(
          existingCheckout.stripeSessionId, connectOpts
        )
        if (stripeSession.status === "open" && stripeSession.url) {
  return v2Success({
            sessionId: stripeSession.id,
            sessionUrl: stripeSession.url,
            expiresAt: stripeSession.expires_at
              ? new Date(stripeSession.expires_at * 1000).toISOString()
              : null,
            productId,
            amountCents: product.amountCents,
            currency: product.currency,
          }, auth.requestId)
        }
      } catch {
        // Session no longer valid, continue to create new one
      }
    }

    // Check if user already has an active entitlement for this product
    const customer = await prisma.customer.findUnique({
      where: { appId_externalUserId: { appId: auth.app.id, externalUserId: userId } },
    })
    if (customer) {
      const activeEntitlement = await prisma.entitlement.findFirst({
        where: { customerId: customer.id, productId, status: "ACTIVE" },
      })
      if (activeEntitlement) {
        return v2Error("already_entitled", "User already has an active entitlement for this product", auth.requestId, 409)
      }
    }
  }

  // Resolve promotion
  const resolvedPromotion = await resolvePromotion(auth.app.id, promotionId, promoCode)

  // Find or create customer
  const customer = await prisma.customer.upsert({
    where: { appId_externalUserId: { appId: auth.app.id, externalUserId: userId } },
    create: {
      appId: auth.app.id,
      externalUserId: userId,
      stripeCustomerId: `pending_${auth.app.id}_${userId}`,
    },
    update: {},
  })

  // Find or create Stripe customer on connected account
  let stripeCustomerId = customer.stripeCustomerId
  if (stripeCustomerId.startsWith("pending_")) {
    const stripeCustomer = await stripe.customers.create({
      metadata: { appId: auth.app.id, externalUserId: userId },
    }, connectOpts)
    stripeCustomerId = stripeCustomer.id
    await prisma.customer.update({
      where: { id: customer.id },
      data: { stripeCustomerId },
    })
  }

  // Build URLs
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://europay.dev"
  const scheme = auth.app.returnUrlScheme || ""
  const successUrl = `${baseUrl}/checkout/return?session={CHECKOUT_SESSION_ID}&scheme=${encodeURIComponent(scheme)}`
  const cancelUrl = `${baseUrl}/checkout/return?session={CHECKOUT_SESSION_ID}&scheme=${encodeURIComponent(scheme)}&cancelled=true`

  // Create checkout session using shared logic
  const session = await createCheckoutSession({
    appId: auth.app.id,
    stripeCustomerId,
    product: {
      id: product.id,
      stripePriceId: product.stripePriceId,
      productType: product.productType,
      amountCents: product.amountCents,
      currency: product.currency,
      trialDays: product.trialDays,
    },
    userId,
    locale,
    successUrl,
    cancelUrl,
    stripeConnectId: auth.app.stripeConnectId,
    platformFeePercent: auth.app.platformFeePercent,
    resolvedPromotion,
    isPreload: preload,
  })
  // Log pending transaction
  await prisma.transaction.create({
    data: {
      appId: auth.app.id,
      customerId: customer.id,
      productId: product.id,
      stripeCheckoutSessionId: session.id,
      amountTotal: 0,
      amountSubtotal: 0,
      amountTax: 0,
      currency: product.currency,
      status: "PENDING",
    },
  })
    return v2Success({
    sessionId: session.id,
    sessionUrl: session.url,
    expiresAt: session.expires_at
      ? new Date(session.expires_at * 1000).toISOString()
      : null,
    productId,
    amountCents: product.amountCents,
    currency: product.currency,
  }, auth.requestId, 201)
}
