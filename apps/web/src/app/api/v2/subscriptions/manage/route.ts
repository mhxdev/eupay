import { NextRequest } from "next/server"
import { z } from "zod"
import jwt from "jsonwebtoken"
import { authenticateV2, isV2AuthError } from "@/lib/auth-v2"
import { v2Success, v2Error } from "@/lib/response-v2"
import { prisma } from "@/lib/prisma"
import { stripe } from "@/lib/stripe"

const schema = z.object({
  userId: z.string(),
  productId: z.string().optional(),
  subscriptionId: z.string().optional(),
  action: z.enum(["cancel", "pause", "resume", "portal"]),
  pauseDays: z.number().int().min(1).max(90).optional(),
})

export async function POST(req: NextRequest) {
  const auth = await authenticateV2(req)
  if (isV2AuthError(auth)) {
    return v2Error(auth.error.code, auth.error.message, auth.meta.requestId, auth.status)
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return v2Error("invalid_body", "Invalid JSON body", auth.requestId, 400)
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return v2Error("validation_error", parsed.error.issues.map((e) => e.message).join(", "), auth.requestId, 400)
  }

  const { userId, productId, subscriptionId, action, pauseDays } = parsed.data

  if (!auth.app.stripeConnectId) {
    return v2Error("no_stripe_account", "No Stripe account connected", auth.requestId, 400)
  }

  const connectOpts = { stripeAccount: auth.app.stripeConnectId }

  // Find the customer
  const customer = await prisma.customer.findUnique({
    where: { appId_externalUserId: { appId: auth.app.id, externalUserId: userId } },
  })
  if (!customer) {
    return v2Error("customer_not_found", "Customer not found", auth.requestId, 404)
  }

  // Find the entitlement
  let entitlement
  if (subscriptionId) {
    entitlement = await prisma.entitlement.findUnique({
      where: { stripeSubscriptionId: subscriptionId },
      include: { product: true },
    })
  } else if (productId) {
    entitlement = await prisma.entitlement.findFirst({
      where: { customerId: customer.id, productId, status: { in: ["ACTIVE", "PAUSED"] } },
      include: { product: true },
    })
  }

  if (!entitlement) {
    return v2Error("entitlement_not_found", "No active subscription found for this user and product", auth.requestId, 404)
  }

  if (!entitlement.stripeSubscriptionId) {
    return v2Error("not_subscription", "This entitlement is not a subscription", auth.requestId, 400)
  }

  // Verify customer belongs to this app
  if (customer.appId !== auth.app.id) {
    return v2Error("forbidden", "Customer does not belong to this app", auth.requestId, 403)
  }

  switch (action) {
    case "cancel": {
      // Check if retention is enabled
      const retentionConfig = await prisma.retentionConfig.findUnique({
        where: { appId: auth.app.id },
      })

      if (retentionConfig?.enabled) {
        // Generate JWT for retention flow
        const token = jwt.sign(
          {
            appId: auth.app.id,
            userId,
            customerId: customer.id,
            subscriptionId: entitlement.stripeSubscriptionId,
          },
          process.env.JWT_SECRET || "europay-secret",
          { expiresIn: "1h" }
        )

        return v2Success({
          action: "retention",
          url: `${process.env.NEXT_PUBLIC_APP_URL || "https://europay.dev"}/cancel/${token}`,
        }, auth.requestId)
      }

      // Direct cancellation
      await stripe.subscriptions.update(entitlement.stripeSubscriptionId, {
        cancel_at_period_end: true,
      }, connectOpts)

      await prisma.entitlement.update({
        where: { id: entitlement.id },
        data: { cancelAtPeriodEnd: true },
      })

      // Create cancel event
      await prisma.cancelEvent.create({
        data: {
          appId: auth.app.id,
          customerId: customer.id,
          entitlementId: entitlement.id,
          stripeSubscriptionId: entitlement.stripeSubscriptionId,
          outcome: "CANCELLED",
        },
      })

      return v2Success({
        action: "cancelled",
        accessUntil: entitlement.currentPeriodEnd?.toISOString() ?? null,
      }, auth.requestId)
    }

    case "pause": {
      if (entitlement.status !== "ACTIVE") {
        return v2Error("invalid_status", "Can only pause active subscriptions", auth.requestId, 400)
      }

      const days = pauseDays ?? 30
      const resumesAt = new Date(Date.now() + days * 86400 * 1000)

      await stripe.subscriptions.update(entitlement.stripeSubscriptionId, {
        pause_collection: {
          behavior: "mark_uncollectible",
          resumes_at: Math.floor(resumesAt.getTime() / 1000),
        },
      }, connectOpts)

      await prisma.entitlement.update({
        where: { id: entitlement.id },
        data: { status: "PAUSED" },
      })

      return v2Success({
        action: "paused",
        resumesAt: resumesAt.toISOString(),
      }, auth.requestId)
    }

    case "resume": {
      if (entitlement.status !== "PAUSED") {
        return v2Error("invalid_status", "Can only resume paused subscriptions", auth.requestId, 400)
      }

      await stripe.subscriptions.update(entitlement.stripeSubscriptionId, {
        pause_collection: "" as unknown as null,
      }, connectOpts)

      await prisma.entitlement.update({
        where: { id: entitlement.id },
        data: { status: "ACTIVE" },
      })

      return v2Success({ action: "resumed" }, auth.requestId)
    }

    case "portal": {
      if (customer.stripeCustomerId.startsWith("pending_") || customer.stripeCustomerId.startsWith("deleted_")) {
        return v2Error("no_stripe_customer", "Customer has no Stripe account", auth.requestId, 400)
      }

      const portalSession = await stripe.billingPortal.sessions.create({
        customer: customer.stripeCustomerId,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL || "https://europay.dev"}/dashboard`,
      }, connectOpts)

      return v2Success({
        action: "portal",
        url: portalSession.url,
      }, auth.requestId)
    }
  }
}
