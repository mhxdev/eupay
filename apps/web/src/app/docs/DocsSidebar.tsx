"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"

interface SidebarSection {
  title: string
  links: { href: string; label: string }[]
}

export function DocsSidebar({ sections }: { sections: SidebarSection[] }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const nav = (
    <nav className="space-y-6">
      {sections.map((section) => (
        <div key={section.title}>
          <p className="mb-2 text-[11px] font-semibold tracking-widest text-gray-500">
            {section.title}
          </p>
          <ul className="space-y-1">
            {section.links.map((link) => {
              const active = pathname === link.href
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={`block rounded-md px-3 py-1.5 text-sm transition-colors ${
                      active
                        ? "bg-teal-500/10 font-medium text-teal-400"
                        : "text-gray-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed top-14 left-0 hidden h-[calc(100vh-3.5rem)] w-64 overflow-y-auto border-r border-white/10 bg-[#0a0f1e] px-4 py-8 md:block">
        {nav}
      </aside>

      {/* Mobile toggle */}
      <div className="sticky top-14 z-40 border-b border-white/10 bg-[#0a0f1e]/90 backdrop-blur-md px-6 py-2.5 md:hidden">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4"
          >
            <path
              fillRule="evenodd"
              d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10zm0 5.25a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75z"
              clipRule="evenodd"
            />
          </svg>
          Menu
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-30 bg-black/40 md:hidden"
            onClick={() => setOpen(false)}
          />
          <div className="fixed top-[6.75rem] left-0 right-0 z-40 max-h-[70vh] overflow-y-auto border-b border-white/10 bg-[#0a0f1e] px-6 py-6 md:hidden">
            {nav}
          </div>
        </>
      )}
    </>
  )
}
