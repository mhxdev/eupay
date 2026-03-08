import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { trackMilestone } from "@/lib/milestones"

const schema = z.object({
  mode: z.enum(["sandbox", "live"]),
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ appId: string }> }
) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { appId } = await params

  const app = await prisma.app.findUnique({ where: { id: appId } })
  if (!app || app.clerkUserId !== userId) {
    return NextResponse.json({ error: "App not found" }, { status: 404 })
  }

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid mode. Must be 'sandbox' or 'live'." },
      { status: 422 }
    )
  }

  const updated = await prisma.app.update({
    where: { id: appId },
    data: { mode: parsed.data.mode },
    select: { id: true, name: true, mode: true },
  })

  if (parsed.data.mode === "live") {
    await trackMilestone({ clerkUserId: userId, appId, milestone: "mode_switched_live" })
  }

  return NextResponse.json(updated)
}
