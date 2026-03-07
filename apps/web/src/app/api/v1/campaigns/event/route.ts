// POST /api/v1/campaigns/event
// Records migration funnel events from the SDK.
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { authenticateRequest, isAuthError, authErrorResponse } from '@/lib/auth'

const eventSchema = z.object({
  campaignId: z.string(),
  userId: z.string(),
  event: z.enum(['prompted', 'clicked', 'dismissed', 'purchased', 'apple_cancelled']),
  appleProductId: z.string().optional(),
  metadata: z.record(z.string(), z.string()).optional(),
})

export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req)
  if (isAuthError(auth)) return authErrorResponse(auth)

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = eventSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { campaignId, userId, event, appleProductId } = parsed.data

  // Verify campaign belongs to this app
  const campaign = await prisma.migrationCampaign.findFirst({
    where: { id: campaignId, appId: auth.appId },
    include: {
      productMappings: {
        include: {
          euroPayProduct: { select: { id: true, amountCents: true } },
        },
      },
    },
  })
  if (!campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
  }

  // Find the product mapping for this apple product
  const mapping = appleProductId
    ? campaign.productMappings.find((m) => m.appleProductId === appleProductId)
    : campaign.productMappings[0]

  if (!mapping) {
    return NextResponse.json({ error: 'No matching product mapping found' }, { status: 404 })
  }

  const euroPayPriceCents = mapping.euroPayProduct.amountCents
  const savingsCentsPerMonth = mapping.applePriceCents - euroPayPriceCents
  const savingsPercent = mapping.applePriceCents > 0
    ? (savingsCentsPerMonth / mapping.applePriceCents) * 100
    : 0

  // Upsert keyed by (campaignId + userId + appleProductId) to prevent duplicates
  const uniqueKey = {
    campaignId_userId_appleProductId: {
      campaignId,
      userId,
      appleProductId: mapping.appleProductId,
    },
  }

  const baseData = {
    campaignId,
    appId: auth.appId,
    userId,
    appleProductId: mapping.appleProductId,
    applePriceCents: mapping.applePriceCents,
    euroPayProductId: mapping.euroPayProductId,
    euroPayPriceCents,
    savingsCentsPerMonth,
    savingsPercent,
  }

  switch (event) {
    case 'prompted': {
      await prisma.migrationEvent.upsert({
        where: uniqueKey,
        create: { ...baseData, status: 'PROMPTED', promptedAt: new Date() },
        update: { status: 'PROMPTED', promptedAt: new Date() },
      })
      break
    }
    case 'clicked': {
      await prisma.migrationEvent.upsert({
        where: uniqueKey,
        create: { ...baseData, status: 'CLICKED', clickedAt: new Date() },
        update: { status: 'CLICKED', clickedAt: new Date() },
      })
      break
    }
    case 'dismissed': {
      await prisma.migrationEvent.upsert({
        where: uniqueKey,
        create: { ...baseData, status: 'DISMISSED' },
        update: { status: 'DISMISSED' },
      })
      break
    }
    case 'purchased': {
      // Find the EuroPay transaction for this user+product
      const customer = await prisma.customer.findUnique({
        where: { appId_externalUserId: { appId: auth.appId, externalUserId: userId } },
      })
      let transactionId: string | undefined
      if (customer) {
        const tx = await prisma.transaction.findFirst({
          where: {
            customerId: customer.id,
            productId: mapping.euroPayProductId,
            status: 'SUCCEEDED',
          },
          orderBy: { createdAt: 'desc' },
        })
        transactionId = tx?.id
      }

      await prisma.migrationEvent.upsert({
        where: uniqueKey,
        create: { ...baseData, status: 'PURCHASED', purchasedAt: new Date(), transactionId },
        update: { status: 'PURCHASED', purchasedAt: new Date(), transactionId },
      })
      break
    }
    case 'apple_cancelled': {
      // Check current status — if already PURCHASED, promote to COMPLETED
      const existing = await prisma.migrationEvent.findUnique({ where: uniqueKey })
      const newStatus = existing?.status === 'PURCHASED' ? 'COMPLETED' : 'APPLE_CANCELLED'

      await prisma.migrationEvent.upsert({
        where: uniqueKey,
        create: { ...baseData, status: newStatus as 'APPLE_CANCELLED' | 'COMPLETED', appleCancelledAt: new Date() },
        update: { status: newStatus, appleCancelledAt: new Date() },
      })
      break
    }
  }

  return NextResponse.json({ success: true })
}
