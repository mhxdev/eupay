// Stripe implementation of PaymentProvider.
// Wraps the existing Stripe SDK client from @/lib/stripe.

import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import type {
  PaymentProvider,
  MerchantContext,
  CreateCheckoutParams,
  CheckoutSession,
  CreateCustomerParams,
  SubscriptionData,
  UpdateSubscriptionParams,
  BillingPortalParams,
  CreateCouponParams,
  ChargeData,
  WebhookEvent,
} from './types'

/** Extract a string ID from Stripe's expandable fields (string | object | null). */
function extractId(value: string | { id: string } | null | undefined): string | null {
  if (!value) return null
  if (typeof value === 'string') return value
  return value.id
}

function connectOpts(ctx: MerchantContext): Stripe.RequestOptions {
  return { stripeAccount: ctx.providerId }
}

function mapCheckoutSession(s: Stripe.Checkout.Session): CheckoutSession {
  return {
    id: s.id,
    url: s.url,
    expiresAt: s.expires_at,
    paymentStatus: s.payment_status,
    customerId: extractId(s.customer as string | { id: string } | null),
    metadata: (s.metadata ?? {}) as Record<string, string>,
    amountTotal: s.amount_total,
    amountSubtotal: s.amount_subtotal,
    amountTax: s.total_details?.amount_tax ?? null,
    subscriptionId: extractId(s.subscription as string | { id: string } | null),
    paymentIntentId: extractId(s.payment_intent as string | { id: string } | null),
    customerCountry: s.customer_details?.address?.country ?? null,
    customFieldValues: (s.custom_fields ?? []).map((f) => ({
      key: f.key,
      dropdownValue: f.dropdown?.value ?? undefined,
    })),
  }
}

function mapSubscription(sub: Stripe.Subscription): SubscriptionData {
  const item = sub.items.data[0]
  return {
    id: sub.id,
    status: sub.status,
    cancelAtPeriodEnd: sub.cancel_at_period_end,
    currentPeriodStart: item?.current_period_start ?? 0,
    currentPeriodEnd: item?.current_period_end ?? 0,
  }
}

export class StripeProvider implements PaymentProvider {
  // ── Checkout ────────────────────────────────────────────────

  async createCheckoutSession(params: CreateCheckoutParams): Promise<CheckoutSession> {
    const opts = connectOpts(params.merchantCtx)

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: params.customer,
      mode: params.mode,
      line_items: params.lineItems.map((li) => ({
        price: li.priceId,
        quantity: li.quantity,
      })),
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
    }

    if (params.locale) {
      sessionParams.locale = params.locale as Stripe.Checkout.SessionCreateParams['locale']
    }
    if (params.metadata) {
      sessionParams.metadata = params.metadata
    }
    if (params.automaticTax) {
      sessionParams.automatic_tax = params.automaticTax
    }
    if (params.billingAddressCollection) {
      sessionParams.billing_address_collection = params.billingAddressCollection
    }
    if (params.phoneNumberCollection) {
      sessionParams.phone_number_collection = params.phoneNumberCollection
    }
    if (params.customFields) {
      sessionParams.custom_fields = params.customFields.map((cf) => ({
        key: cf.key,
        label: { type: 'custom' as const, custom: cf.label },
        type: cf.type,
        dropdown: { options: cf.options },
        optional: cf.optional,
      }))
    }
    if (params.subscriptionData) {
      sessionParams.subscription_data = {
        trial_period_days: params.subscriptionData.trialPeriodDays,
        metadata: params.subscriptionData.metadata,
      }
    }

