import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { ThemeToggle } from "@/components/dashboard/ThemeToggle";
import { MobileNav } from "@/components/dashboard/MobileNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <nav className="relative bg-card border-b border-border px-4 py-4 md:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4 md:gap-8">
            <MobileNav />
            <Link href="/dashboard" className="text-xl font-bold">
              EUPay
            </Link>
            <div className="hidden md:flex items-center gap-4 text-sm">
              <Link
                href="/dashboard"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Overview
              </Link>
              <Link
                href="/dashboard/apps"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Apps
              </Link>
              <Link
                href="/dashboard/settings"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Settings
              </Link>
              <Link
                href="/dashboard/gdpr"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                GDPR
              </Link>
              <Link
                href="/dashboard/api-explorer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                API
              </Link>
              <Link
                href="/dashboard/regulatory"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Regulatory
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <UserButton />
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 py-6 md:px-6 md:py-8">{children}</main>
    </div>
  );
}
