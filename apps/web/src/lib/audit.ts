import { prisma } from "./prisma"
import type { Prisma } from "@prisma/client"

export async function logAuditEvent(params: {
  appId?: string
  userId?: string
  category: string
  action: string
  resourceType?: string
  resourceId?: string
  details?: Record<string, unknown>
}) {
  try {
    await prisma.auditEvent.create({
      data: params as Prisma.AuditEventUncheckedCreateInput,
    })
  } catch (error) {
    // Audit logging must never break the main flow
    console.error("[Audit] Log failed:", error)
  }
}
