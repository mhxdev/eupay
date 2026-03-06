import Link from "next/link"
import { DocsHeader } from "./DocsHeader"
import { DocsSidebar } from "./DocsSidebar"

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white">
      <DocsHeader />
      <DocsSidebar />

      {/* Main content */}
      <main className="pt-14 md:pl-64">
        <div className="max-w-[800px] px-8 py-12 md:py-16">
          {children}

          <footer className="mt-12 border-t border-white/10 pt-6 text-xs text-gray-500">
            <Link href="/impressum" className="hover:text-gray-300 transition-colors">Impressum</Link>
            <span className="mx-2">&middot;</span>
            <Link href="/privacy" className="hover:text-gray-300 transition-colors">Privacy</Link>
            <span className="mx-2">&middot;</span>
            <Link href="/terms" className="hover:text-gray-300 transition-colors">Terms</Link>
            <span className="mx-2">&middot;</span>
            <Link href="/dpa" className="hover:text-gray-300 transition-colors">DPA</Link>
          </footer>
        </div>
      </main>
    </div>
  )
}
