import { NextRequest } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"

const schema = z.object({
  email: z.string().email(),
})

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid email address" },
      { status: 422 }
    )
  }

  await prisma.waitlistEntry.upsert({
    where: { email: parsed.data.email },
    create: { email: parsed.data.email },
    update: {},
  })

  return Response.json({ success: true })
}
