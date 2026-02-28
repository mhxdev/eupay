// GET /api/v1/entitlements/:userId
// Returns all active entitlements for an end-user.
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateRequest, isAuthError, authErrorResponse } from '@/lib/auth'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const auth = await authenticateRequest(req)
  if (isAuthError(auth)) return authErrorResponse(auth)

  const { userId } = await params
  const includeExpired = req.nextUrl.searchParams.get('includeExpired') === 'true'

  const customer = await prisma.customer.findUnique({
    where: { appId_externalUserId: { appId: auth.appId, externalUserId: userId } },
  })

  if (!customer) {
    return NextResponse.json({ userId, entitlements: [] })
  }

  const statusFilter = includeExpired
    ? undefined
    : { in: ['ACTIVE' as const, 'PAUSED' as const] }

  const entitlements = await prisma.entitlement.findMany({
    where: {
      customerId: customer.id,
      ...(statusFilter ? { status: statusFilter } : {}),
    },
    include: { product: true },
  })

  return NextResponse.json({
    userId,
    entitlements: entitlements.map((e) => ({
      id: e.id,
      productId: e.productId,
      appStoreProductId: e.product.appStoreProductId,
      status: e.status,
      currentPeriodEnd: e.currentPeriodEnd?.toISOString() ?? null,
      cancelAtPeriodEnd: e.cancelAtPeriodEnd,
    })),
  })
}
