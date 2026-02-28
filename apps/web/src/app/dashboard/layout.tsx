import { UserButton } from "@clerk/nextjs";
import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="text-xl font-bold">
              EUPay
            </Link>
            <div className="flex items-center gap-4 text-sm">
              <Link
                href="/dashboard"
                className="text-gray-600 hover:text-gray-900"
              >
                Overview
              </Link>
              <Link
                href="/dashboard/apps"
                className="text-gray-600 hover:text-gray-900"
              >
                Apps
              </Link>
              <Link
                href="/dashboard/settings"
                className="text-gray-600 hover:text-gray-900"
              >
                Settings
              </Link>
              <Link
                href="/dashboard/gdpr"
                className="text-gray-600 hover:text-gray-900"
              >
                GDPR
              </Link>
            </div>
          </div>
          <UserButton />
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