    const session = await stripe.checkout.sessions.create(sessionParams, opts)
    return mapCheckoutSession(session)
  }

  async retrieveCheckoutSession(sessionId: string, merchantCtx: MerchantContext): Promise<CheckoutSession> {
    const session = await stripe.checkout.sessions.retrieve(sessionId, connectOpts(merchantCtx))
    return mapCheckoutSession(session)
  }

  // ── Customers ───────────────────────────────────────────────

  async createCustomer(params: CreateCustomerParams): Promise<{ id: string }> {
    const customer = await stripe.customers.create(
      { email: params.email, metadata: params.metadata },
      connectOpts(params.merchantCtx),
    )
    return { id: customer.id }
  }

  async deleteCustomer(customerId: string, merchantCtx: MerchantContext): Promise<void> {
    await stripe.customers.del(customerId, connectOpts(merchantCtx))
  }

  // ── Subscriptions ───────────────────────────────────────────

  async retrieveSubscription(subscriptionId: string, merchantCtx: MerchantContext): Promise<SubscriptionData> {
    const sub = await stripe.subscriptions.retrieve(subscriptionId, connectOpts(merchantCtx))
    return mapSubscription(sub)
  }

  async updateSubscription(subscriptionId: string, params: UpdateSubscriptionParams): Promise<SubscriptionData> {
    const opts = connectOpts(params.merchantCtx)
    const updateParams: Stripe.SubscriptionUpdateParams = {}

    if (params.cancelAtPeriodEnd !== undefined) {
      updateParams.cancel_at_period_end = params.cancelAtPeriodEnd
    }
    if (params.pauseCollection !== undefined) {
      // null = unpause (Stripe uses '' to clear), object = pause
      updateParams.pause_collection = params.pauseCollection === null
        ? ''
        : { behavior: params.pauseCollection.behavior as Stripe.SubscriptionUpdateParams.PauseCollection['behavior'] }
    }
    if (params.discounts) {
      updateParams.discounts = params.discounts.map((d) => ({ coupon: d.couponId }))
    }

    const sub = await stripe.subscriptions.update(subscriptionId, updateParams, opts)
    return mapSubscription(sub)
  }

  async cancelSubscription(subscriptionId: string, merchantCtx: MerchantContext): Promise<void> {
    await stripe.subscriptions.cancel(subscriptionId, {}, connectOpts(merchantCtx))
  }

  // ── Billing Portal ──────────────────────────────────────────

  async createBillingPortalSession(params: BillingPortalParams): Promise<{ url: string }> {
    const session = await stripe.billingPortal.sessions.create(
      { customer: params.customer, return_url: params.returnUrl },
      connectOpts(params.merchantCtx),
    )
    return { url: session.url }
  }

  // ── Coupons ─────────────────────────────────────────────────

  async createCoupon(params: CreateCouponParams): Promise<{ id: string }> {
    const coupon = await stripe.coupons.create(
      {
        id: params.id,
        percent_off: params.percentOff,
        duration: params.duration,
        duration_in_months: params.durationInMonths,
        name: params.name,
        metadata: params.metadata,
      },
      connectOpts(params.merchantCtx),
    )
    return { id: coupon.id }
  }

  async retrieveCoupon(couponId: string, merchantCtx: MerchantContext): Promise<{ id: string } | null> {
    try {
      const coupon = await stripe.coupons.retrieve(couponId, connectOpts(merchantCtx))
      return { id: coupon.id }
    } catch (err) {
      if (err instanceof Stripe.errors.StripeError && err.statusCode === 404) {
        return null
      }
      throw err
    }
  }

  // ── Charges ─────────────────────────────────────────────────

  async retrieveCharge(chargeId: string, merchantCtx: MerchantContext): Promise<ChargeData> {
    const charge = await stripe.charges.retrieve(chargeId, connectOpts(merchantCtx))
    return {
      id: charge.id,
      paymentIntentId: extractId(charge.payment_intent as string | { id: string } | null),
      refunded: charge.refunded,
    }
  }

  // ── Webhooks ────────────────────────────────────────────────

  async verifyWebhookEvent(payload: string | Buffer, signature: string): Promise<WebhookEvent> {
    const secret = process.env.STRIPE_WEBHOOK_SECRET
    if (!secret) throw new Error('STRIPE_WEBHOOK_SECRET is not set')

    const event = stripe.webhooks.constructEvent(payload, signature, secret)
    return {
      id: event.id,
      type: event.type,
      data: event.data.object as unknown as Record<string, unknown>,
      account: event.account ?? undefined,
    }
  }
}
