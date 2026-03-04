import { DocsNavigation } from "../DocsNavigation"

export default function ChangelogPage() {
  return (
    <article className="prose-docs">
      <h1 className="text-3xl font-bold tracking-tight text-white">
        Changelog
      </h1>
      <p className="mt-4 text-lg text-gray-400">
        A log of notable changes to EuroPay and EuroPayKit.
      </p>

      {/* v1.0.0 */}
      <section className="mt-12">
        <div className="flex items-baseline gap-3">
          <h2 className="text-xl font-semibold text-white">v1.0.0</h2>
          <span className="rounded-full bg-teal-500/10 px-3 py-0.5 text-xs font-medium text-teal-400 border border-teal-500/20">
            Latest
          </span>
        </div>
        <p className="mt-1 text-sm text-gray-500">March 2026</p>
        <p className="mt-3 text-sm text-gray-400">
          Initial release of the EuroPay platform and EuroPayKit iOS SDK.
        </p>

        <div className="mt-6 space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-white">
              EuroPayKit iOS SDK
            </h3>
            <ul className="mt-2 space-y-1.5 text-sm text-gray-400">
              <li className="flex items-start gap-2">
                <span className="mt-1 text-teal-400">&#8226;</span>
                Checkout flow via <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs font-mono text-teal-300">purchase(product:userId:presenting:)</code> with automatic DMA disclosure
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 text-teal-400">&#8226;</span>
                EU region detection via StoreKit 2 Storefront API
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 text-teal-400">&#8226;</span>
                Apple DMA disclosure — native <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs font-mono text-teal-300">ExternalPurchaseCustomLink</code> on iOS 18.1+, custom modal fallback on older versions
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 text-teal-400">&#8226;</span>
                Apple External Purchase Token capture and reporting
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 text-teal-400">&#8226;</span>
                Stripe Checkout via SFSafariViewController
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 text-teal-400">&#8226;</span>
                Entitlement verification with Keychain caching
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 text-teal-400">&#8226;</span>
                Customer Portal integration for subscription management
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 text-teal-400">&#8226;</span>
                Zero external dependencies — iOS 16+, Swift 5.9+
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white">
              Backend API
            </h3>
            <ul className="mt-2 space-y-1.5 text-sm text-gray-400">
              <li className="flex items-start gap-2">
                <span className="mt-1 text-teal-400">&#8226;</span>
                Stripe Checkout session creation with EU VAT via Stripe Tax
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 text-teal-400">&#8226;</span>
                Full webhook handling — purchases, renewals, cancellations, refunds, disputes
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 text-teal-400">&#8226;</span>
                Subscription lifecycle — pause, resume, cancel with save offer
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 text-teal-400">&#8226;</span>
                GDPR endpoints — data export (Art. 15 &amp; 20) and erasure (Art. 17)
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 text-teal-400">&#8226;</span>
                Apple External Purchase Server API reporting (automated)
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 text-teal-400">&#8226;</span>
                Transactional emails via Resend — purchase confirmation, Widerrufsrecht waiver, cancellation confirmation
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white">
              Developer Dashboard
            </h3>
            <ul className="mt-2 space-y-1.5 text-sm text-gray-400">
              <li className="flex items-start gap-2">
                <span className="mt-1 text-teal-400">&#8226;</span>
                Revenue overview — MRR, active subscriptions, churn rate, 12-month chart
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 text-teal-400">&#8226;</span>
                App registration and API key management (show-once flow)
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 text-teal-400">&#8226;</span>
                Product catalog — create, list, toggle active/inactive
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 text-teal-400">&#8226;</span>
                Subscriber management with search, status filter, pagination
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 text-teal-400">&#8226;</span>
                Webhook log viewer with expandable payload inspector
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 text-teal-400">&#8226;</span>
                GDPR tools — data export and deletion from the dashboard
              </li>
            </ul>
          </div>
        </div>
      </section>

      <DocsNavigation
        prev={{ href: "/docs/api-reference", label: "API Reference" }}
      />
    </article>
  )
}
