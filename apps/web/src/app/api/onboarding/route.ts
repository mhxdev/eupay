import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createApp } from "@/lib/actions"

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
  const { appName, bundleId } = body as {
    appName: string
    bundleId: string
  }

  if (!appName || !bundleId) {
    return NextResponse.json(
      { error: "appName and bundleId are required" },
      { status: 400 }
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

  // Use the createApp server action which now generates test + live keys
  const formData = new FormData()
  formData.set("name", appName)
  formData.set("bundleId", bundleId)

  try {
    const result = await createApp(formData)
    return NextResponse.json({
      appId: result.appId,
      testApiKey: result.testApiKey,
      liveApiKey: result.liveApiKey,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create app"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
