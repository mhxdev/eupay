import Link from "next/link"
import { DocsSidebar } from "./DocsSidebar"

const sections = [
  {
    title: "GET STARTED",
    links: [{ href: "/docs/getting-started", label: "Getting Started" }],
  },
  {
    title: "INTEGRATION",
    links: [
      { href: "/docs/integration-guide", label: "Integration Guide" },
      { href: "/docs/api-reference", label: "API Reference" },
    ],
  },
  {
    title: "COMPLIANCE",
    links: [{ href: "/docs/dma-compliance", label: "DMA Compliance" }],
  },
  {
    title: "MORE",
    links: [{ href: "/docs/changelog", label: "Changelog" }],
  },
]

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white">
      {/* Top bar */}
      <header className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center border-b border-white/10 bg-[#0a0f1e]/80 backdrop-blur-md px-6">
        <Link href="/" className="text-lg font-bold text-white">
          EUPay
        </Link>
        <span className="mx-3 text-white/20">/</span>
        <Link href="/docs" className="text-sm text-gray-400 hover:text-white transition-colors">
          Docs
        </Link>
        <div className="ml-auto flex items-center gap-4 text-sm">
          <Link href="/dashboard" className="hidden text-gray-400 hover:text-white transition-colors sm:block">
            Dashboard
          </Link>
          <a
            href="https://github.com/mhxdev/EUPayKit"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-white transition-colors"
          >
            GitHub
          </a>
        </div>
      </header>

      <DocsSidebar sections={sections} />

      {/* Main content */}
      <main className="pt-14 md:pl-64">
        <div className="mx-auto max-w-3xl px-6 py-12 md:py-16">
          {children}
        </div>
      </main>
    </div>
  )
}
