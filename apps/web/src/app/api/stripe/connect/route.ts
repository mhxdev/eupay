import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { trackMilestone } from "@/lib/milestones"

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.redirect(new URL("/sign-in", req.url))
  }

  const appId = req.nextUrl.searchParams.get("appId")
  if (!appId) {
    return NextResponse.json({ error: "Missing appId" }, { status: 400 })
  }

  const app = await prisma.app.findUnique({ where: { id: appId } })
  if (!app || app.clerkUserId !== userId) {
    return NextResponse.json({ error: "App not found" }, { status: 404 })
  }

  const clientId = process.env.STRIPE_CONNECT_CLIENT_ID
  if (!clientId) {
    return NextResponse.json(
      { error: "Stripe Connect not configured" },
      { status: 500 }
    )
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/callback`

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    scope: "read_write",
    state: appId,
    redirect_uri: redirectUri,
  })

  await trackMilestone({ clerkUserId: userId, appId, milestone: "stripe_oauth_started" })

  return NextResponse.redirect(
    `https://connect.stripe.com/oauth/authorize?${params.toString()}`
  )
}
