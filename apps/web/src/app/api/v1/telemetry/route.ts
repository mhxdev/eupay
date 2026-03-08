// POST /api/v1/telemetry
// Lightweight endpoint for the iOS SDK to report analytics events.
// No auth required — validates appId exists. Collects NO PII.
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { telemetryRateLimit } from "@/lib/rate-limit"

const telemetryEventSchema = z.object({
  eventType: z.string(),
  sdkVersion: z.string().optional(),
  iosVersion: z.string().optional(),
  deviceModel: z.string().optional(),
  locale: z.string().optional(),
  region: z.string().optional(),
  productId: z.string().optional(),
  userId: z.string().optional(),
  errorCode: z.string().optional(),
  errorMessage: z.string().max(500).optional(),
  durationMs: z.number().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  timestamp: z.string().optional(),
})

const telemetrySchema = z.object({
  appId: z.string().min(1),
  events: z.array(telemetryEventSchema).max(50),
})

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = telemetrySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { appId, events } = parsed.data

  // Rate limit: 100 requests per minute per appId
  if (telemetryRateLimit) {
    const { success } = await telemetryRateLimit.limit(appId)
    if (!success) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
    }
  }

  // Validate appId exists
  const app = await prisma.app.findUnique({
    where: { id: appId },
    select: { id: true },
  })
  if (!app) {
    return NextResponse.json({ error: "Invalid appId" }, { status: 404 })
  }

  // Batch-insert all events (fire-and-forget style — don't fail the request)
  try {
    await prisma.sdkEvent.createMany({
      data: events.map((e) => ({
        appId,
        eventType: e.eventType,
        sdkVersion: e.sdkVersion,
        iosVersion: e.iosVersion,
        deviceModel: e.deviceModel,
        locale: e.locale,
        region: e.region,
        productId: e.productId,
        userId: e.userId,
        errorCode: e.errorCode,
        errorMessage: e.errorMessage,
        durationMs: e.durationMs,
        metadata: (e.metadata as Prisma.InputJsonValue) ?? undefined,
        ...(e.timestamp ? { createdAt: new Date(e.timestamp) } : {}),
      })),
    })
  } catch (err) {
    console.error("[Telemetry] Batch insert failed:", err)
    return NextResponse.json({ error: "Failed to store events" }, { status: 500 })
  }

  return NextResponse.json({ success: true, received: events.length })
}
