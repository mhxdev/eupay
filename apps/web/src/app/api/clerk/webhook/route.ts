// SETUP: In Clerk Dashboard → Webhooks → Add Endpoint:
// URL: https://europay.dev/api/clerk/webhook
// Events: user.created
// Copy the Signing Secret → set as CLERK_WEBHOOK_SECRET in .env and Vercel

import { Webhook } from "svix"
import { headers } from "next/headers"
import type { WebhookEvent } from "@clerk/nextjs/server"
import { trackMilestone } from "@/lib/milestones"
import { createAlert } from "@/lib/alerts"

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET
  if (!WEBHOOK_SECRET) {
    return new Response("Webhook secret not configured", { status: 500 })
  }

  // Verify the webhook signature using svix
  const headerPayload = await headers()
  const svix_id = headerPayload.get("svix-id")
  const svix_timestamp = headerPayload.get("svix-timestamp")
  const svix_signature = headerPayload.get("svix-signature")

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Missing svix headers", { status: 400 })
  }

  const payload = await req.json()
  const body = JSON.stringify(payload)

  const wh = new Webhook(WEBHOOK_SECRET)
  let event: WebhookEvent

  try {
    event = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent
  } catch {
    return new Response("Invalid signature", { status: 400 })
  }

  if (event.type === "user.created") {
    const { id, email_addresses, first_name, last_name } = event.data
    const email = email_addresses?.[0]?.email_address || "unknown"

    await trackMilestone({
      clerkUserId: id,
      milestone: "signup_completed",
      details: { email, firstName: first_name, lastName: last_name },
    })

    await createAlert({
      severity: "INFO",
      category: "developer_health",
      title: "New developer signed up",
      description: `${email} just created an account. They haven't created an app yet.`,
      developerUserId: id,
    })
  }

  return new Response("OK", { status: 200 })
}
