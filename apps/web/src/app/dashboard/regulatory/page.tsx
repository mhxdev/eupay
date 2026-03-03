import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MarkReadButton } from "@/components/dashboard/MarkReadButton"
import { Bell } from "lucide-react"

type Category = "DMA" | "Apple" | "GDPR" | "General"

const CATEGORY_STYLES: Record<Category, string> = {
  DMA: "bg-teal-100 text-teal-800 hover:bg-teal-100 dark:bg-teal-500/10 dark:text-teal-400",
  Apple: "bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400",
  GDPR: "bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-400",
  General: "bg-gray-100 text-gray-800 hover:bg-gray-100 dark:bg-gray-500/10 dark:text-gray-400",
}

function deriveCategory(title: string): Category {
  const lower = title.toLowerCase()
  if (lower.includes("dma")) return "DMA"
  if (lower.includes("apple") || lower.includes("storekit") || lower.includes("app store")) return "Apple"
  if (lower.includes("gdpr") || lower.includes("privacy") || lower.includes("data protection")) return "GDPR"
  return "General"
}

export default async function RegulatoryPage() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const [updates, reads] = await Promise.all([
    prisma.regulatoryUpdate.findMany({
      orderBy: { publishedAt: "desc" },
    }),
    prisma.regulatoryUpdateRead.findMany({
      where: { clerkUserId: userId },
      select: { updateId: true },
    }),
  ])

  const readIds = new Set(reads.map((r) => r.updateId))
  const unreadCount = updates.filter((u) => !readIds.has(u.id)).length

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Regulatory Updates</h1>
          {unreadCount > 0 && (
            <Badge className="bg-teal-100 text-teal-800 hover:bg-teal-100 dark:bg-teal-500/10 dark:text-teal-400">
              {unreadCount} new
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground">
          EU DMA, Apple policy, and GDPR changes that may affect your integration.
        </p>
      </div>

      {updates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Bell className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">
              No regulatory updates yet. We monitor EU DMA and Apple policy changes for you.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {updates.map((update) => {
            const isRead = readIds.has(update.id)
            const category = deriveCategory(update.title)

            return (
              <Card
                key={update.id}
                className={isRead ? "opacity-70" : "border-primary/20"}
              >
                <CardContent className="py-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className={`text-sm font-medium ${isRead ? "text-muted-foreground" : ""}`}>
                          {update.title}
                        </h3>
                        <Badge className={CATEGORY_STYLES[category]}>
                          {category}
                        </Badge>
                        {!isRead && (
                          <Badge className="bg-teal-500 text-white hover:bg-teal-500 text-[10px]">
                            New
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {update.description}
                      </p>
                      {update.actionRequired && (
                        <p className="text-xs text-orange-700 dark:text-orange-400">
                          Action required: {update.actionRequired}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {update.publishedAt.toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    {!isRead && (
                      <div className="shrink-0">
                        <MarkReadButton regulatoryUpdateId={update.id} />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
