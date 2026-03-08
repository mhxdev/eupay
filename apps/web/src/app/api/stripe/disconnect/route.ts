import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"
import { logAuditEvent } from "@/lib/audit"

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.redirect(new URL("/sign-in", req.url))
  }

  const appId = req.nextUrl.searchParams.get("appId")
  if (!appId) {
    return NextResponse.redirect(new URL("/dashboard/apps", req.url))
  }

  const app = await prisma.app.findUnique({ where: { id: appId } })
  if (!app || app.clerkUserId !== userId || !app.stripeConnectId) {
    return NextResponse.redirect(
      new URL(`/dashboard/apps/${appId}`, req.url)
    )
  }

  const previousStripeId = app.stripeConnectId

  const clientId = process.env.STRIPE_CONNECT_CLIENT_ID
  if (clientId) {
    try {
      await stripe.oauth.deauthorize({
        client_id: clientId,
        stripe_user_id: app.stripeConnectId,
      })
    } catch {
      // Continue even if deauthorize fails — still clear local reference
    }
  }

  await prisma.app.update({
    where: { id: appId },
    data: { stripeConnectId: null },
  })

  await logAuditEvent({
    appId,
    userId,
    category: "stripe_connect",
    action: "disconnected",
    details: { stripeAccountId: previousStripeId },
  })

  return NextResponse.redirect(
    new URL(`/dashboard/apps/${appId}`, req.url)
  )
}
