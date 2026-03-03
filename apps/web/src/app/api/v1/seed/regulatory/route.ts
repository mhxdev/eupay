// POST /api/v1/seed/regulatory
// Seeds initial regulatory updates. Protected by CRON_SECRET.
// Idempotent — skips if updates already exist.
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const SEED_UPDATES = [
  {
    title: "Apple Core Technology Commission (CTC) — 5% Fee Confirmed",
    description:
      "The European Commission has confirmed Apple's Core Technology Commission of 5% on all external purchase transactions under the DMA. This fee applies in addition to payment processor fees and is automatically calculated by EuroPay.",
    actionRequired:
      "No action needed — EuroPay handles CTC calculation and disclosure automatically. Review the Cost Calculator in your dashboard to understand the impact on your pricing.",
    publishedAt: new Date("2025-06-15T10:00:00Z"),
  },
  {
    title: "Apple Reduces IAP Commission to 20% for EU Small Developers",
    description:
      "Apple has reduced the in-app purchase commission to 20% (from 30%) for developers earning under €1M annually in the EU App Store. The Small Developer Program discount now applies to EU alternative payment transactions as well, with the CTC reduced to 5%.",
    actionRequired:
      "Review your fee structure using the Cost Calculator. If you earn under €1M/year, compare EuroPay's total fees (~11.5%) against Apple's new 20% rate to confirm EuroPay remains the better option for your business.",
    publishedAt: new Date("2025-07-01T09:00:00Z"),
  },
  {
    title: "Mandatory Transaction Reporting Requirements Updated",
    description:
      "Apple has updated the External Purchase Server API requirements. All transactions — including abandoned/cancelled checkouts — must now be reported within 24 hours. Nil reports are required for months with zero transactions. Failure to comply may result in entitlement revocation.",
    actionRequired:
      "Ensure Apple credentials are configured for all your apps. EuroPay automatically reports transactions and submits monthly nil reports. Check the Apple Reporting page in each app's dashboard to verify your reporting status.",
    publishedAt: new Date("2025-08-01T08:00:00Z"),
  },
]

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("Authorization")
  const secret = process.env.CRON_SECRET
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const existing = await prisma.regulatoryUpdate.count()
  if (existing > 0) {
    return NextResponse.json({ message: "Already seeded", count: existing })
  }

  await prisma.regulatoryUpdate.createMany({ data: SEED_UPDATES })

  return NextResponse.json({ message: "Seeded regulatory updates", count: SEED_UPDATES.length })
}
