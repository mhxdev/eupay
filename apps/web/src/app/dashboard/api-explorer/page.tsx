import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ApiExplorer } from "@/components/dashboard/ApiExplorer"

export default async function ApiExplorerPage() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  // Get first active API key for pre-filling the Try It section
  const firstApp = await prisma.app.findFirst({
    where: { clerkUserId: userId },
    select: { id: true },
  })

  let apiKeyPrefix = ""
  if (firstApp) {
    const key = await prisma.apiKey.findFirst({
      where: { appId: firstApp.id, isActive: true },
      select: { keyPrefix: true },
      orderBy: { createdAt: "desc" },
    })
    if (key) {
      apiKeyPrefix = key.keyPrefix + "..."
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">API Explorer</h1>
        <p className="text-muted-foreground">
          Browse endpoints, see request/response shapes, and send test requests.
        </p>
      </div>

      <ApiExplorer apiKey={apiKeyPrefix} />
    </div>
  )
}
