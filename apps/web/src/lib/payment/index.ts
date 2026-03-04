// Payment provider factory.
// Usage: const provider = getPaymentProvider(app.paymentProvider)

import { ProviderType } from './types'
import type { PaymentProvider } from './types'
import { StripeProvider } from './stripe-provider'

const stripeProvider = new StripeProvider()

export function getPaymentProvider(type: ProviderType): PaymentProvider {
  switch (type) {
    case ProviderType.STRIPE:
      return stripeProvider
    case ProviderType.ROOTLINE:
      throw new Error('Rootline provider not yet implemented')
    default:
      throw new Error(`Unknown payment provider: ${type}`)
  }
}

// Re-export all types
export { ProviderType } from './types'
export type {
  PaymentProvider,
  MerchantContext,
  CreateCheckoutParams,
  CheckoutSession,
  CheckoutLineItem,
  CheckoutCustomField,
  CreateCustomerParams,
  SubscriptionData,
  UpdateSubscriptionParams,
  BillingPortalParams,
  CreateCouponParams,
  ChargeData,
  WebhookEvent,
} from './types'
