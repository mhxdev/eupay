// POST /api/v1/webhooks/stripe
// Receives all Stripe webhook events and updates the database accordingly.
// This endpoint does NOT use API key auth — it uses Stripe signature verification.
// To receive events from connected accounts, register this endpoint in
// Stripe Dashboard > Developers > Webhooks with 'Listen to events on
// Connected accounts' enabled.
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createHmac } from 'crypto'
import * as Sentry from '@sentry/nextjs'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { EU_VAT_RATES } from '@/lib/eu-vat'
import {
  sendPurchaseConfirmation,
  sendWiderrufsrechtWaiver,
  sendCancellationConfirmation,
  sendRefundConfirmation,
  sendRenewalReceipt,
  sendPaymentFailed,
  sendDisputeAlert,
  sendWebhookFailureAlert,
} from '@/lib/email'
import { clerkClient } from '@clerk/nextjs/server'
import { reportTransaction } from '@/lib/apple-reporting'
import { logAuditEvent } from '@/lib/audit'

export async function POST(req: Request) {
  const body = await req.text() // MUST be raw text, not parsed JSON
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return new NextResponse('Missing stripe-signature header', { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return new NextResponse(`Webhook signature verification failed: ${message}`, {
      status: 400,
    })
  }

  // Connected account support: if event.account is set, the event came from
  // a developer's connected Stripe account — scope all API calls to it.
  const connectOpts = event.account
    ? { stripeAccount: event.account }
    : undefined

  // Idempotency: check if already processed
  const existing = await prisma.webhookEvent.findUnique({
    where: { id: event.id },
  })
  if (existing?.status === 'PROCESSED') {
    return new NextResponse('Already processed', { status: 200 })
  }

  // Log the event — store parsed JSON body for Prisma Json compatibility
  await prisma.webhookEvent.upsert({
    where: { id: event.id },
    create: {
      id: event.id,
      type: event.type,
      payload: JSON.parse(body),
      status: 'PENDING',
    },
    update: {},
  })

  try {
    const resolvedAppId = await handleStripeEvent(event, connectOpts)
    await prisma.webhookEvent.update({
      where: { id: event.id },
      data: {
        status: 'PROCESSED',
        processedAt: new Date(),
        ...(resolvedAppId ? { appId: resolvedAppId } : {}),
      },
    })
  } catch (error: unknown) {
    Sentry.captureException(error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    await prisma.webhookEvent.update({
      where: { id: event.id },
      data: { status: 'FAILED', error: message },
    })
    // Return 500 so Stripe retries
    return new NextResponse(`Webhook handler failed: ${message}`, { status: 500 })
  }

  return new NextResponse('OK', { status: 200 })
}

async function handleStripeEvent(
  event: Stripe.Event,
  connectOpts: { stripeAccount: string } | undefined
): Promise<string | null> {
  switch (event.type) {
    case 'checkout.session.completed':
      return await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session, connectOpts)
    case 'customer.subscription.updated':
      return await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
    case 'customer.subscription.deleted':
      return await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
    case 'invoice.payment_succeeded':
      return await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice, connectOpts)
    case 'invoice.payment_failed':
      return await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
    case 'charge.refunded':
      return await handleChargeRefunded(event.data.object as Stripe.Charge, connectOpts)
    case 'charge.dispute.created':
      return await handleDisputeCreated(event.data.object as Stripe.Dispute, connectOpts)
    default:
      // Unhandled event type — log but don't error
      return null
  }
}

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
  connectOpts: { stripeAccount: string } | undefined
): Promise<string | null> {
  const metadata = session.metadata
  if (!metadata?.appId || !metadata?.productId || !metadata?.externalUserId) {
    throw new Error('Missing metadata on checkout session')
  }

  const { appId, productId, externalUserId } = metadata

  // Verify payment succeeded
  if (session.payment_status !== 'paid') return null

  const customer = await prisma.customer.findUnique({
    where: { appId_externalUserId: { appId, externalUserId } },
  })
  if (!customer) throw new Error(`Customer not found: ${externalUserId}`)

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { app: true },
  })
  if (!product) throw new Error(`Product not found: ${productId}`)

  // Extract VAT data from Stripe
  const totalDetails = session.total_details
  const amountTax = totalDetails?.amount_tax ?? 0

  // Record Widerrufsrecht waiver
  const withdrawalWaived =
    session.custom_fields?.find((f) => f.key === 'withdrawal_waiver')?.dropdown
      ?.value === 'agreed'

  // Compute VAT rate from country
  const vatCountry = session.customer_details?.address?.country ?? undefined
  const vatRate = vatCountry
    ? (EU_VAT_RATES[vatCountry]?.digital ?? null)
    : null

  // Update transaction
  const transaction = await prisma.transaction.update({
    where: { stripeCheckoutSessionId: session.id },
    data: {
      stripePaymentIntentId: typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id,
      amountTotal: session.amount_total ?? 0,
      amountSubtotal: session.amount_subtotal ?? 0,
      amountTax,
      vatRate,
      vatCountry,
      status: 'SUCCEEDED',
      withdrawalWaivedAt: withdrawalWaived ? new Date() : undefined,
      appliedFeePercent: metadata.appliedFeePercent ? parseFloat(metadata.appliedFeePercent) : null,
      appliedFeeCents: metadata.appliedFeeCents ? parseInt(metadata.appliedFeeCents) : null,
      ...(metadata.appleExternalPurchaseToken
        ? { appleExternalPurchaseToken: metadata.appleExternalPurchaseToken }
        : {}),
    },
  })

  // Grant entitlement
  let entitlementId: string | undefined
  if (product.productType === 'SUBSCRIPTION' && session.subscription) {
    const subscriptionId = typeof session.subscription === 'string'
      ? session.subscription
      : session.subscription.id
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {}, connectOpts)
    // Get billing period from the first subscription item
    const firstItem = subscription.items.data[0]
    const ent = await prisma.entitlement.create({
      data: {
        customerId: customer.id,
        productId: product.id,
        status: 'ACTIVE',
        source: 'WEB_CHECKOUT',
        stripeSubscriptionId: subscription.id,
        currentPeriodStart: firstItem
          ? new Date(firstItem.current_period_start * 1000)
          : new Date(),
        currentPeriodEnd: firstItem
          ? new Date(firstItem.current_period_end * 1000)
          : undefined,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    })
    entitlementId = ent.id
  } else {
    // One-time purchase — lifetime access
    const ent = await prisma.entitlement.create({
      data: {
        customerId: customer.id,
        productId: product.id,
        status: 'ACTIVE',
        source: 'WEB_CHECKOUT',
      },
    })
    entitlementId = ent.id
  }

  // ── Audit: entitlement granted ────────────────────────────
  await logAuditEvent({
    appId,
    userId: externalUserId,
    category: "entitlement",
    action: "granted",
    resourceType: "entitlement",
    resourceId: entitlementId,
    details: {
      previousStatus: null,
      newStatus: "ACTIVE",
      reason: "checkout_completed",
      productId,
      transactionId: transaction.id,
    },
  })

  // ── Track promotion redemption ──────────────────────────
  if (metadata.promotionId) {
    try {
      const promotion = await prisma.promotion.findUnique({
        where: { id: metadata.promotionId },
      })
      if (promotion && promotion.status === 'ACTIVE') {
        await prisma.promotionRedemption.create({
          data: {
            promotionId: promotion.id,
            customerId: customer.id,
            transactionId: transaction.id,
          },
        })

        // Auto-expire if max redemptions reached
        if (promotion.maxRedemptions) {
          const count = await prisma.promotionRedemption.count({
            where: { promotionId: promotion.id },
          })
          if (count >= promotion.maxRedemptions) {
            await prisma.promotion.update({
              where: { id: promotion.id },
              data: { status: 'EXPIRED' },
            })
          }
        }
      }
    } catch (redeemErr) {
      // Redemption tracking failure must never break the webhook handler
      console.error('[Webhook] Promotion redemption tracking failed:', redeemErr)
    }
  }

  // ── Auto-tag experiment purchase events ────────────────
  try {
    const assignments = await prisma.experimentAssignment.findMany({
      where: { userId: externalUserId, experiment: { appId, status: "RUNNING" } },
      select: { experimentId: true, variantId: true },
    })
    for (const a of assignments) {
      await prisma.experimentEvent.create({
        data: {
          experimentId: a.experimentId,
          variantId: a.variantId,
          userId: externalUserId,
          eventType: "purchase",
          revenueCents: transaction.amountTotal,
        },
      })
    }
  } catch (expErr) {
    console.error("[Webhook] Experiment purchase tagging failed:", expErr)
  }

  // ── Send transactional emails (fire-and-forget) ──────────
  if (customer.email && product.app.sendCustomerEmails) {
    try {
      // Create a portal URL for the email
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: customer.stripeCustomerId,
        return_url: process.env.NEXT_PUBLIC_APP_URL ?? 'https://europay.dev',
      }, connectOpts)

      await sendPurchaseConfirmation({
        to: customer.email,
        customerName: customer.name ?? customer.email,
        productName: product.name,
        amountTotal: transaction.amountTotal,
        amountSubtotal: transaction.amountSubtotal,
        amountTax: transaction.amountTax,
        vatRate: transaction.vatRate ?? 0,
        vatCountry: transaction.vatCountry ?? '',
        currency: transaction.currency,
        transactionId: transaction.id,
        transactionDate: transaction.createdAt,
        portalUrl: portalSession.url,
        isSubscription: product.productType === 'SUBSCRIPTION',
        withdrawalWaived: !!transaction.withdrawalWaivedAt,
        appName: product.app.name,
        companyName: product.app.companyName ?? undefined,
        supportEmail: product.app.supportEmail ?? undefined,
        appId,
        userId: externalUserId,
      })

      // Send Widerrufsrecht waiver confirmation if applicable
      if (transaction.withdrawalWaivedAt) {
        await sendWiderrufsrechtWaiver({
          to: customer.email,
          customerName: customer.name ?? customer.email,
          productName: product.name,
          transactionId: transaction.id,
          transactionDate: transaction.createdAt,
          amountTotal: transaction.amountTotal,
          currency: transaction.currency,
          appName: product.app.name,
          companyName: product.app.companyName ?? undefined,
          supportEmail: product.app.supportEmail ?? undefined,
          appId,
          userId: externalUserId,
        })
      }
    } catch (emailError) {
      // Email failure must never break the webhook handler
      console.error('[Webhook] Email sending failed:', emailError)
    }
  }

  // ── Notify developer webhook with enriched payload ──────
  const withdrawalWaiverField = session.custom_fields?.find(
    (f) => f.key === 'withdrawal_waiver'
  )
  await notifyDeveloper(product.app, 'checkout.session.completed', {
    userId: externalUserId,
    productId: product.id,
    europay: {
      event: 'purchase.completed',
      transaction: {
        id: transaction.id,
        productName: product.name,
        amountCents: transaction.amountTotal,
        currency: transaction.currency,
        status: transaction.status,
        createdAt: transaction.createdAt.toISOString(),
        stripePaymentIntentId: transaction.stripePaymentIntentId,
      },
      customer: {
        email: customer.email,
        userId: externalUserId,
      },
      withdrawal_waiver: {
        accepted: !!transaction.withdrawalWaivedAt,
        acceptedAt: transaction.withdrawalWaivedAt?.toISOString() ?? null,
        locale: withdrawalWaiverField?.dropdown?.value === 'agreed' ? 'de' : null,
        text: withdrawalWaiverField?.dropdown?.value === 'agreed'
          ? 'Ja, Lieferung sofort — Widerruf entfällt'
          : null,
      },
      app: {
        id: product.app.id,
        name: product.app.name,
      },
    },
  })

  // ── Report to Apple (fire-and-forget) ──────────────────
  await reportToApple(appId, transaction.id)

  return appId
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<string | null> {
  const entitlement = await prisma.entitlement.findUnique({
    where: { stripeSubscriptionId: subscription.id },
    include: { customer: { select: { appId: true, externalUserId: true } } },
  })
  if (!entitlement) return null

  const previousStatus = entitlement.status

  let status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PAUSED' = 'ACTIVE'
  if (subscription.status === 'canceled') status = 'CANCELLED'
  else if (subscription.status === 'past_due' || subscription.status === 'unpaid')
    status = 'EXPIRED'
  else if (subscription.status === 'paused') status = 'PAUSED'

  // Get billing period from the first subscription item
  const firstItem = subscription.items.data[0]

  await prisma.entitlement.update({
    where: { id: entitlement.id },
    data: {
      status,
      currentPeriodStart: firstItem
        ? new Date(firstItem.current_period_start * 1000)
        : undefined,
      currentPeriodEnd: firstItem
        ? new Date(firstItem.current_period_end * 1000)
        : undefined,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  })

  // ── Audit: entitlement status change ────────────────────
  if (previousStatus !== status) {
    const actionMap: Record<string, string> = {
      ACTIVE: "activated",
      EXPIRED: "expired",
      CANCELLED: "revoked",
      PAUSED: "paused",
    }
    await logAuditEvent({
      appId: entitlement.customer.appId,
      userId: entitlement.customer.externalUserId,
      category: "entitlement",
      action: actionMap[status] ?? "updated",
      resourceType: "entitlement",
      resourceId: entitlement.id,
      details: {
        previousStatus,
        newStatus: status,
        reason: "subscription_updated",
        stripeSubscriptionId: subscription.id,
      },
    })
  }

  return entitlement.customer.appId
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<string | null> {
  const entitlement = await prisma.entitlement.findUnique({
    where: { stripeSubscriptionId: subscription.id },
    include: { customer: { include: { app: true } }, product: true },
  })
  if (!entitlement) return null

  const previousStatus = entitlement.status

  await prisma.entitlement.update({
    where: { id: entitlement.id },
    data: { status: 'CANCELLED' },
  })

  // ── Audit: entitlement revoked ──────────────────────────
  await logAuditEvent({
    appId: entitlement.customer.appId,
    userId: entitlement.customer.externalUserId,
    category: "entitlement",
    action: "revoked",
    resourceType: "entitlement",
    resourceId: entitlement.id,
    details: {
      previousStatus,
      newStatus: "CANCELLED",
      reason: "subscription_cancelled",
      productId: entitlement.productId,
      stripeSubscriptionId: subscription.id,
    },
  })

  // Send cancellation confirmation email
  if (entitlement.customer.email && entitlement.customer.app.sendCustomerEmails) {
    try {
      const firstItem = subscription.items.data[0]
      const periodEnd = firstItem
        ? new Date(firstItem.current_period_end * 1000)
        : new Date()

      await sendCancellationConfirmation({
        to: entitlement.customer.email,
        customerName: entitlement.customer.name ?? entitlement.customer.email,
        productName: entitlement.product.name,
        currentPeriodEnd: periodEnd,
        appName: entitlement.customer.app.name,
        companyName: entitlement.customer.app.companyName ?? undefined,
        supportEmail: entitlement.customer.app.supportEmail ?? undefined,
        appId: entitlement.customer.appId,
        userId: entitlement.customer.externalUserId,
        entitlementId: entitlement.id,
      })
    } catch (emailError) {
      console.error('[Webhook] Cancellation email failed:', emailError)
    }
  }

  // Notify developer webhook with enriched payload
  await notifyDeveloper(entitlement.customer.app, 'customer.subscription.deleted', {
    userId: entitlement.customer.externalUserId,
    productId: entitlement.productId,
    europay: {
      event: 'subscription.cancelled',
      subscription: {
        id: subscription.id,
        productName: entitlement.product.name,
        cancelledAt: new Date().toISOString(),
      },
      customer: {
        email: entitlement.customer.email,
        userId: entitlement.customer.externalUserId,
      },
    },
  })

  return entitlement.customer.app.id
}

async function handleInvoicePaymentSucceeded(
  invoice: Stripe.Invoice,
  connectOpts: { stripeAccount: string } | undefined
): Promise<string | null> {
  // Only handle subscription renewal invoices (not the first invoice from checkout)
  const subDetails = invoice.parent?.subscription_details
  if (!subDetails?.subscription || invoice.billing_reason === 'subscription_create') return null

  const subscriptionId = typeof subDetails.subscription === 'string'
    ? subDetails.subscription
    : subDetails.subscription.id

  const entitlement = await prisma.entitlement.findUnique({
    where: { stripeSubscriptionId: subscriptionId },
    include: { customer: { include: { app: true } }, product: true },
  })
  if (!entitlement) return null

  // Retrieve updated subscription to get new period dates
  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {}, connectOpts)
  const firstItem = subscription.items.data[0]

  // Update entitlement period
  await prisma.entitlement.update({
    where: { id: entitlement.id },
    data: {
      status: 'ACTIVE',
      currentPeriodStart: firstItem
        ? new Date(firstItem.current_period_start * 1000)
        : undefined,
      currentPeriodEnd: firstItem
        ? new Date(firstItem.current_period_end * 1000)
        : undefined,
    },
  })

  // Compute tax from total_taxes array
  const amountTax = invoice.total_taxes?.reduce((sum, t) => sum + t.amount, 0) ?? 0

  // Log renewal transaction
  const renewalTx = await prisma.transaction.create({
    data: {
      appId: entitlement.customer.appId,
      customerId: entitlement.customerId,
      productId: entitlement.productId,
      stripeInvoiceId: invoice.id,
      amountTotal: invoice.amount_paid,
      amountSubtotal: invoice.subtotal,
      amountTax,
      currency: invoice.currency,
      status: 'SUCCEEDED',
    },
  })

  // Send renewal receipt email
  if (entitlement.customer.email && entitlement.customer.app.sendCustomerEmails) {
    try {
      const nextRenewalDate = firstItem
        ? new Date(firstItem.current_period_end * 1000)
        : undefined

      await sendRenewalReceipt({
        to: entitlement.customer.email,
        productName: entitlement.product.name,
        amountCents: invoice.amount_paid,
        currency: invoice.currency,
        transactionId: renewalTx.id,
        renewedAt: new Date(),
        nextRenewalDate,
        appName: entitlement.customer.app.name,
        companyName: entitlement.customer.app.companyName ?? undefined,
        supportEmail: entitlement.customer.app.supportEmail ?? undefined,
        appId: entitlement.customer.appId,
        userId: entitlement.customer.externalUserId,
      })
    } catch (emailError) {
      console.error('[Webhook] Renewal receipt email failed:', emailError)
    }
  }

  // ── Auto-tag experiment events (trial_convert or purchase) ──
  try {
    const assignments = await prisma.experimentAssignment.findMany({
      where: {
        userId: entitlement.customer.externalUserId,
        experiment: { appId: entitlement.customer.appId, status: "RUNNING" },
      },
      select: { experimentId: true, variantId: true },
    })

    // Detect trial conversion: if subscription had a trial and this is the first paid invoice
    const isTrialConvert = subscription.trial_end && subscription.trial_end * 1000 <= Date.now()
      && invoice.billing_reason === "subscription_cycle"

    for (const a of assignments) {
      await prisma.experimentEvent.create({
        data: {
          experimentId: a.experimentId,
          variantId: a.variantId,
          userId: entitlement.customer.externalUserId,
          eventType: isTrialConvert ? "trial_convert" : "purchase",
          revenueCents: invoice.amount_paid,
        },
      })
    }
  } catch (expErr) {
    console.error("[Webhook] Experiment renewal tagging failed:", expErr)
  }

  // Report renewal to Apple
  await reportToApple(entitlement.customer.appId, renewalTx.id)

  return entitlement.customer.app.id
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<string | null> {
  const subDetails = invoice.parent?.subscription_details
  if (!subDetails?.subscription) return null

  const subscriptionId = typeof subDetails.subscription === 'string'
    ? subDetails.subscription
    : subDetails.subscription.id

  const entitlement = await prisma.entitlement.findUnique({
    where: { stripeSubscriptionId: subscriptionId },
    include: { customer: { include: { app: true } }, product: true },
  })
  if (!entitlement) return null

  const previousStatus = entitlement.status

  // Mark entitlement as expired (Stripe will retry — if it succeeds, the
  // subscription.updated webhook will flip it back to ACTIVE)
  await prisma.entitlement.update({
    where: { id: entitlement.id },
    data: { status: 'EXPIRED' },
  })

  // ── Audit: entitlement expired ──────────────────────────
  await logAuditEvent({
    appId: entitlement.customer.appId,
    userId: entitlement.customer.externalUserId,
    category: "entitlement",
    action: "expired",
    resourceType: "entitlement",
    resourceId: entitlement.id,
    details: {
      previousStatus,
      newStatus: "EXPIRED",
      reason: "payment_failed",
      productId: entitlement.productId,
      stripeSubscriptionId: subscriptionId,
    },
  })

  // Send payment failed email
  if (entitlement.customer.email && entitlement.customer.app.sendCustomerEmails) {
    try {
      await sendPaymentFailed({
        to: entitlement.customer.email,
        productName: entitlement.product.name,
        amountCents: invoice.amount_due,
        currency: invoice.currency,
        failedAt: new Date(),
        appName: entitlement.customer.app.name,
        companyName: entitlement.customer.app.companyName ?? undefined,
        supportEmail: entitlement.customer.app.supportEmail ?? undefined,
        appId: entitlement.customer.appId,
        userId: entitlement.customer.externalUserId,
        entitlementId: entitlement.id,
      })
    } catch (emailError) {
      console.error('[Webhook] Payment failed email failed:', emailError)
    }
  }

  // Notify developer via their registered webhook URL
  await notifyDeveloper(entitlement.customer.app, 'invoice.payment_failed', {
    userId: entitlement.customer.externalUserId,
    productId: entitlement.productId,
    invoiceId: invoice.id,
    amountDue: invoice.amount_due,
    currency: invoice.currency,
    attemptCount: invoice.attempt_count,
    europay: {
      event: 'payment.failed',
      customer: {
        email: entitlement.customer.email,
        userId: entitlement.customer.externalUserId,
      },
    },
  })

  return entitlement.customer.app.id
}

async function handleChargeRefunded(
  charge: Stripe.Charge,
  connectOpts: { stripeAccount: string } | undefined
): Promise<string | null> {
  const paymentIntentId = typeof charge.payment_intent === 'string'
    ? charge.payment_intent
    : charge.payment_intent?.id

  if (!paymentIntentId) return null

  const transaction = await prisma.transaction.findUnique({
    where: { stripePaymentIntentId: paymentIntentId },
    include: { customer: { include: { app: true } }, product: true },
  })
  if (!transaction) return null

  // Update transaction status to REFUNDED
  await prisma.transaction.update({
    where: { id: transaction.id },
    data: { status: 'REFUNDED' },
  })

  // Send refund confirmation email
  if (transaction.customer.email && transaction.customer.app.sendCustomerEmails) {
    try {
      await sendRefundConfirmation({
        to: transaction.customer.email,
        productName: transaction.product.name,
        amountCents: transaction.amountTotal,
        currency: transaction.currency,
        transactionId: transaction.id,
        refundedAt: new Date(),
        appName: transaction.customer.app.name,
        companyName: transaction.customer.app.companyName ?? undefined,
        supportEmail: transaction.customer.app.supportEmail ?? undefined,
        appId: transaction.appId,
        userId: transaction.customer.externalUserId,
      })
    } catch (emailError) {
      console.error('[Webhook] Refund confirmation email failed:', emailError)
    }
  }

  // Report refund to Apple
  await reportToApple(transaction.appId, transaction.id)

  // Notify developer webhook with enriched payload
  await notifyDeveloper(transaction.customer.app, 'charge.refunded', {
    userId: transaction.customer.externalUserId,
    productId: transaction.productId,
    transactionId: transaction.id,
    europay: {
      event: 'purchase.refunded',
      transaction: {
        id: transaction.id,
        productName: transaction.product.name,
        amountCents: transaction.amountTotal,
        currency: transaction.currency,
        status: 'REFUNDED',
        createdAt: transaction.createdAt.toISOString(),
        stripePaymentIntentId: transaction.stripePaymentIntentId,
      },
      customer: {
        email: transaction.customer.email,
        userId: transaction.customer.externalUserId,
      },
    },
  })

  // If fully refunded, revoke entitlement
  if (charge.refunded) {
    const entitlement = await prisma.entitlement.findFirst({
      where: {
        customerId: transaction.customerId,
        productId: transaction.productId,
        status: 'ACTIVE',
      },
    })

    if (entitlement) {
      // For subscriptions, cancel in Stripe as well
      if (entitlement.stripeSubscriptionId) {
        try {
          await stripe.subscriptions.cancel(entitlement.stripeSubscriptionId, {}, connectOpts)
        } catch {
          // Subscription may already be cancelled
        }
      }
      await prisma.entitlement.update({
        where: { id: entitlement.id },
        data: { status: 'CANCELLED' },
      })

      // ── Audit: entitlement revoked due to refund ──────────
      await logAuditEvent({
        appId: transaction.appId,
        userId: transaction.customer.externalUserId,
        category: "entitlement",
        action: "revoked",
        resourceType: "entitlement",
        resourceId: entitlement.id,
        details: {
          previousStatus: "ACTIVE",
          newStatus: "CANCELLED",
          reason: "refund",
          productId: transaction.productId,
          transactionId: transaction.id,
        },
      })
    }
  }

  return transaction.customer.app.id
}

async function handleDisputeCreated(
  dispute: Stripe.Dispute,
  connectOpts: { stripeAccount: string } | undefined
): Promise<string | null> {
  const charge = typeof dispute.charge === 'string'
    ? await stripe.charges.retrieve(dispute.charge, connectOpts)
    : dispute.charge

  if (!charge) return null

  const paymentIntentId = typeof charge.payment_intent === 'string'
    ? charge.payment_intent
    : charge.payment_intent?.id

  if (!paymentIntentId) return null

  const transaction = await prisma.transaction.findUnique({
    where: { stripePaymentIntentId: paymentIntentId },
    include: { customer: { include: { app: true } } },
  })
  if (!transaction) return null

  // Mark transaction as disputed
  await prisma.transaction.update({
    where: { id: transaction.id },
    data: { status: 'DISPUTED' },
  })

  // Notify developer via webhook
  await notifyDeveloper(transaction.customer.app, 'charge.dispute.created', {
    userId: transaction.customer.externalUserId,
    productId: transaction.productId,
    transactionId: transaction.id,
    disputeId: dispute.id,
    amount: dispute.amount,
    currency: dispute.currency,
    reason: dispute.reason,
  })

  // Send dispute alert email to developer
  try {
    const clerk = await clerkClient()
    const user = await clerk.users.getUser(transaction.customer.app.clerkUserId)
    const email = user.emailAddresses[0]?.emailAddress
    if (email) {
      await sendDisputeAlert({
        to: email,
        appName: transaction.customer.app.name,
        amount: dispute.amount,
        currency: dispute.currency,
        reason: dispute.reason,
        disputeId: dispute.id,
        transactionId: transaction.id,
        appId: transaction.appId,
      })
    }
  } catch (alertErr) {
    console.error('[Webhook] Dispute alert email failed:', alertErr)
  }

  return transaction.customer.app.id
}

// Helper: report transaction to Apple's External Purchase Server API
async function reportToApple(appId: string, transactionId: string) {
  try {
    const app = await prisma.app.findUnique({ where: { id: appId } })
    if (!app) return

    if (!app.appleKeyId || !app.appleIssuerId || !app.applePrivateKey || !app.appleBundleId) {
      console.warn(`[Webhook] Apple reporting skipped for app ${appId} — credentials not configured`)
      return
    }

    // Use the best available identifier for Apple reporting
    const tx = await prisma.transaction.findUnique({ where: { id: transactionId } })
    if (!tx) return

    const reportId = tx.stripePaymentIntentId ?? tx.stripeCheckoutSessionId ?? tx.id

    const result = await reportTransaction(
      {
        appleKeyId: app.appleKeyId,
        appleIssuerId: app.appleIssuerId,
        applePrivateKey: app.applePrivateKey,
        appleBundleId: app.appleBundleId,
      },
      reportId
    )

    await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        appleReportStatus: result.success ? 'REPORTED' : 'FAILED',
        appleReportedAt: new Date(),
        appleReportError: result.error ?? null,
      },
    })

    // ── Audit: Apple report result ────────────────────────
    await logAuditEvent({
      appId,
      category: "apple_report",
      action: result.success ? "reported" : "failed",
      resourceType: "transaction",
      resourceId: transactionId,
      details: {
        reportId,
        error: result.error ?? null,
      },
    })
  } catch (appleErr) {
    // Apple reporting failure must never break the webhook handler
    console.error('[Webhook] Apple reporting failed:', appleErr)
    await logAuditEvent({
      appId,
      category: "apple_report",
      action: "failed",
      resourceType: "transaction",
      resourceId: transactionId,
      details: {
        error: appleErr instanceof Error ? appleErr.message : "Unknown error",
      },
    })
  }
}

