// src/lib/checkout.ts
// Shared Stripe Checkout Session creation logic used by both
// /v1/checkout/create and /v1/checkout/preload.
import Stripe from 'stripe'
import { stripe } from './stripe'
import { prisma } from './prisma'

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

export type ResolvedPromotion = {
  id: string
  stripeCouponId: string | null
  stripePromoCodeId: string | null
  type: string
  trialDays: number | null
  code: string | null
}

export type ProductForCheckout = {
  id: string
  stripePriceId: string
  productType: string
  amountCents: number
  currency: string
  trialDays: number | null
}

export type CreateCheckoutSessionParams = {
  appId: string
  stripeCustomerId: string
  product: ProductForCheckout
  userId: string
  locale: string
  successUrl: string
  cancelUrl: string
  stripeConnectId: string
  platformFeePercent: number
  appleExternalPurchaseToken?: string
  resolvedPromotion?: ResolvedPromotion | null
  requestTrialDays?: number
}

/**
 * Resolve a promotion by ID or promo code. Returns null if not found, expired,
 * or max redemptions reached.
 */
export async function resolvePromotion(
  appId: string,
  promotionId?: string,
  promoCode?: string,
): Promise<ResolvedPromotion | null> {
  if (!promotionId && !promoCode) return null

  const where = promotionId
    ? { id: promotionId, appId, status: 'ACTIVE' as const, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] }
    : { appId, code: promoCode!.toUpperCase(), status: 'ACTIVE' as const, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] }

  const promo = await prisma.promotion.findFirst({ where })
  if (!promo) return null

  if (promo.maxRedemptions) {
    const count = await prisma.promotionRedemption.count({
      where: { promotionId: promo.id },
    })
    if (count >= promo.maxRedemptions) return null
  }

  return promo
}

/**
 * Create a Stripe Checkout Session with all EuroPay-specific configuration:
 * Widerrufsrecht waiver, platform fee, promotion discounts, trial handling,
 * and 30-minute expiry.
 */
export async function createCheckoutSession(
  params: CreateCheckoutSessionParams
): Promise<Stripe.Checkout.Session> {
  const {
    appId,
    stripeCustomerId,
    product,
    userId,
    locale,
    successUrl,
    cancelUrl,
    stripeConnectId,
    platformFeePercent,
    appleExternalPurchaseToken,
    resolvedPromotion,
    requestTrialDays,
  } = params

  const connectOpts: Stripe.RequestOptions = { stripeAccount: stripeConnectId }

  // Look up localized withdrawal waiver text (falls back to English)
  const waiver = withdrawalWaiverTranslations[locale] ?? withdrawalWaiverTranslations.en

  // Build Checkout Session parameters
  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    customer: stripeCustomerId,
    mode: product.productType === 'SUBSCRIPTION' ? 'subscription' : 'payment',
    line_items: [
      {
        price: product.stripePriceId,
        quantity: 1,
      },
    ],
    automatic_tax: { enabled: process.env.STRIPE_TAX_ENABLED === 'true' },
    billing_address_collection: 'required',
    success_url: successUrl,
    cancel_url: cancelUrl,
    locale: locale as Stripe.Checkout.SessionCreateParams['locale'],
    // 30-minute expiry for preload compatibility
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    metadata: {
      appId,
      productId: product.id,
      externalUserId: userId,
      ...(appleExternalPurchaseToken ? { appleExternalPurchaseToken } : {}),
      ...(resolvedPromotion ? { promotionId: resolvedPromotion.id } : {}),
    },
    // Per-app platform fee (one-time payments)
    ...(product.productType !== 'SUBSCRIPTION' ? {
      payment_intent_data: {
        application_fee_amount: Math.round(product.amountCents * (platformFeePercent / 100)),
      },
    } : {}),
    phone_number_collection: { enabled: false },
    // Widerrufsrecht (withdrawal right) waiver — localized per EU locale
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
    const effectiveTrialDays =
      requestTrialDays ??
      (resolvedPromotion?.type === 'TRIAL_EXTENSION' && resolvedPromotion.trialDays
        ? (product.trialDays ?? 0) + resolvedPromotion.trialDays
        : product.trialDays) ?? 0

    sessionParams.subscription_data = {
      application_fee_percent: platformFeePercent,
      metadata: { appId, productId: product.id },
      ...(effectiveTrialDays > 0
        ? { trial_period_days: effectiveTrialDays }
        : {}),
    }
  }

  return stripe.checkout.sessions.create(sessionParams, connectOpts)
}
