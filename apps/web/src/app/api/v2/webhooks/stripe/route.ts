// POST /api/v2/webhooks/stripe
// V2 Stripe webhook handler — uses the same shared handler logic as v1.
// The webhook payload version (v1 vs v2 developer notifications) is determined
// by the app.webhookVersion field, handled in the shared webhook processor.
import { NextResponse } from "next/server"
import Stripe from "stripe"
import * as Sentry from "@sentry/nextjs"
import { stripe } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"
import { handleStripeEvent } from "@/lib/webhook-processor"

export async function POST(req: Request) {
  const body = await req.text()
  const signature = req.headers.get("stripe-signature")

  if (!signature) {
    return new NextResponse("Missing stripe-signature header", { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return new NextResponse(`Webhook signature verification failed: ${message}`, {
      status: 400,
    })
  }

  // Connected account support
  const connectOpts = event.account
    ? { stripeAccount: event.account }
    : undefined

  // Resolve appId early from connected account
  let earlyAppId: string | null = null
  if (event.account) {
    const app = await prisma.app.findFirst({
      where: { stripeConnectId: event.account },
      select: { id: true },
    })
    earlyAppId = app?.id ?? null
  }
  // Resolve appId early from connected account
  // Idempotency: check if already processed
  const existing = await prisma.webhookEvent.findUnique({
    where: { id: event.id },
  })
  if (existing?.status === "PROCESSED") {
    return new NextResponse("Already processed", { status: 200 })
  }

  // Log the event
  await prisma.webhookEvent.upsert({
    where: { id: event.id },
    create: {
      id: event.id,
      type: event.type,
      appId: earlyAppId,
      payload: JSON.parse(body),
      status: "PENDING",
    },
    update: {},
  })

  try {
    const resolvedAppId = await handleStripeEvent(event, connectOpts)
    await prisma.webhookEvent.update({
      where: { id: event.id },
      data: {
        status: "PROCESSED",
        processedAt: new Date(),
        ...(resolvedAppId ? { appId: resolvedAppId } : {}),
      },
    })
  } catch (error: unknown) {
    Sentry.captureException(error)
    const message = error instanceof Error ? error.message : "Unknown error"
    await prisma.webhookEvent.update({
      where: { id: event.id },
      data: { status: "FAILED", error: message, ...(earlyAppId ? { appId: earlyAppId } : {}) },
    })
    return new NextResponse(`Webhook handler failed: ${message}`, { status: 500 })
  }

  return new NextResponse("OK", { status: 200 })
}
