"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"

const NAV_LINKS = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/apps", label: "Apps" },
  { href: "/dashboard/settings", label: "Settings" },
  { href: "/dashboard/gdpr", label: "GDPR" },
  { href: "/dashboard/api-explorer", label: "API" },
  { href: "/dashboard/regulatory", label: "Regulatory" },
]

export function MobileNav() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="md:hidden rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        aria-label="Toggle menu"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {open && (
        <div className="md:hidden absolute left-0 right-0 top-full border-b border-border bg-card z-50">
          <div className="flex flex-col px-6 py-3 space-y-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
