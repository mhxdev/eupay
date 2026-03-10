import { NextRequest } from "next/server"
import { authenticateV2, isV2AuthError } from "@/lib/auth-v2"
import { v2Success, v2Error } from "@/lib/response-v2"
import { prisma } from "@/lib/prisma"

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function GET(req: NextRequest) {
  const auth = await authenticateV2(req)
  if (isV2AuthError(auth)) {
    return v2Error(auth.error.code, auth.error.message, auth.meta.requestId, auth.status)
  }

  const userId = req.nextUrl.searchParams.get("userId")
  if (!userId) {
    return v2Error("missing_parameter", "userId query parameter is required", auth.requestId, 400)
  }

  const awaitPending = req.nextUrl.searchParams.get("awaitPending") === "true"

  const customer = await prisma.customer.findUnique({
    where: { appId_externalUserId: { appId: auth.app.id, externalUserId: userId } },
  })

  if (!customer) {
    return v2Success({ entitlements: [] }, auth.requestId)
  }

  let entitlements = await prisma.entitlement.findMany({
    where: { customerId: customer.id },
    include: { product: { select: { id: true } } },
  })

  // If awaitPending and no ACTIVE entitlements, poll up to 5 times with 1s intervals
  if (awaitPending && !entitlements.some((e) => e.status === "ACTIVE")) {
    for (let i = 0; i < 5; i++) {
      await sleep(1000)
      entitlements = await prisma.entitlement.findMany({
        where: { customerId: customer.id },
        include: { product: { select: { id: true } } },
      })
      if (entitlements.some((e) => e.status === "ACTIVE")) break
    }
  }

  return v2Success({
    entitlements: entitlements.map((e) => ({
      productId: e.product.id,
      status: e.status.toLowerCase(),
      source: e.source.toLowerCase().replace("_", "_"),
      currentPeriodEnd: e.currentPeriodEnd?.toISOString() ?? null,
      cancelAtPeriodEnd: e.cancelAtPeriodEnd,
    })),
  }, auth.requestId)
}
