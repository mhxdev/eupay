import { prisma } from "./prisma"
import type { Prisma } from "@prisma/client"

export async function createAlert(params: {
  severity: "CRITICAL" | "WARNING" | "INFO"
  category: string
  title: string
  description: string
  appId?: string
  developerUserId?: string
  resourceType?: string
  resourceId?: string
}) {
  try {
    // Deduplicate: don't create duplicate open alerts for the same resource
    if (params.resourceType && params.resourceId) {
      const existing = await prisma.platformAlert.findFirst({
        where: {
          resourceType: params.resourceType,
          resourceId: params.resourceId,
          status: "OPEN",
        },
      })
      if (existing) return
    }

    await prisma.platformAlert.create({
      data: params as Prisma.PlatformAlertUncheckedCreateInput,
    })
  } catch (error) {
    console.error("[Alert] Creation failed:", error)
  }
}
