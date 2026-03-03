import { auth, clerkClient } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// PATCH /api/dashboard/settings — update profile name
export async function PATCH(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: { name?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  if (body.name !== undefined) {
    const client = await clerkClient()
    await client.users.updateUser(userId, { firstName: body.name })
  }

  return NextResponse.json({ success: true })
}

// DELETE /api/dashboard/settings — delete entire account
export async function DELETE() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Delete all API keys for user's apps
  const apps = await prisma.app.findMany({
    where: { clerkUserId: userId },
    select: { id: true },
  })
  const appIds = apps.map((a) => a.id)

  if (appIds.length > 0) {
    await prisma.apiKey.deleteMany({ where: { appId: { in: appIds } } })
    await prisma.app.deleteMany({ where: { id: { in: appIds } } })
  }

  // Delete Clerk user
  const client = await clerkClient()
  await client.users.deleteUser(userId)

  return NextResponse.json({ success: true })
}
