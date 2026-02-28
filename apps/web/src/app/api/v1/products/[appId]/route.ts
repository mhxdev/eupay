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

  const products = await prisma.product.findMany({
    where: { appId, isActive: true },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json({
    products: products.map((p) => ({
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
    })),
  })
}
