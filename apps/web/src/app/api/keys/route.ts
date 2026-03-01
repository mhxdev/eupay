import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generateApiKey } from "@/lib/auth"

// POST — generate a new API key for an app
export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const { appId } = body as { appId: string }

  if (!appId) {
    return NextResponse.json(
      { error: "appId is required" },
      { status: 422 }
    )
  }

  // Verify the app belongs to this user
  const app = await prisma.app.findUnique({ where: { id: appId } })
  if (!app || app.clerkUserId !== userId) {
    return NextResponse.json({ error: "App not found" }, { status: 404 })
  }

  const { raw, hash, prefix } = generateApiKey()

  await prisma.apiKey.create({
    data: {
      appId,
      keyHash: hash,
      keyPrefix: prefix,
      name: "Default",
    },
  })

  return NextResponse.json({ apiKey: raw })
}
