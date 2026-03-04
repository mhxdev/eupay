import Link from "next/link"

interface DocsNavigationProps {
  prev?: { href: string; label: string }
  next?: { href: string; label: string }
}

export function DocsNavigation({ prev, next }: DocsNavigationProps) {
  return (
    <nav className="mt-16 flex items-center justify-between border-t border-white/10 pt-6">
      {prev ? (
        <Link
          href={prev.href}
          className="group flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-teal-400"
        >
          <span className="transition-transform group-hover:-translate-x-0.5">&larr;</span>
          {prev.label}
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link
          href={next.href}
          className="group flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-teal-400"
        >
          {next.label}
          <span className="transition-transform group-hover:translate-x-0.5">&rarr;</span>
        </Link>
      ) : (
        <span />
      )}
    </nav>
  )
}
