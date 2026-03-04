// POST /api/v1/webhooks/stripe
// Receives all Stripe webhook events and updates the database accordingly.
// This endpoint does NOT use API key auth — it uses Stripe signature verification.
// To receive events from connected accounts, register this endpoint in
// Stripe Dashboard > Developers > Webhooks with 'Listen to events on
// Connected accounts' enabled.
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { EU_VAT_RATES } from '@/lib/eu-vat'
import {
  sendPurchaseConfirmation,
  sendWiderrufsrechtWaiver,
  sendCancellationConfirmation,
  sendDisputeAlert,
  sendWebhookFailureAlert,
} from '@/lib/email'
import { clerkClient } from '@clerk/nextjs/server'
import { reportTransaction } from '@/lib/apple-reporting'

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
    await handleStripeEvent(event, connectOpts)
    await prisma.webhookEvent.update({
      where: { id: event.id },
      data: { status: 'PROCESSED', processedAt: new Date() },
    })
  } catch (error: unknown) {
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
) {
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session, connectOpts)
      break
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
      break
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
      break
    case 'invoice.payment_succeeded':
      await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice, connectOpts)
      break
    case 'invoice.payment_failed':
      await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
      break
    case 'charge.refunded':
      await handleChargeRefunded(event.data.object as Stripe.Charge, connectOpts)
      break
    case 'charge.dispute.created':
      await handleDisputeCreated(event.data.object as Stripe.Dispute, connectOpts)
      break
    default:
      // Unhandled event type — log but don't error
      break
  }
}

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
  connectOpts: { stripeAccount: string } | undefined
) {
  const metadata = session.metadata
  if (!metadata?.appId || !metadata?.productId || !metadata?.externalUserId) {
    throw new Error('Missing metadata on checkout session')
  }

  const { appId, productId, externalUserId } = metadata

  // Verify payment succeeded
  if (session.payment_status !== 'paid') return

  const customer = await prisma.customer.findUnique({
    where: { appId_externalUserId: { appId, externalUserId } },
  })
  if (!customer) throw new Error(`Customer not found: ${externalUserId}`)

  const product = await prisma.product.findUnique({ where: { id: productId } })
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
      ...(metadata.appleExternalPurchaseToken
        ? { appleExternalPurchaseToken: metadata.appleExternalPurchaseToken }
        : {}),
    },
  })

  // Grant entitlement
  if (product.productType === 'SUBSCRIPTION' && session.subscription) {
    const subscriptionId = typeof session.subscription === 'string'
      ? session.subscription
      : session.subscription.id
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {}, connectOpts)
    // Get billing period from the first subscription item
    const firstItem = subscription.items.data[0]
    await prisma.entitlement.create({
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
  } else {
    // One-time purchase — lifetime access
    await prisma.entitlement.create({
      data: {
        customerId: customer.id,
        productId: product.id,
        status: 'ACTIVE',
        source: 'WEB_CHECKOUT',
      },
    })
  }

  // ── Send transactional emails (fire-and-forget) ──────────
  if (customer.email) {
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
        })
      }
    } catch (emailError) {
      // Email failure must never break the webhook handler
      console.error('[Webhook] Email sending failed:', emailError)
    }
  }

  // ── Report to Apple (fire-and-forget) ──────────────────
  await reportToApple(appId, transaction.id)
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const entitlement = await prisma.entitlement.findUnique({
    where: { stripeSubscriptionId: subscription.id },
  })
  if (!entitlement) return

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
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const entitlement = await prisma.entitlement.findUnique({
    where: { stripeSubscriptionId: subscription.id },
    include: { customer: true, product: true },
  })
  if (!entitlement) return

  await prisma.entitlement.update({
    where: { id: entitlement.id },
    data: { status: 'CANCELLED' },
  })

  // Send cancellation confirmation email
  if (entitlement.customer.email) {
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
      })
    } catch (emailError) {
      console.error('[Webhook] Cancellation email failed:', emailError)
    }
  }
}

