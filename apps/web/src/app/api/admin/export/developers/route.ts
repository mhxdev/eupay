import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { exportDevelopersCSV } from "@/lib/admin-exports"

export async function GET() {
  const { userId } = await auth()
  if (userId !== process.env.ADMIN_CLERK_USER_ID) {
    return new NextResponse("Unauthorized", { status: 403 })
  }

  const csv = await exportDevelopersCSV()
  const now = new Date().toISOString().slice(0, 10)

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="europay-developers-${now}.csv"`,
    },
  })
}
