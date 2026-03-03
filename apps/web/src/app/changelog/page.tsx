import Link from "next/link"
import { ArrowLeft, Mail } from "lucide-react"

type ChangeTag = "New" | "Improved" | "Fixed" | "Removed"

const TAG_STYLES: Record<ChangeTag, string> = {
  New: "bg-teal-500/10 text-teal-400 border-teal-500/20",
  Improved: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Fixed: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  Removed: "bg-red-500/10 text-red-400 border-red-500/20",
}

type Change = {
  tag: ChangeTag
  text: string
}

type Release = {
  version: string
  date: string
  summary: string
  changes: Change[]
  latest?: boolean
}

const RELEASES: Release[] = [
  {
    version: "v1.1.0",
    date: "March 2026",
    summary: "Developer experience improvements — new dashboard tools, status page, and onboarding flow.",
    latest: true,
    changes: [
      { tag: "New", text: "API Explorer in dashboard — browse endpoints, send test requests, copy as cURL" },
      { tag: "New", text: "Webhook testing tool with simulated events and delivery log" },
      { tag: "New", text: "Sandbox/live mode toggle per app with confirmation dialog" },
      { tag: "New", text: "Onboarding checklist with auto-detection of completed steps" },
      { tag: "New", text: "System status page at europay.dev/status with health checks" },
      { tag: "New", text: "Public changelog page" },
      { tag: "Improved", text: "Docs site expanded to 5 sections — getting started, integration guide, API reference, DMA compliance, changelog" },
      { tag: "Improved", text: "Webhook page redesigned with endpoint configuration and secret management" },
    ],
  },
  {
    version: "v1.0.0",
    date: "March 2026",
    summary: "Initial release of the EuroPay platform and EuroPayKit iOS SDK.",
    changes: [
      { tag: "New", text: "EuroPayKit iOS SDK — SwiftUI checkout, DMA disclosure, entitlement verification" },
      { tag: "New", text: "Self-serve signup and onboarding with Clerk authentication" },
      { tag: "New", text: "Stripe-powered checkout with automatic EU VAT calculation" },
      { tag: "New", text: "DMA disclosure flow with ExternalPurchaseCustomLink support" },
      { tag: "New", text: "GDPR tools — data export (Art. 15 & 20), erasure (Art. 17)" },
      { tag: "New", text: "Webhook delivery system with full event log" },
      { tag: "New", text: "Developer dashboard — revenue metrics, MRR chart, subscriber management" },
      { tag: "New", text: "Subscription lifecycle — pause, resume, cancel with save offer" },
      { tag: "New", text: "Transactional emails via Resend — purchase confirmation, Widerrufsrecht waiver" },
      { tag: "New", text: "Apple External Purchase Server API reporting (automated + nil reports)" },
    ],
  },
]

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white">
      {/* Nav */}
      <nav className="border-b border-white/10 px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xl font-bold">
              EuroPay
            </Link>
            <span className="text-white/20">/</span>
            <span className="text-sm text-gray-400">Changelog</span>
          </div>
          <Link
            href="/dashboard"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-6 py-12 md:py-16">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Changelog</h1>
          <p className="mt-3 text-gray-400">
            Product updates and release notes for EuroPay and EuroPayKit.
          </p>
          <a
            href="mailto:updates@europay.dev"
            className="mt-4 inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-gray-300 hover:border-white/20 hover:text-white transition-colors"
          >
            <Mail className="h-3.5 w-3.5" />
            Subscribe to updates
          </a>
        </div>

        {/* Timeline */}
        <div className="mt-14 space-y-16">
          {RELEASES.map((release) => (
            <section key={release.version} className="relative">
              {/* Version header */}
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-teal-500/10 px-3 py-1 text-sm font-semibold text-teal-400 border border-teal-500/20">
                  {release.version}
                </span>
                {release.latest && (
                  <span className="rounded-full bg-teal-500 px-2.5 py-0.5 text-[10px] font-medium text-white uppercase tracking-wider">
                    Latest
                  </span>
                )}
                <span className="text-sm text-gray-500">{release.date}</span>
              </div>

              {/* Summary */}
              <p className="mt-3 text-sm text-gray-400">{release.summary}</p>

              {/* Changes */}
              <ul className="mt-5 space-y-2.5">
                {release.changes.map((change, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 shrink-0 rounded border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${TAG_STYLES[change.tag]}`}
                    >
                      {change.tag}
                    </span>
                    <span className="text-sm text-gray-300">{change.text}</span>
                  </li>
                ))}
              </ul>

              {/* Divider */}
              {release !== RELEASES[RELEASES.length - 1] && (
                <div className="mt-16 border-t border-white/5" />
              )}
            </section>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-6">
        <div className="mx-auto max-w-3xl flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to EuroPay
          </Link>
          <p className="text-xs text-gray-600">
            &copy; 2026 EuroPay. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
