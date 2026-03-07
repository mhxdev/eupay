// POST /api/v1/checkout/create
// Creates a Stripe Checkout Session. Called by the iOS SDK when user taps purchase.
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import Stripe from 'stripe'
import * as Sentry from '@sentry/nextjs'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { authenticateRequest, isAuthError, authErrorResponse } from '@/lib/auth'

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
})

// Localized withdrawal-right (Widerrufsrecht) waiver text for EU Checkout.
// Under EU Consumer Rights Directive 2011/83/EU Art. 16(m), the consumer must
// expressly agree and confirm knowledge that beginning performance waives their
// 14-day withdrawal right. The text MUST be in the consumer's language.
//
// ⚠️  LEGAL REVIEW REQUIRED: These translations must be reviewed by a qualified
// legal translator before production use. Machine translations of legal waiver
// text carry risk — the structure and meaning must be legally equivalent across
// all languages. In particular, both required elements must be present:
//   (1) express consent to begin performance immediately
//   (2) acknowledgment that this waives the 14-day withdrawal right
const withdrawalWaiverTranslations: Record<string, { label: string; option: string }> = {
  de: {
    label: 'Widerrufsrecht-Verzicht bestätigen',
    option: 'Ja, Lieferung sofort — Widerruf entfällt',
  },
  en: {
    label: 'Confirm withdrawal right waiver',
    option: 'Yes, deliver immediately — I waive my 14-day withdrawal right',
  },
  fr: {
    label: 'Confirmer la renonciation au droit de rétractation',
    option: 'Oui, livraison immédiate — je renonce à mon droit de rétractation de 14 jours',
  },
  nl: {
    label: 'Bevestig afstand van herroepingsrecht',
    option: 'Ja, direct leveren — ik doe afstand van mijn herroepingsrecht van 14 dagen',
  },
  it: {
    label: 'Conferma rinuncia al diritto di recesso',
    option: 'Sì, consegna immediata — rinuncio al mio diritto di recesso di 14 giorni',
  },
  es: {
    label: 'Confirmar renuncia al derecho de desistimiento',
    option: 'Sí, entrega inmediata — renuncio a mi derecho de desistimiento de 14 días',
  },
  pt: {
    label: 'Confirmar renúncia ao direito de retratação',
    option: 'Sim, entrega imediata — renuncio ao meu direito de retratação de 14 dias',
  },
  pl: {
    label: 'Potwierdź zrzeczenie się prawa do odstąpienia',
    option: 'Tak, natychmiastowa dostawa — zrzekam się 14-dniowego prawa do odstąpienia',
  },
  sv: {
    label: 'Bekräfta avstående av ångerrätt',
    option: 'Ja, leverera omedelbart — jag avstår min 14 dagars ångerrätt',
  },
  da: {
    label: 'Bekræft frafald af fortrydelsesret',
    option: 'Ja, lever straks — jeg frafalder min 14-dages fortrydelsesret',
  },
  fi: {
    label: 'Vahvista peruuttamisoikeudesta luopuminen',
    option: 'Kyllä, toimita heti — luovun 14 päivän peruuttamisoikeudestani',
  },
  el: {
    label: 'Επιβεβαίωση παραίτησης από το δικαίωμα υπαναχώρησης',
    option: 'Ναι, άμεση παράδοση — παραιτούμαι από το 14ήμερο δικαίωμα υπαναχώρησής μου',
  },
  cs: {
    label: 'Potvrdit vzdání se práva na odstoupení',
    option: 'Ano, dodat ihned — vzdávám se svého 14denního práva na odstoupení',
  },
  ro: {
    label: 'Confirmați renunțarea la dreptul de retragere',
    option: 'Da, livrare imediată — renunț la dreptul meu de retragere de 14 zile',
  },
  hu: {
    label: 'Elállási jog lemondásának megerősítése',
    option: 'Igen, azonnali szállítás — lemondok a 14 napos elállási jogomról',
  },
  bg: {
    label: 'Потвърждение за отказ от правото на отказ',
    option: 'Да, незабавна доставка — отказвам се от 14-дневното си право на отказ',
  },
  hr: {
    label: 'Potvrdi odricanje od prava na odustajanje',
    option: 'Da, isporuči odmah — odričem se svog 14-dnevnog prava na odustajanje',
  },
  sk: {
    label: 'Potvrdiť vzdanie sa práva na odstúpenie',
    option: 'Áno, dodať ihneď — vzdávam sa svojho 14-dňového práva na odstúpenie',
  },
  sl: {
    label: 'Potrditev odpovedi pravici do odstopa',
    option: 'Da, dostavi takoj — odpovedujem se 14-dnevni pravici do odstopa',
  },
  et: {
    label: 'Kinnita taganemisõigusest loobumine',
    option: 'Jah, tarni kohe — loobun oma 14-päevasest taganemisõigusest',
  },
  lv: {
    label: 'Apstiprināt atteikšanos no atteikuma tiesībām',
    option: 'Jā, piegādāt nekavējoties — es atsakos no savām 14 dienu atteikuma tiesībām',
  },
  lt: {
    label: 'Patvirtinti atsisakymą nuo teisės atsisakyti sutarties',
    option: 'Taip, pristatyti nedelsiant — atsisakau savo 14 dienų teisės atsisakyti sutarties',
  },
  mt: {
    label: "Ikkonferma r-rinunzja għad-dritt ta' rtirar",
    option: "Iva, wassal immedjatament — nirrinunzja d-dritt ta' rtirar ta' 14-il ġurnata tiegħi",
  },
}

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

  const { productId, userId, userEmail, successUrl, cancelUrl, locale, appleExternalPurchaseToken, promotionId, promoCode, trialDays: requestTrialDays } = parsed.data

  // Validate product belongs to this app
  const product = await prisma.product.findFirst({
    where: { id: productId, appId: auth.appId, isActive: true },
  })
  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  // Require connected Stripe account
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

  // ── Resolve promotion ─────────────────────────────────────────
  let resolvedPromotion: {
    id: string
    stripeCouponId: string | null
    stripePromoCodeId: string | null
    type: string
    trialDays: number | null
    code: string | null
  } | null = null

  if (promotionId) {
    const promo = await prisma.promotion.findFirst({
      where: {
        id: promotionId,
        appId: auth.appId,
        status: 'ACTIVE',
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    })
    if (promo) {
      // Check max redemptions
      if (promo.maxRedemptions) {
        const count = await prisma.promotionRedemption.count({
          where: { promotionId: promo.id },
        })
        if (count < promo.maxRedemptions) resolvedPromotion = promo
      } else {
        resolvedPromotion = promo
      }
    }
  } else if (promoCode) {
    const promo = await prisma.promotion.findFirst({
      where: {
        appId: auth.appId,
        code: promoCode.toUpperCase(),
        status: 'ACTIVE',
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    })
    if (promo) {
      if (promo.maxRedemptions) {
        const count = await prisma.promotionRedemption.count({
          where: { promotionId: promo.id },
        })
        if (count < promo.maxRedemptions) resolvedPromotion = promo
      } else {
        resolvedPromotion = promo
      }
    }
  }

  // Look up localized withdrawal waiver text (falls back to English)
  const waiver = withdrawalWaiverTranslations[locale] ?? withdrawalWaiverTranslations.en

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
      ...(resolvedPromotion ? { promotionId: resolvedPromotion.id } : {}),
    },
    // Per-app platform fee (one-time payments)
    ...(product.productType !== 'SUBSCRIPTION' ? {
      payment_intent_data: {
        application_fee_amount: Math.round(product.amountCents * ((auth.app.platformFeePercent ?? 1.5) / 100)),
      },
    } : {}),
    // Phone collection off (GDPR minimisation)
    phone_number_collection: { enabled: false },
    // Custom fields for Widerrufsrecht (withdrawal right) waiver — localized per EU locale
    custom_fields: [
      {
        key: 'withdrawal_waiver',
        label: {
          type: 'custom',
          custom: waiver.label,
        },
        type: 'dropdown',
        dropdown: {
          options: [{ label: waiver.option, value: 'agreed' }],
        },
        optional: false,
      },
    ],
    // Promotion discount — Stripe does not allow `discounts` + `allow_promotion_codes` together
    ...(resolvedPromotion?.stripeCouponId && !resolvedPromotion.code
      ? { discounts: [{ coupon: resolvedPromotion.stripeCouponId }] }
      : {}),
    ...(resolvedPromotion?.code
      ? { allow_promotion_codes: true }
      : {}),
  }

  // Subscription: apply per-app platform fee, add trial if applicable
  if (product.productType === 'SUBSCRIPTION') {
    // Determine trial days: SDK override > promotion extension > product default
    const effectiveTrialDays =
      requestTrialDays ??
      (resolvedPromotion?.type === 'TRIAL_EXTENSION' && resolvedPromotion.trialDays
        ? (product.trialDays ?? 0) + resolvedPromotion.trialDays
        : product.trialDays) ?? 0

    sessionParams.subscription_data = {
      application_fee_percent: auth.app.platformFeePercent ?? 1.5,
      metadata: { appId: auth.appId, productId: product.id },
      ...(effectiveTrialDays > 0
        ? { trial_period_days: effectiveTrialDays }
        : {}),
    }
  }

  let session: Awaited<ReturnType<typeof stripe.checkout.sessions.create>>
  try {
    session = await stripe.checkout.sessions.create(sessionParams, connectOpts)
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
