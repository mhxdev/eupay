import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  let dbStatus: "ok" | "error" = "ok"

  try {
    await prisma.$queryRaw`SELECT 1`
  } catch {
    dbStatus = "error"
  }

  const allOk = dbStatus === "ok"

  return NextResponse.json(
    {
      status: allOk ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      services: {
        db: dbStatus,
      },
    },
    { status: allOk ? 200 : 503 }
  )
}
