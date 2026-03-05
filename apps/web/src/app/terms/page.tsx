import Link from "next/link"
import { PublicFooter } from "@/components/PublicFooter"

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#0a0f1e] text-white">
      <nav className="border-b border-white/10 px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <Link href="/" className="text-xl font-bold">
            EuroPay
          </Link>
          <span className="text-white/20">/</span>
          <span className="text-sm text-gray-400">Terms of Service</span>
        </div>
      </nav>

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12 md:py-16">
        <h1 className="text-4xl font-bold tracking-tight">Terms of Service</h1>
        <p className="mt-6 text-base leading-relaxed text-gray-300">
          Our terms of service are currently being prepared by our legal counsel
          and will be published before the platform launches. For questions,
          contact [TODO: legal@europay.dev].
        </p>
      </main>

      <PublicFooter />
    </div>
  )
}
