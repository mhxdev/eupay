import Link from "next/link"
import { PublicFooter } from "@/components/PublicFooter"

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#0a0f1e] text-white">
      <nav className="border-b border-white/10 px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <Link href="/" className="text-xl font-bold">
            EuroPay
          </Link>
          <span className="text-white/20">/</span>
          <span className="text-sm text-gray-400">Privacy Policy</span>
        </div>
      </nav>

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12 md:py-16">
        <h1 className="text-4xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="mt-6 text-base leading-relaxed text-gray-300">
          This privacy policy is currently being prepared by our legal counsel
          and will be published before the platform launches. For questions about
          data processing, contact [TODO: privacy@europay.dev].
        </p>
      </main>

      <PublicFooter />
    </div>
  )
}
