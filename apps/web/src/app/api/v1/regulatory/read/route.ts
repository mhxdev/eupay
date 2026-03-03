import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"

const schema = z.object({
  regulatoryUpdateId: z.string(),
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

  await prisma.regulatoryUpdateRead.upsert({
    where: {
      updateId_clerkUserId: {
        updateId: parsed.data.regulatoryUpdateId,
        clerkUserId: userId,
      },
    },
    create: {
      updateId: parsed.data.regulatoryUpdateId,
      clerkUserId: userId,
    },
    update: {},
  })

  return NextResponse.json({ success: true })
}