async function handleInvoicePaymentSucceeded(
  invoice: Stripe.Invoice,
  connectOpts: { stripeAccount: string } | undefined
) {
  // Only handle subscription renewal invoices (not the first invoice from checkout)
  const subDetails = invoice.parent?.subscription_details
  if (!subDetails?.subscription || invoice.billing_reason === 'subscription_create') return

  const subscriptionId = typeof subDetails.subscription === 'string'
    ? subDetails.subscription
    : subDetails.subscription.id

  const entitlement = await prisma.entitlement.findUnique({
    where: { stripeSubscriptionId: subscriptionId },
    include: { customer: true, product: true },
  })
  if (!entitlement) return

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

  // Report renewal to Apple
  await reportToApple(entitlement.customer.appId, renewalTx.id)
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subDetails = invoice.parent?.subscription_details
  if (!subDetails?.subscription) return

  const subscriptionId = typeof subDetails.subscription === 'string'
    ? subDetails.subscription
    : subDetails.subscription.id

  const entitlement = await prisma.entitlement.findUnique({
    where: { stripeSubscriptionId: subscriptionId },
    include: { customer: { include: { app: true } } },
  })
  if (!entitlement) return

  // Mark entitlement as expired (Stripe will retry — if it succeeds, the
  // subscription.updated webhook will flip it back to ACTIVE)
  await prisma.entitlement.update({
    where: { id: entitlement.id },
    data: { status: 'EXPIRED' },
  })

  // Notify developer via their registered webhook URL
  await notifyDeveloper(entitlement.customer.app, 'invoice.payment_failed', {
    userId: entitlement.customer.externalUserId,
    productId: entitlement.productId,
    invoiceId: invoice.id,
    amountDue: invoice.amount_due,
    currency: invoice.currency,
    attemptCount: invoice.attempt_count,
  })
}

async function handleChargeRefunded(
  charge: Stripe.Charge,
  connectOpts: { stripeAccount: string } | undefined
) {
  const paymentIntentId = typeof charge.payment_intent === 'string'
    ? charge.payment_intent
    : charge.payment_intent?.id

  if (!paymentIntentId) return

  const transaction = await prisma.transaction.findUnique({
    where: { stripePaymentIntentId: paymentIntentId },
    include: { customer: true, product: true },
  })
  if (!transaction) return

  // Update transaction status to REFUNDED
  await prisma.transaction.update({
    where: { id: transaction.id },
    data: { status: 'REFUNDED' },
  })

  // Report refund to Apple
  await reportToApple(transaction.appId, transaction.id)

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
    }
  }
}

async function handleDisputeCreated(
  dispute: Stripe.Dispute,
  connectOpts: { stripeAccount: string } | undefined
) {
  const charge = typeof dispute.charge === 'string'
    ? await stripe.charges.retrieve(dispute.charge, connectOpts)
    : dispute.charge

  if (!charge) return

  const paymentIntentId = typeof charge.payment_intent === 'string'
    ? charge.payment_intent
    : charge.payment_intent?.id

  if (!paymentIntentId) return

  const transaction = await prisma.transaction.findUnique({
    where: { stripePaymentIntentId: paymentIntentId },
    include: { customer: { include: { app: true } } },
  })
  if (!transaction) return

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
      })
    }
  } catch (alertErr) {
    console.error('[Webhook] Dispute alert email failed:', alertErr)
  }
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
  } catch (appleErr) {
    // Apple reporting failure must never break the webhook handler
    console.error('[Webhook] Apple reporting failed:', appleErr)
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

  try {
    const res = await fetch(app.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(app.webhookSecret
          ? { 'X-EuroPay-Signature': app.webhookSecret }
          : {}),
      },
      body: JSON.stringify({ type: eventType, data: payload }),
    })
    if (!res.ok) {
      deliveryFailed = true
      deliveryError = `HTTP ${res.status}`
    }
  } catch (err) {
    deliveryFailed = true
    deliveryError = err instanceof Error ? err.message : 'Request failed'
  }

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
