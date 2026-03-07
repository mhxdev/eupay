// GET /api/v1/products/:appId
// Returns active products for an app. Called by the iOS SDK.
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateRequest, isAuthError, authErrorResponse } from '@/lib/auth'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  const auth = await authenticateRequest(req)
  if (isAuthError(auth)) return authErrorResponse(auth)

  const { appId } = await params

  // Ensure the API key belongs to the requested app
  if (auth.appId !== appId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const [products, activePromotions] = await Promise.all([
    prisma.product.findMany({
      where: { appId, isActive: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.promotion.findMany({
      where: {
        appId,
        status: 'ACTIVE',
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      select: {
        id: true,
        name: true,
        code: true,
        type: true,
        percentOff: true,
        amountOffCents: true,
        currency: true,
        trialDays: true,
        duration: true,
        durationInMonths: true,
        productId: true,
        expiresAt: true,
      },
    }),
  ])

  // Build a map of productId → promotion (product-specific first, then app-wide)
  const promoByProduct = new Map<string | null, typeof activePromotions[number]>()
  for (const promo of activePromotions) {
    // Only keep the first (most recent due to default ordering) per scope
    if (!promoByProduct.has(promo.productId)) {
      promoByProduct.set(promo.productId, promo)
    }
  }

  return NextResponse.json({
    products: products.map((p) => {
      // Product-specific promotion takes priority over app-wide
      const promo = promoByProduct.get(p.id) ?? promoByProduct.get(null) ?? null
      return {
        id: p.id,
        name: p.name,
        description: p.description,
        productType: p.productType,
        appStoreProductId: p.appStoreProductId,
        amountCents: p.amountCents,
        currency: p.currency,
        interval: p.interval,
        intervalCount: p.intervalCount,
        trialDays: p.trialDays ?? 0,
        preloadable: true,
        ...(promo ? {
          activePromotion: {
            id: promo.id,
            name: promo.name,
            code: promo.code,
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
    }),
  })
}
