// GET /api/v1/campaigns/active
// Returns active migration campaigns for the SDK.
// Called on app launch to check if the user should see a Switch & Save offer.
import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { prisma } from '@/lib/prisma'
import { authenticateRequest, isAuthError, authErrorResponse } from '@/lib/auth'

function formatCurrency(cents: number, currency: string) {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(cents / 100)
}

/**
 * Deterministic rollout hash: same userId + campaignId always returns
 * the same 0-99 value.
 */
function rolloutHash(userId: string, campaignId: string): number {
  const hash = createHash('sha256')
    .update(`${userId}:${campaignId}`)
    .digest()
  // Use first 4 bytes as a uint32, mod 100
  return hash.readUInt32BE(0) % 100
}

export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req)
  if (isAuthError(auth)) return authErrorResponse(auth)

  const userId = req.nextUrl.searchParams.get('userId')
  if (!userId) {
    return NextResponse.json({ error: 'userId query parameter is required' }, { status: 400 })
  }

  const now = new Date()

  const campaigns = await prisma.migrationCampaign.findMany({
    where: {
      appId: auth.appId,
      status: 'ACTIVE',
      OR: [
        { startDate: null },
        { startDate: { lte: now } },
      ],
    },
    include: {
      productMappings: {
        include: {
          euroPayProduct: { select: { name: true, amountCents: true, currency: true } },
        },
      },
    },
  })

  // Filter: endDate not passed, rollout check, not already completed
  const completedCampaignIds = new Set(
    (await prisma.migrationEvent.findMany({
      where: {
        appId: auth.appId,
        userId,
        status: { in: ['COMPLETED', 'PURCHASED'] },
      },
      select: { campaignId: true },
    })).map((e) => e.campaignId)
  )

  const eligible = campaigns.filter((c) => {
    // End date check
    if (c.endDate && c.endDate < now) return false
    // Rollout check
    if (rolloutHash(userId, c.id) >= c.rolloutPercent) return false
    // Already completed
    if (completedCampaignIds.has(c.id)) return false
    return true
  })

  return NextResponse.json({
    campaigns: eligible.map((c) => ({
      id: c.id,
      title: c.title,
      subtitle: c.subtitle,
      ctaText: c.ctaText,
      discountPercent: c.discountPercent,
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
          savingsPerYear: formatCurrency(savingsCentsPerMonth * 12, m.euroPayProduct.currency),
        }
      }),
    })),
  })
}
