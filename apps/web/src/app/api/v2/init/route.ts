import { NextRequest } from "next/server"
import { createHash } from "crypto"
import { authenticateV2, isV2AuthError } from "@/lib/auth-v2"
import { v2Success, v2Error } from "@/lib/response-v2"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const auth = await authenticateV2(req)
  if (isV2AuthError(auth)) {
    return v2Error(auth.error.code, auth.error.message, auth.meta.requestId, auth.status)
  }

  const userId = req.nextUrl.searchParams.get("userId")
  if (!userId) {
    return v2Error("missing_parameter", "userId query parameter is required", auth.requestId, 400)
  }

  const fieldsParam = req.nextUrl.searchParams.get("fields")
  const allFields = ["products", "entitlements", "experiments", "campaigns"]
  const requestedFields = fieldsParam
    ? fieldsParam.split(",").map((f) => f.trim()).filter((f) => allFields.includes(f))
    : allFields

  const result: Record<string, unknown> = {}

  // Find or create customer (needed for entitlements)
  let customerId: string | null = null
  if (requestedFields.includes("entitlements") || requestedFields.includes("campaigns")) {
    const customer = await prisma.customer.upsert({
      where: { appId_externalUserId: { appId: auth.app.id, externalUserId: userId } },
      create: {
        appId: auth.app.id,
        externalUserId: userId,
        stripeCustomerId: `pending_${auth.app.id}_${userId}`,
      },
      update: {},
    })
    customerId = customer.id
  }

  // Execute queries in parallel (max 4)
  const queries: Promise<void>[] = []

  // Products
  if (requestedFields.includes("products")) {
    queries.push(
      (async () => {
        const [products, activePromotions] = await Promise.all([
          prisma.product.findMany({
            where: { appId: auth.app.id, isActive: true },
            orderBy: { createdAt: "asc" },
          }),
          prisma.promotion.findMany({
            where: {
              appId: auth.app.id,
              status: "ACTIVE",
              code: null, // non-code promotions only (auto-applied)
              OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
            },
            select: {
              id: true, name: true, type: true, percentOff: true,
              amountOffCents: true, currency: true, trialDays: true,
              duration: true, durationInMonths: true, productId: true,
              expiresAt: true,
            },
          }),
        ])

        // Build promo map: product-specific takes priority over app-wide
        const promoByProduct = new Map<string | null, typeof activePromotions[number]>()
        for (const promo of activePromotions) {
          if (!promoByProduct.has(promo.productId)) {
            promoByProduct.set(promo.productId, promo)
          }
        }

        result.products = products.map((p) => {
          const promo = promoByProduct.get(p.id) ?? promoByProduct.get(null) ?? null
          return {
            id: p.id,
            name: p.name,
            description: p.description,
            type: p.productType,
            amountCents: p.amountCents,
            currency: p.currency,
            interval: p.interval,
            trialDays: p.trialDays ?? 0,
            ...(promo ? {
              activePromotion: {
                id: promo.id,
                name: promo.name,
                type: promo.type,
                percentOff: promo.percentOff,
                amountOffCents: promo.amountOffCents,
                trialDays: promo.trialDays,
                duration: promo.duration,
                durationInMonths: promo.durationInMonths,
                expiresAt: promo.expiresAt?.toISOString() ?? null,
              },
            } : {}),
          }
        })
      })()
    )
  }

  // Entitlements
  if (requestedFields.includes("entitlements")) {
    queries.push(
      (async () => {
        if (!customerId) {
          result.entitlements = []
          return
        }
        const entitlements = await prisma.entitlement.findMany({
          where: { customerId },
          include: { product: { select: { id: true } } },
        })
        result.entitlements = entitlements.map((e) => ({
          productId: e.product.id,
          status: e.status.toLowerCase(),
          source: e.source.toLowerCase().replace("_", "_"),
          currentPeriodEnd: e.currentPeriodEnd?.toISOString() ?? null,
          cancelAtPeriodEnd: e.cancelAtPeriodEnd,
        }))
      })()
    )
  }

  // Experiments
  if (requestedFields.includes("experiments")) {
    queries.push(
      (async () => {
        const now = new Date()
        const experiments = await prisma.experiment.findMany({
          where: {
            appId: auth.app.id,
            status: "RUNNING",
            OR: [{ startDate: null }, { startDate: { lte: now } }],
            AND: [{ OR: [{ endDate: null }, { endDate: { gte: now } }] }],
          },
          include: {
            variants: { orderBy: { createdAt: "asc" } },
            assignments: { where: { userId } },
          },
        })

        let hasTransactions: boolean | null = null
        const experimentResults: {
          id: string
          name: string
          placement: string
          variant: { id: string; name: string; config: unknown }
        }[] = []

        for (const experiment of experiments) {
          // Targeting: new users only
          if (experiment.targetNewUsersOnly) {
            if (hasTransactions === null) {
              const customer = await prisma.customer.findUnique({
                where: { appId_externalUserId: { appId: auth.app.id, externalUserId: userId } },
              })
              if (customer) {
                const txCount = await prisma.transaction.count({
                  where: { customerId: customer.id, status: "SUCCEEDED" },
                })
                hasTransactions = txCount > 0
              } else {
                hasTransactions = false
              }
            }
            if (hasTransactions) continue
          }

          // Check for existing assignment
          const existing = experiment.assignments[0]
          if (existing) {
            const variant = experiment.variants.find((v) => v.id === existing.variantId)
            if (variant) {
              experimentResults.push({
                id: experiment.id,
                name: experiment.name,
                placement: experiment.placement,
                variant: { id: variant.id, name: variant.name, config: variant.config },
              })
            }
            continue
          }

          // Deterministic assignment via SHA-256
          const hash = createHash("sha256").update(`${userId}:${experiment.id}`).digest()
          const bucket = hash.readUInt16BE(0) % 100

          let cumulative = 0
          let assignedVariant = experiment.variants[0]
          for (const variant of experiment.variants) {
            cumulative += variant.allocationPercent
            if (bucket < cumulative) {
              assignedVariant = variant
              break
            }
          }

          if (!assignedVariant) continue

          await prisma.experimentAssignment.create({
            data: {
              experimentId: experiment.id,
              variantId: assignedVariant.id,
              userId,
            },
          })

          experimentResults.push({
            id: experiment.id,
            name: experiment.name,
            placement: experiment.placement,
            variant: {
              id: assignedVariant.id,
              name: assignedVariant.name,
              config: assignedVariant.config,
            },
          })
        }

        result.experiments = experimentResults
      })()
    )
  }

  // Campaigns
  if (requestedFields.includes("campaigns")) {
    queries.push(
      (async () => {
        const now = new Date()
        const campaigns = await prisma.migrationCampaign.findMany({
          where: {
            appId: auth.app.id,
            status: "ACTIVE",
            OR: [{ startDate: null }, { startDate: { lte: now } }],
          },
          include: {
            productMappings: {
              include: {
                euroPayProduct: { select: { name: true, amountCents: true, currency: true } },
              },
            },
          },
        })

        // Filter out completed campaigns for this user
        const completedCampaignIds = new Set(
          (await prisma.migrationEvent.findMany({
            where: {
              appId: auth.app.id,
              userId,
              status: { in: ["COMPLETED", "PURCHASED"] },
            },
            select: { campaignId: true },
          })).map((e) => e.campaignId)
        )

        const eligible = campaigns.filter((c) => {
          if (c.endDate && c.endDate < now) return false
          // Rollout check
          const hash = createHash("sha256").update(`${userId}:${c.id}`).digest()
          const rollout = hash.readUInt32BE(0) % 100
          if (rollout >= c.rolloutPercent) return false
          if (completedCampaignIds.has(c.id)) return false
          return true
        })

        result.campaigns = eligible.map((c) => ({
          id: c.id,
          title: c.title,
          subtitle: c.subtitle,
          ctaText: c.ctaText,
          productMappings: c.productMappings.map((m) => {
            const euroPayPriceCents = m.euroPayProduct.amountCents
            const savingsCentsPerMonth = m.applePriceCents - euroPayPriceCents
            const savingsPercent = m.applePriceCents > 0
              ? Math.round((savingsCentsPerMonth / m.applePriceCents) * 100)
              : 0
            return {
              appleProductId: m.appleProductId,
              appleProductName: m.appleProductName,
              applePriceCents: m.applePriceCents,
              euroPayProductId: m.euroPayProductId,
              euroPayProductName: m.euroPayProduct.name,
              euroPayPriceCents,
              savingsCentsPerMonth,
              savingsPercent,
            }
          }),
        }))
      })()
    )
  }

  await Promise.all(queries)

  return v2Success(result, auth.requestId)
}
