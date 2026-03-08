import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { exportRevenueCSV } from "@/lib/admin-exports"

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (userId !== process.env.ADMIN_CLERK_USER_ID) {
    return new NextResponse("Unauthorized", { status: 403 })
  }

  const url = new URL(req.url)
  const startDate = url.searchParams.get("start") ? new Date(url.searchParams.get("start")!) : undefined
  const endDate = url.searchParams.get("end") ? new Date(url.searchParams.get("end")!) : undefined

  const csv = await exportRevenueCSV(startDate, endDate)
  const now = new Date().toISOString().slice(0, 10)

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="europay-revenue-${now}.csv"`,
    },
  })
}
