import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

function escapeCSV(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return ""
  const str = String(val)
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId: adminId } = await auth()
  if (adminId !== process.env.ADMIN_CLERK_USER_ID) {
    return new NextResponse("Unauthorized", { status: 403 })
  }

  const { userId } = await params

  const apps = await prisma.app.findMany({
    where: { clerkUserId: userId },
    select: { id: true },
  })
  const appIds = apps.map((a) => a.id)

  const events = await prisma.auditEvent.findMany({
    where: { appId: { in: appIds } },
    orderBy: { createdAt: "desc" },
  })

  const header = ["timestamp", "category", "action", "resource_type", "resource_id", "details_json"]
    .map(escapeCSV)
    .join(",")

  const rows = events.map((e) =>
    [
      e.createdAt.toISOString(),
      e.category,
      e.action,
      e.resourceType,
      e.resourceId,
      e.details ? JSON.stringify(e.details) : "",
    ]
      .map(escapeCSV)
      .join(",")
  )

  const csv = [header, ...rows].join("\n")
  const now = new Date().toISOString().slice(0, 10)

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="europay-audit-${userId.slice(0, 8)}-${now}.csv"`,
    },
  })
}
