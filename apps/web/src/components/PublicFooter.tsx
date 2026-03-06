import Link from "next/link"

export function PublicFooter() {
  return (
    <footer className="border-t border-white/10 py-6 px-6">
      <div className="mx-auto flex max-w-6xl items-center justify-center gap-6 text-sm text-gray-500">
        <p>
          &copy; 2026{" "}
          <Link href="/" className="hover:text-gray-300 transition-colors">
            EuroPay
          </Link>
        </p>
        <Link href="/impressum" className="hover:text-gray-300 transition-colors">
          Impressum
        </Link>
        <Link href="/privacy" className="hover:text-gray-300 transition-colors">
          Privacy
        </Link>
        <Link href="/terms" className="hover:text-gray-300 transition-colors">
          Terms
        </Link>
        <Link href="/dpa" className="hover:text-gray-300 transition-colors">
          DPA
        </Link>
      </div>
    </footer>
  )
}
