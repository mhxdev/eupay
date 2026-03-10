import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { stripe } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"
import { logAuditEvent } from "@/lib/audit"
import { trackMilestone } from "@/lib/milestones"

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.redirect(new URL("/sign-in", req.url))
  }

  const code = req.nextUrl.searchParams.get("code")
  const appId = req.nextUrl.searchParams.get("state")

  if (!code || !appId) {
    return NextResponse.redirect(
      new URL("/dashboard/apps", req.url)
    )
  }

  const app = await prisma.app.findUnique({ where: { id: appId } })
  if (!app || app.clerkUserId !== userId) {
    return NextResponse.redirect(
      new URL("/dashboard/apps", req.url)
    )
  }

  // Exchange authorization code for connected account ID
  try {
    const response = await stripe.oauth.token({
      grant_type: "authorization_code",
      code,
    })

    const stripeUserId = response.stripe_user_id
    if (!stripeUserId) {
      throw new Error("No stripe_user_id in response")
    }

    await prisma.app.update({
      where: { id: appId },
      data: { stripeConnectId: stripeUserId },
    })

    await logAuditEvent({
      appId,
      userId,
      category: "stripe_connect",
      action: "connected",
      details: { stripeAccountId: stripeUserId },
    })

    await trackMilestone({ clerkUserId: userId, appId, milestone: "stripe_connected", details: { stripeAccountId: stripeUserId } })

    // Auto-sync any products created before Stripe was connected
    const unsyncedProducts = await prisma.product.findMany({
      where: { appId, syncedToStripe: false },
    })
    const connectOpts = { stripeAccount: stripeUserId }
    for (const product of unsyncedProducts) {
      try {
        const stripeProduct = await stripe.products.create({
          name: product.name,
          description: product.description || undefined,
          tax_code: "txcd_10103001",
          metadata: { appId, eupay: "true" },
        }, connectOpts)

        const priceParams: Stripe.PriceCreateParams = {
          product: stripeProduct.id,
          unit_amount: product.amountCents,
          currency: product.currency,
          metadata: { appId },
        }
        if (product.productType === "SUBSCRIPTION" && product.interval) {
          priceParams.recurring = {
            interval: product.interval as Stripe.PriceCreateParams.Recurring["interval"],
            interval_count: product.intervalCount || 1,
          }
        }
        const stripePrice = await stripe.prices.create(priceParams, connectOpts)

        await prisma.product.update({
          where: { id: product.id },
          data: {
            stripeProductId: stripeProduct.id,
            stripePriceId: stripePrice.id,
            syncedToStripe: true,
          },
        })
      } catch (err) {
        console.error(`[Stripe] Failed to sync product ${product.id}:`, err)
        // Don't block the OAuth callback — log and continue
      }
    }

    return NextResponse.redirect(
      new URL(`/dashboard/apps/${appId}?connected=true`, req.url)
    )
  } catch {
    return NextResponse.redirect(
      new URL(`/dashboard/apps/${appId}?connect_error=true`, req.url)
    )
  }
}
