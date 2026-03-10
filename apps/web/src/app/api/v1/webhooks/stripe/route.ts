// POST /api/v1/webhooks/stripe
// Receives all Stripe webhook events and updates the database accordingly.
// This endpoint does NOT use API key auth — it uses Stripe signature verification.
// To receive events from connected accounts, register this endpoint in
// Stripe Dashboard > Developers > Webhooks with 'Listen to events on
// Connected accounts' enabled.
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import * as Sentry from '@sentry/nextjs'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { handleStripeEvent } from '@/lib/webhook-processor'

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
