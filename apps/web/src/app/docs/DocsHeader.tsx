"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const apiPaths = ["/docs/api-reference", "/docs/changelog"]

export function DocsHeader() {
  const pathname = usePathname()
  const isApi = apiPaths.includes(pathname)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-[#0a0f1e]/80 backdrop-blur-md px-6">
      <div className="flex h-14 items-center gap-8">
        <Link href="/" className="text-lg font-bold text-white">
          EuroPay
        </Link>
        <nav className="flex h-full items-center gap-6 text-sm">
          <Link
            href="/docs/getting-started"
            className={`flex h-full items-center border-b-2 transition-colors ${
              !isApi
                ? "border-teal-400 text-white"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            Guides
          </Link>
          <Link
            href="/docs/api-reference"
            className={`flex h-full items-center border-b-2 transition-colors ${
              isApi
                ? "border-teal-400 text-white"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            API
          </Link>
        </nav>
      </div>
    </header>
  )
}
