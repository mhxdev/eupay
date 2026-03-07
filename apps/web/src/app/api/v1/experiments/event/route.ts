// POST /api/v1/experiments/event
// Records experiment events (views, purchases, custom events).
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { authenticateRequest, isAuthError, authErrorResponse } from "@/lib/auth"

const schema = z.object({
  experimentId: z.string(),
  userId: z.string(),
  eventType: z.string(),
  revenueCents: z.number().int().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
})

export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req)
  if (isAuthError(auth)) return authErrorResponse(auth)

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { experimentId, userId, eventType, revenueCents, metadata } = parsed.data

  // Look up the user's assignment
  const assignment = await prisma.experimentAssignment.findUnique({
    where: { experimentId_userId: { experimentId, userId } },
    include: { experiment: { select: { appId: true } } },
  })

  if (!assignment) {
    return NextResponse.json(
      { error: "User is not assigned to this experiment" },
      { status: 400 }
    )
  }

  // Verify experiment belongs to this app
  if (assignment.experiment.appId !== auth.appId) {
    return NextResponse.json({ error: "Experiment not found" }, { status: 404 })
  }

  await prisma.experimentEvent.create({
    data: {
      experimentId,
      variantId: assignment.variantId,
      userId,
      eventType,
      revenueCents,
      metadata: metadata ?? undefined,
    },
  })

  return NextResponse.json({ success: true })
}
