// GET /api/v1/gdpr/export?userId=xxx
// Returns all data held for a given user as JSON (GDPR Art. 15 + Art. 20).
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateRequest, isAuthError, authErrorResponse } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req)
  if (isAuthError(auth)) return authErrorResponse(auth)

  const userId = req.nextUrl.searchParams.get('userId')
  if (!userId) {
    return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 })
  }

  const customer = await prisma.customer.findUnique({
    where: { appId_externalUserId: { appId: auth.appId, externalUserId: userId } },
    include: {
      entitlements: { include: { product: true } },
      transactions: true,
    },
  })

  if (!customer) {
    return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
  }

  // Log GDPR export action
  await prisma.gdprAuditLog.create({
    data: {
      appId: auth.appId,
      action: "EXPORT",
      userId,
      requestedBy: auth.app.clerkUserId,
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    },
  })

  // Redact Stripe internal IDs from the export, keep payment amounts and dates
  return NextResponse.json({
    customer: {
      externalUserId: customer.externalUserId,
      email: customer.email,
      name: customer.name,
      countryCode: customer.countryCode,
      gdprConsentAt: customer.gdprConsentAt,
      createdAt: customer.createdAt,
    },
    entitlements: customer.entitlements.map((e) => ({
      productName: e.product.name,
      status: e.status,
      source: e.source,
      currentPeriodEnd: e.currentPeriodEnd,
      cancelAtPeriodEnd: e.cancelAtPeriodEnd,
      createdAt: e.createdAt,
    })),
    transactions: customer.transactions.map((t) => ({
      amountTotal: t.amountTotal,
      amountSubtotal: t.amountSubtotal,
      amountTax: t.amountTax,
      vatRate: t.vatRate,
      vatCountry: t.vatCountry,
      currency: t.currency,
      status: t.status,
      createdAt: t.createdAt,
    })),
  })
}
