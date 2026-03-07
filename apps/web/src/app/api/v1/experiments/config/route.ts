// GET /api/v1/experiments/config?userId=X
// Returns the user's experiment variant assignments for all running experiments.
import { NextRequest, NextResponse } from "next/server"
import { createHash } from "crypto"
import { prisma } from "@/lib/prisma"
import { authenticateRequest, isAuthError, authErrorResponse } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req)
  if (isAuthError(auth)) return authErrorResponse(auth)

  const userId = req.nextUrl.searchParams.get("userId")
  if (!userId) {
    return NextResponse.json({ error: "userId query parameter is required" }, { status: 400 })
  }

  const now = new Date()

  // Find all RUNNING experiments for this app within schedule
  const experiments = await prisma.experiment.findMany({
    where: {
      appId: auth.appId,
      status: "RUNNING",
      OR: [{ startDate: null }, { startDate: { lte: now } }],
      AND: [{ OR: [{ endDate: null }, { endDate: { gte: now } }] }],
    },
    include: {
      variants: { orderBy: { createdAt: "asc" } },
      assignments: { where: { userId } },
    },
  })

  // Check targeting: if targetNewUsersOnly, check for existing transactions
  let hasTransactions: boolean | null = null

  const results: {
    id: string
    name: string
    placement: string
    variant: {
      id: string
      name: string
      config: unknown
    }
  }[] = []

  for (const experiment of experiments) {
    // Targeting: new users only
    if (experiment.targetNewUsersOnly) {
      if (hasTransactions === null) {
        const customer = await prisma.customer.findUnique({
          where: { appId_externalUserId: { appId: auth.appId, externalUserId: userId } },
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
        results.push({
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

    // Create assignment
    await prisma.experimentAssignment.create({
      data: {
        experimentId: experiment.id,
        variantId: assignedVariant.id,
        userId,
      },
    })

    results.push({
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

  return NextResponse.json({ experiments: results })
}