// Helper: forward webhook events to developer's registered webhook URL
async function notifyDeveloper(
  app: {
    id?: string
    name?: string
    clerkUserId?: string
    webhookUrl: string | null
    webhookSecret: string | null
    lastWebhookAlertAt?: Date | null
  },
  eventType: string,
  payload: Record<string, unknown>
) {
  if (!app.webhookUrl) return

  let deliveryFailed = false
  let deliveryError = ''
  let statusCode: number | undefined
  let responseBody = ''
  const startTime = Date.now()

  try {
    const bodyStr = JSON.stringify({ type: eventType, data: payload })
    const timestamp = Math.floor(Date.now() / 1000).toString()

    const signatureHeaders: Record<string, string> = {}
    if (app.webhookSecret) {
      const signature = createHmac('sha256', app.webhookSecret)
        .update(`${timestamp}.${bodyStr}`)
        .digest('hex')
      signatureHeaders['X-EuroPay-Signature'] = signature
      signatureHeaders['X-EuroPay-Timestamp'] = timestamp
    }

    const res = await fetch(app.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...signatureHeaders,
      },
      body: bodyStr,
    })
    statusCode = res.status
    responseBody = await res.text().catch(() => '')
    if (!res.ok) {
      deliveryFailed = true
      deliveryError = `HTTP ${res.status}`
    }
  } catch (err) {
    deliveryFailed = true
    deliveryError = err instanceof Error ? err.message : 'Request failed'
  }

  const durationMs = Date.now() - startTime

  // ── Audit: webhook delivery ─────────────────────────────
  await logAuditEvent({
    appId: app.id,
    category: "webhook_delivery",
    action: deliveryFailed ? "failed" : "delivered",
    resourceType: "webhook_event",
    details: {
      url: app.webhookUrl,
      eventType,
      statusCode: statusCode ?? null,
      responseBody: responseBody.substring(0, 500),
      durationMs,
      error: deliveryError || null,
    },
  })

  // Check for consecutive failures and alert developer
  if (deliveryFailed && app.id && app.clerkUserId) {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

      const recentFailures = await prisma.webhookEvent.count({
        where: {
          appId: app.id,
          status: 'FAILED',
          createdAt: { gte: oneHourAgo },
        },
      })

      if (recentFailures >= 3) {
        // Only send alert once per hour
        const shouldAlert =
          !app.lastWebhookAlertAt ||
          app.lastWebhookAlertAt < oneHourAgo

        if (shouldAlert) {
          const clerk = await clerkClient()
          const user = await clerk.users.getUser(app.clerkUserId)
          const email = user.emailAddresses[0]?.emailAddress
          if (email) {
            await sendWebhookFailureAlert({
              to: email,
              appName: app.name ?? 'Your app',
              webhookUrl: app.webhookUrl,
              failureCount: recentFailures,
              lastError: deliveryError,
              lastAttemptAt: new Date(),
              appId: app.id,
            })
            await prisma.app.update({
              where: { id: app.id },
              data: { lastWebhookAlertAt: new Date() },
            })
          }
        }
      }
    } catch (alertErr) {
      console.error('[Webhook] Failure alert check failed:', alertErr)
    }
  }
}
