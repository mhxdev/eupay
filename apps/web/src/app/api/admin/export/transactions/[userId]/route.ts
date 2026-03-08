import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { exportDeveloperTransactionsCSV } from "@/lib/admin-exports"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId: adminId } = await auth()
  if (adminId !== process.env.ADMIN_CLERK_USER_ID) {
    return new NextResponse("Unauthorized", { status: 403 })
  }

  const { userId } = await params
  const csv = await exportDeveloperTransactionsCSV(userId)
  const now = new Date().toISOString().slice(0, 10)

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="europay-transactions-${userId.slice(0, 8)}-${now}.csv"`,
    },
  })
}
