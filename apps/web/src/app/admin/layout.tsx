import { auth } from "@clerk/nextjs/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import { UserButton } from "@clerk/nextjs"
import { ThemeToggle } from "@/components/dashboard/ThemeToggle"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()
  if (userId !== process.env.ADMIN_CLERK_USER_ID) return notFound()

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-card border-b border-border px-4 py-4 md:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4 md:gap-8">
            <Link href="/admin" className="text-xl font-bold hover:opacity-80 transition-opacity">
              EuroPay Admin
            </Link>
            <Link
              href="/admin"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Overview
            </Link>
            <Link
              href="/admin/analytics"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Analytics
            </Link>
            <Link
              href="/dashboard"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              &larr; Dashboard
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <UserButton />
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 py-6 md:px-6 md:py-8">
        {children}
      </main>
    </div>
  )
}
