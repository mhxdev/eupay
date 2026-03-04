// Payment provider abstraction types.
// All types are provider-agnostic — no Stripe/Rootline SDK types leak through.

export enum ProviderType {
  STRIPE = 'STRIPE',
  ROOTLINE = 'ROOTLINE',
}

/** Identifies the merchant's connected account on the payment provider. */
export interface MerchantContext {
  /** stripeConnectId for Stripe, rootlineAccountId for Rootline */
  providerId: string
}

// ── Checkout ────────────────────────────────────────────────────

export interface CheckoutLineItem {
  priceId: string
  quantity: number
}

export interface CheckoutCustomField {
  key: string
  label: string
  type: 'dropdown'
  options: { label: string; value: string }[]
  optional: boolean
}

export interface CreateCheckoutParams {
  merchantCtx: MerchantContext
  customer: string
  mode: 'payment' | 'subscription'
  lineItems: CheckoutLineItem[]
  successUrl: string
  cancelUrl: string
  locale?: string
  metadata?: Record<string, string>
  automaticTax?: { enabled: boolean }
  billingAddressCollection?: 'required' | 'auto'
  phoneNumberCollection?: { enabled: boolean }
  customFields?: CheckoutCustomField[]
  subscriptionData?: {
    trialPeriodDays?: number
    metadata?: Record<string, string>
  }
}

export interface CheckoutSession {
  id: string
  url: string | null
  expiresAt: number
  paymentStatus: string
  customerId: string | null
  metadata: Record<string, string>
  amountTotal: number | null
  amountSubtotal: number | null
  amountTax: number | null
  subscriptionId: string | null
  paymentIntentId: string | null
  customerCountry: string | null
  customFieldValues: { key: string; dropdownValue?: string }[]
}

// ── Customers ───────────────────────────────────────────────────

export interface CreateCustomerParams {
  merchantCtx: MerchantContext
  email?: string
  metadata?: Record<string, string>
}

// ── Subscriptions ───────────────────────────────────────────────

export interface SubscriptionData {
  id: string
  status: string
  cancelAtPeriodEnd: boolean
  currentPeriodStart: number
  currentPeriodEnd: number
}

export interface UpdateSubscriptionParams {
  merchantCtx: MerchantContext
  cancelAtPeriodEnd?: boolean
  /** Pass object to pause, null to unpause */
  pauseCollection?: { behavior: string } | null
  discounts?: { couponId: string }[]
}

// ── Billing Portal ──────────────────────────────────────────────

export interface BillingPortalParams {
  merchantCtx: MerchantContext
  customer: string
  returnUrl: string
}

// ── Coupons ─────────────────────────────────────────────────────

export interface CreateCouponParams {
  merchantCtx: MerchantContext
  id?: string
  percentOff: number
  duration: 'once' | 'repeating' | 'forever'
  durationInMonths?: number
  name?: string
  metadata?: Record<string, string>
}

// ── Charges ─────────────────────────────────────────────────────

export interface ChargeData {
  id: string
  paymentIntentId: string | null
  refunded: boolean
}

// ── Webhooks ────────────────────────────────────────────────────

export interface WebhookEvent {
  id: string
  type: string
  data: Record<string, unknown>
  /** Connected account ID the event originated from (if any). */
  account?: string
}

// ── Provider Interface ──────────────────────────────────────────

export interface PaymentProvider {
  // Checkout
  createCheckoutSession(params: CreateCheckoutParams): Promise<CheckoutSession>
  retrieveCheckoutSession(sessionId: string, merchantCtx: MerchantContext): Promise<CheckoutSession>

  // Customers
  createCustomer(params: CreateCustomerParams): Promise<{ id: string }>
  deleteCustomer(customerId: string, merchantCtx: MerchantContext): Promise<void>

  // Subscriptions
  retrieveSubscription(subscriptionId: string, merchantCtx: MerchantContext): Promise<SubscriptionData>
  updateSubscription(subscriptionId: string, params: UpdateSubscriptionParams): Promise<SubscriptionData>
  cancelSubscription(subscriptionId: string, merchantCtx: MerchantContext): Promise<void>

  // Billing Portal
  createBillingPortalSession(params: BillingPortalParams): Promise<{ url: string }>

  // Coupons
  createCoupon(params: CreateCouponParams): Promise<{ id: string }>
  retrieveCoupon(couponId: string, merchantCtx: MerchantContext): Promise<{ id: string } | null>

  // Charges
  retrieveCharge(chargeId: string, merchantCtx: MerchantContext): Promise<ChargeData>

  // Webhooks
  verifyWebhookEvent(payload: string | Buffer, signature: string): Promise<WebhookEvent>
}
