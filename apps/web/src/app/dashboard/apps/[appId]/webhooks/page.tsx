import { auth } from "@clerk/nextjs/server"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { WebhookLog, type WebhookEventRow } from "@/components/dashboard/WebhookLog"
import { WebhookConfig } from "@/components/dashboard/WebhookConfig"
import { WebhookTester } from "@/components/dashboard/WebhookTester"
import { SandboxBanner } from "@/components/dashboard/SandboxBanner"
import { ArrowLeft } from "lucide-react"

export default async function WebhooksPage({
  params,
}: {
  params: Promise<{ appId: string }>
}) {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const { appId } = await params

  const app = await prisma.app.findUnique({
    where: { id: appId },
    select: {
      id: true,
      name: true,
      clerkUserId: true,
      mode: true,
      webhookUrl: true,
      webhookSecret: true,
    },
  })
  if (!app || app.clerkUserId !== userId) notFound()

  const rawEvents = await prisma.webhookEvent.findMany({
    where: {
      OR: [{ appId }, { appId: null }],
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  })

  const events: WebhookEventRow[] = rawEvents.map((e) => ({
    id: e.id,
    type: e.type,
    status: e.status,
    error: e.error,
    createdAt: e.createdAt.toISOString(),
    processedAt: e.processedAt?.toISOString() ?? null,
    payload: JSON.stringify(e.payload, null, 2),
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/dashboard/apps/${appId}`}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Webhooks</h1>
          <p className="text-muted-foreground">{app.name}</p>
        </div>
      </div>

      {app.mode === "sandbox" && <SandboxBanner />}

      <WebhookConfig
        appId={appId}
        webhookUrl={app.webhookUrl}
        hasSecret={!!app.webhookSecret}
      />

      <WebhookTester appId={appId} hasUrl={!!app.webhookUrl} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Delivery Log</CardTitle>
        </CardHeader>
        <CardContent>
          <WebhookLog events={events} />
        </CardContent>
      </Card>
    </div>
  )
}
