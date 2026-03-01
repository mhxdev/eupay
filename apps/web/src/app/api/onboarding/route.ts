import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET — check if current user already has an app (onboarding complete)
export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const app = await prisma.app.findFirst({
    where: { clerkUserId: userId },
    select: { id: true },
  })

  return NextResponse.json({ hasApp: !!app })
}

// POST — save onboarding data (create app)
export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const { appName, bundleId, revenueTier, plan } = body as {
    appName: string
    bundleId: string
    revenueTier: string
    plan: string
  }

  if (!appName || !bundleId || !revenueTier || !plan) {
    return NextResponse.json(
      { error: "appName, bundleId, revenueTier, and plan are required" },
      { status: 422 }
    )
  }

  // Check for duplicate bundle ID
  const existing = await prisma.app.findUnique({ where: { bundleId } })
  if (existing) {
    return NextResponse.json(
      { error: "An app with this bundle ID already exists" },
      { status: 409 }
    )
  }

  const app = await prisma.app.create({
    data: {
      name: appName,
      bundleId,
      clerkUserId: userId,
      revenueTier,
      plan,
    },
  })

  return NextResponse.json({ appId: app.id })
}
