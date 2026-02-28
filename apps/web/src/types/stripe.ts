// src/types/stripe.ts
// Stripe webhook event types used by our webhook handler

export const HANDLED_WEBHOOK_EVENTS = [
  'checkout.session.completed',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
  'charge.refunded',
  'charge.dispute.created',
] as const

export type HandledWebhookEvent = (typeof HANDLED_WEBHOOK_EVENTS)[number]
