import { NextRequest } from "next/server"
import { z } from "zod"
import { authenticateV2, isV2AuthError } from "@/lib/auth-v2"
import { v2Success, v2Error } from "@/lib/response-v2"
import { prisma } from "@/lib/prisma"

const eventSchema = z.object({
  type: z.string(),
  userId: z.string().optional(),
  productId: z.string().optional(),
  experimentId: z.string().optional(),
  campaignId: z.string().optional(),
  revenueCents: z.number().int().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  sdkVersion: z.string().optional(),
  iosVersion: z.string().optional(),
  deviceModel: z.string().optional(),
  locale: z.string().optional(),
  region: z.string().optional(),
  errorCode: z.string().optional(),
  errorMessage: z.string().optional(),
  durationMs: z.number().optional(),
})

const schema = z.object({
  events: z.array(eventSchema).min(1).max(50),
})

export async function POST(req: NextRequest) {
  const auth = await authenticateV2(req)
  if (isV2AuthError(auth)) {
    return v2Error(auth.error.code, auth.error.message, auth.meta.requestId, auth.status)
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return v2Error("invalid_body", "Invalid JSON body", auth.requestId, 400)
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return v2Error("validation_error", parsed.error.issues.map((e) => e.message).join(", "), auth.requestId, 400)
  }

  const { events } = parsed.data

  // Group events by type prefix for batch processing
  const campaignEvents: typeof events = []
  const experimentEvents: typeof events = []
  const telemetryEvents: typeof events = []
  const customEvents: typeof events = []

  for (const event of events) {
    if (event.type.startsWith("campaign.")) {
      campaignEvents.push(event)
    } else if (event.type.startsWith("experiment.")) {
      experimentEvents.push(event)
    } else if (event.type.startsWith("telemetry.")) {
      telemetryEvents.push(event)
    } else {
      customEvents.push(event)
    }
  }

  const promises: Promise<void>[] = []

  // Process campaign events
  if (campaignEvents.length > 0) {
    promises.push(
      (async () => {
        for (const event of campaignEvents) {
          if (!event.campaignId || !event.userId) continue

          const campaign = await prisma.migrationCampaign.findFirst({
            where: { id: event.campaignId, appId: auth.app.id },
            include: {
              productMappings: {
                include: {
                  euroPayProduct: { select: { id: true, amountCents: true } },
                },
              },
            },
          })
          if (!campaign) continue

          const mapping = campaign.productMappings[0]
          if (!mapping) continue

          const suffix = event.type.replace("campaign.", "")
          const euroPayPriceCents = mapping.euroPayProduct.amountCents
          const savingsCentsPerMonth = mapping.applePriceCents - euroPayPriceCents
          const savingsPercent = mapping.applePriceCents > 0
            ? (savingsCentsPerMonth / mapping.applePriceCents) * 100
            : 0

          const uniqueKey = {
            campaignId_userId_appleProductId: {
              campaignId: event.campaignId,
              userId: event.userId,
              appleProductId: mapping.appleProductId,
            },
          }

          const baseData = {
            campaignId: event.campaignId,
            appId: auth.app.id,
            userId: event.userId,
            appleProductId: mapping.appleProductId,
            applePriceCents: mapping.applePriceCents,
            euroPayProductId: mapping.euroPayProductId,
            euroPayPriceCents,
            savingsCentsPerMonth,
            savingsPercent,
          }

          const statusMap: Record<string, string> = {
            prompted: "PROMPTED",
            clicked: "CLICKED",
            dismissed: "DISMISSED",
            purchased: "PURCHASED",
            apple_cancelled: "APPLE_CANCELLED",
          }

          const status = statusMap[suffix]
          if (!status) continue

          const timestampField = suffix === "prompted" ? { promptedAt: new Date() }
            : suffix === "clicked" ? { clickedAt: new Date() }
            : suffix === "purchased" ? { purchasedAt: new Date() }
            : suffix === "apple_cancelled" ? { appleCancelledAt: new Date() }
            : {}

          // Special handling for apple_cancelled → check if should be COMPLETED
          let finalStatus = status
          if (suffix === "apple_cancelled") {
            const existing = await prisma.migrationEvent.findUnique({ where: uniqueKey })
            if (existing?.status === "PURCHASED") finalStatus = "COMPLETED"
          }

          await prisma.migrationEvent.upsert({
            where: uniqueKey,
            create: { ...baseData, status: finalStatus as "PROMPTED", ...timestampField },
            update: { status: finalStatus as "PROMPTED", ...timestampField },
          })
        }
      })()
    )
  }

  // Process experiment events
  if (experimentEvents.length > 0) {
    promises.push(
      (async () => {
        for (const event of experimentEvents) {
          if (!event.userId) continue

          const suffix = event.type.replace("experiment.", "")
          const experimentId = event.experimentId

          if (!experimentId) continue

          const assignment = await prisma.experimentAssignment.findUnique({
            where: { experimentId_userId: { experimentId, userId: event.userId } },
            include: { experiment: { select: { appId: true } } },
          })
          if (!assignment || assignment.experiment.appId !== auth.app.id) continue

          await prisma.experimentEvent.create({
            data: {
              experimentId,
              variantId: assignment.variantId,
              userId: event.userId,
              eventType: suffix,
              revenueCents: event.revenueCents,
              metadata: event.metadata ?? undefined,
            },
          })
        }
      })()
    )
  }

  // Process telemetry events — batch insert
  if (telemetryEvents.length > 0) {
    promises.push(
      (async () => {
        await prisma.sdkEvent.createMany({
          data: telemetryEvents.map((event) => ({
            appId: auth.app.id,
            eventType: event.type.replace("telemetry.", ""),
            sdkVersion: event.sdkVersion,
            iosVersion: event.iosVersion,
            deviceModel: event.deviceModel,
            locale: event.locale,
            region: event.region,
            productId: event.productId,
            userId: event.userId,
            errorCode: event.errorCode,
            errorMessage: event.errorMessage,
            durationMs: event.durationMs ? Math.round(event.durationMs) : undefined,
            metadata: event.metadata ?? undefined,
          })),
        })
      })()
    )
  }

  // Process custom events — batch insert into SdkEvent
  if (customEvents.length > 0) {
    promises.push(
      (async () => {
        await prisma.sdkEvent.createMany({
          data: customEvents.map((event) => ({
            appId: auth.app.id,
            eventType: event.type,
            sdkVersion: event.sdkVersion,
            iosVersion: event.iosVersion,
            deviceModel: event.deviceModel,
            locale: event.locale,
            region: event.region,
            productId: event.productId,
            userId: event.userId,
            errorCode: event.errorCode,
            errorMessage: event.errorMessage,
            durationMs: event.durationMs ? Math.round(event.durationMs) : undefined,
            metadata: event.metadata ?? undefined,
          })),
        })
      })()
    )
  }

  await Promise.all(promises)

  return v2Success({ received: events.length }, auth.requestId)
}
