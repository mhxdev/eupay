import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { reportTransaction } from "@/lib/apple-reporting"

const schema = z.object({
  appId: z.string(),
  transactionId: z.string(),
})

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid fields", details: parsed.error.flatten() },
      { status: 422 }
    )
  }

  const { appId, transactionId } = parsed.data

  const app = await prisma.app.findUnique({ where: { id: appId } })
  if (!app || app.clerkUserId !== userId) {
    return NextResponse.json({ error: "App not found" }, { status: 404 })
  }

  if (!app.appleKeyId || !app.appleIssuerId || !app.applePrivateKey || !app.appleBundleId) {
    return NextResponse.json(
      { error: "Apple credentials not configured. Set them in your app settings." },
      { status: 422 }
    )
  }

  const result = await reportTransaction(
    {
      appleKeyId: app.appleKeyId,
      appleIssuerId: app.appleIssuerId,
      applePrivateKey: app.applePrivateKey,
      appleBundleId: app.appleBundleId,
    },
    transactionId
  )

  // Find the transaction by stripePaymentIntentId, stripeCheckoutSessionId, or id
  const transaction = await prisma.transaction.findFirst({
    where: {
      appId,
      OR: [
        { id: transactionId },
        { stripePaymentIntentId: transactionId },
        { stripeCheckoutSessionId: transactionId },
      ],
    },
  })

  if (transaction) {
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        appleReportStatus: result.success ? "REPORTED" : "FAILED",
        appleReportedAt: new Date(),
        appleReportError: result.error ?? null,
      },
    })
  }

  return NextResponse.json(result)
}
