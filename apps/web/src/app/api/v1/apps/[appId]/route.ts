import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { trackMilestone } from "@/lib/milestones"

const schema = z.object({
  webhookUrl: z.string().url().optional(),
  webhookSecret: z.string().optional(),
  dmaEntitlementConfirmed: z.boolean().optional(),
  appleKeyId: z.string().optional(),
  appleIssuerId: z.string().optional(),
  applePrivateKey: z.string().optional(),
  appleBundleId: z.string().optional(),
}).strict()

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
      { error: "Invalid fields", details: parsed.error.flatten() },
      { status: 422 }
    )
  }

  const updated = await prisma.app.update({
    where: { id: appId },
    data: parsed.data,
    select: {
      id: true,
      name: true,
      webhookUrl: true,
      webhookSecret: true,
      dmaEntitlementConfirmed: true,
    },
  })

  // Track milestones for key configuration steps
  if (parsed.data.webhookUrl) {
    await trackMilestone({ clerkUserId: userId, appId, milestone: "webhook_configured" })
  }
  if (parsed.data.appleKeyId && parsed.data.appleIssuerId && parsed.data.applePrivateKey) {
    await trackMilestone({ clerkUserId: userId, appId, milestone: "apple_credentials_uploaded" })
  }

  return NextResponse.json(updated)
}
