import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"

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

    return NextResponse.redirect(
      new URL(`/dashboard/apps/${appId}?connected=true`, req.url)
    )
  } catch {
    return NextResponse.redirect(
      new URL(`/dashboard/apps/${appId}?connect_error=true`, req.url)
    )
  }
}
