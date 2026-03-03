import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { z } from "zod"
import { createHmac, randomUUID } from "crypto"
import { prisma } from "@/lib/prisma"

const EVENT_TYPES = [
  "checkout.completed",
  "subscription.created",
  "subscription.cancelled",
  "subscription.paused",
  "subscription.resumed",
  "refund.completed",
  "entitlement.granted",
] as const

const schema = z.object({
  eventType: z.enum(EVENT_TYPES),
})

function buildMockPayload(eventType: string, appId: string) {
  const now = new Date().toISOString()
  const base = {
    id: `evt_test_${randomUUID().replace(/-/g, "").slice(0, 24)}`,
    type: eventType,
    created: now,
    livemode: false,
    appId,
  }

  switch (eventType) {
    case "checkout.completed":
      return {
        ...base,
        data: {
          checkoutSessionId: `cs_test_${randomUUID().slice(0, 8)}`,
          customerId: `cus_test_${randomUUID().slice(0, 8)}`,
          externalUserId: "user_12345",
          productId: `prod_test_${randomUUID().slice(0, 8)}`,
          amountTotal: 999,
          amountSubtotal: 840,
          amountTax: 159,
          currency: "eur",
          status: "SUCCEEDED",
        },
      }
    case "subscription.created":
      return {
        ...base,
        data: {
          subscriptionId: `sub_test_${randomUUID().slice(0, 8)}`,
          customerId: `cus_test_${randomUUID().slice(0, 8)}`,
          externalUserId: "user_12345",
          productId: `prod_test_${randomUUID().slice(0, 8)}`,
          status: "ACTIVE",
          currentPeriodStart: now,
          currentPeriodEnd: new Date(Date.now() + 30 * 86400000).toISOString(),
        },
      }
    case "subscription.cancelled":
      return {
        ...base,
        data: {
          subscriptionId: `sub_test_${randomUUID().slice(0, 8)}`,
          customerId: `cus_test_${randomUUID().slice(0, 8)}`,
          externalUserId: "user_12345",
          status: "CANCELLED",
          cancelledAt: now,
        },
      }
    case "subscription.paused":
      return {
        ...base,
        data: {
          subscriptionId: `sub_test_${randomUUID().slice(0, 8)}`,
          customerId: `cus_test_${randomUUID().slice(0, 8)}`,
          externalUserId: "user_12345",
          status: "PAUSED",
          pausedAt: now,
        },
      }
    case "subscription.resumed":
      return {
        ...base,
        data: {
          subscriptionId: `sub_test_${randomUUID().slice(0, 8)}`,
          customerId: `cus_test_${randomUUID().slice(0, 8)}`,
          externalUserId: "user_12345",
          status: "ACTIVE",
          resumedAt: now,
        },
      }
    case "refund.completed":
      return {
        ...base,
        data: {
          refundId: `re_test_${randomUUID().slice(0, 8)}`,
          transactionId: `txn_test_${randomUUID().slice(0, 8)}`,
          customerId: `cus_test_${randomUUID().slice(0, 8)}`,
          amountRefunded: 999,
          currency: "eur",
          reason: "requested_by_customer",
        },
      }
    case "entitlement.granted":
      return {
        ...base,
        data: {
          entitlementId: `ent_test_${randomUUID().slice(0, 8)}`,
          customerId: `cus_test_${randomUUID().slice(0, 8)}`,
          externalUserId: "user_12345",
          productId: `prod_test_${randomUUID().slice(0, 8)}`,
          status: "ACTIVE",
          source: "WEB_CHECKOUT",
        },
      }
    default:
      return base
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ appId: string }> }
) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { appId } = await params

  const app = await prisma.app.findUnique({
    where: { id: appId },
    select: {
      id: true,
      clerkUserId: true,
      webhookUrl: true,
      webhookSecret: true,
    },
  })
  if (!app || app.clerkUserId !== userId) {
    return NextResponse.json({ error: "App not found" }, { status: 404 })
  }

  if (!app.webhookUrl) {
    return NextResponse.json(
      { error: "No webhook URL configured" },
      { status: 422 }
    )
  }

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid event type" },
      { status: 422 }
    )
  }

  const payload = buildMockPayload(parsed.data.eventType, appId)
  const payloadString = JSON.stringify(payload)

  // Sign the payload
  const signature = app.webhookSecret
    ? createHmac("sha256", app.webhookSecret).update(payloadString).digest("hex")
    : ""

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": "EuroPay-Webhook/1.0",
  }
  if (signature) {
    headers["x-eupay-signature"] = signature
  }

  let statusCode = 0
  let responseBody = ""
  let error: string | null = null
  const startTime = Date.now()

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)

    const res = await fetch(app.webhookUrl, {
      method: "POST",
      headers,
      body: payloadString,
      signal: controller.signal,
    })

    clearTimeout(timeout)
    statusCode = res.status
    responseBody = await res.text().catch(() => "")

    if (!res.ok) {
      error = `HTTP ${res.status}`
    }
  } catch (e) {
    error = e instanceof Error ? e.message : "Request failed"
  }

  const responseTime = Date.now() - startTime
  const success = statusCode >= 200 && statusCode < 300

  // Save to WebhookEvent table
  await prisma.webhookEvent.create({
    data: {
      id: payload.id,
      type: parsed.data.eventType,
      appId,
      payload: payload as object,
      status: success ? "PROCESSED" : "FAILED",
      processedAt: new Date(),
      error,
    },
  })

  return NextResponse.json({
    success,
    statusCode,
    responseTime,
    responseBody: responseBody.slice(0, 2000),
  })
}
