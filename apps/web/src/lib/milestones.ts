import { prisma } from "./prisma"
import type { Prisma } from "@prisma/client"

export async function trackMilestone(params: {
  clerkUserId: string
  appId?: string
  milestone: string
  details?: Record<string, unknown>
}) {
  try {
    const existing = await prisma.developerMilestone.findFirst({
      where: {
        clerkUserId: params.clerkUserId,
        appId: params.appId ?? undefined,
        milestone: params.milestone,
      },
    })
    if (existing) return

    await prisma.developerMilestone.create({
      data: params as Prisma.DeveloperMilestoneUncheckedCreateInput,
    })
  } catch (error) {
    console.error("[Milestone] Tracking failed:", error)
  }
}
