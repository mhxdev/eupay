import Link from "next/link"

export default function GettingStartedPage() {
  return (
    <article className="prose-docs">
      <h1 className="text-3xl font-bold tracking-tight text-white">
        Getting Started
      </h1>
      <p className="mt-4 text-lg text-gray-400">
        Get EUPay running in your iOS app in under 15 minutes. This guide covers
        prerequisites, installation, and your first checkout.
      </p>

      {/* Prerequisites */}
      <section className="mt-12">
        <h2 className="text-xl font-semibold text-white">Prerequisites</h2>
        <ul className="mt-4 space-y-3 text-sm text-gray-400">
          <li className="flex items-start gap-3">
            <span className="mt-0.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-teal-400" />
            <span>
              <strong className="text-white">Xcode 15+</strong> with Swift 5.9
              or later
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-0.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-teal-400" />
            <span>
              <strong className="text-white">iOS 16+</strong> deployment target
              (StoreKit 2 required for region detection)
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-0.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-teal-400" />
            <span>
              <strong className="text-white">EU App Store account</strong> —
              your app must be distributed in at least one EU member state
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-0.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-teal-400" />
            <span>
              <strong className="text-white">EUPay account</strong> —{" "}
              <Link
                href="/sign-up"
                className="text-teal-400 underline underline-offset-2 hover:text-teal-300"
              >
                sign up free
              </Link>{" "}
              and create an app in the dashboard to get your API key
            </span>
          </li>
        </ul>
      </section>

      {/* Installation */}
      <section className="mt-12">
        <h2 className="text-xl font-semibold text-white">
          Install via Swift Package Manager
        </h2>
        <p className="mt-3 text-sm text-gray-400">
          In Xcode, go to{" "}
          <strong className="text-white">
            File &rarr; Add Package Dependencies
          </strong>{" "}
          and enter the repository URL:
        </p>
        <div className="mt-4 overflow-x-auto rounded-lg border border-white/10 bg-white/5 px-5 py-4">
          <code className="text-sm font-mono text-teal-300">
            https://github.com/mhxdev/EUPayKit
          </code>
        </div>
        <p className="mt-3 text-sm text-gray-400">
          Set the version rule to{" "}
          <strong className="text-white">Up to Next Major</strong> from{" "}
          <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs font-mono text-teal-300">
            1.0.0
          </code>
          .
        </p>
      </section>

      {/* Basic setup */}
      <section className="mt-12">
        <h2 className="text-xl font-semibold text-white">Basic Setup</h2>
        <p className="mt-3 text-sm text-gray-400">
          Import EUPayKit and configure the SDK at app launch — typically in
          your <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs font-mono text-teal-300">App</code> struct&apos;s initialiser:
        </p>
        <div className="mt-4 overflow-x-auto rounded-lg border border-white/10 bg-white/5 px-5 py-4">
          <pre className="text-sm leading-relaxed font-mono">
            <code>
              <span className="text-purple-400">import</span>{" "}
              <span className="text-white">EUPayKit</span>
              {"\n\n"}
              <span className="text-gray-500">// In your App init or AppDelegate</span>
              {"\n"}
              <span className="text-teal-300">EUPayKit</span>
              <span className="text-gray-400">.</span>
              <span className="text-white">configure</span>
              <span className="text-gray-400">(</span>
              <span className="text-teal-300">EUPayConfig</span>
              <span className="text-gray-400">(</span>
              {"\n"}
              {"    "}
              <span className="text-white">apiKey</span>
              <span className="text-gray-400">:</span>{" "}
              <span className="text-orange-300">&quot;eupay_your_api_key&quot;</span>
              <span className="text-gray-400">,</span>
              {"\n"}
              {"    "}
              <span className="text-white">appId</span>
              <span className="text-gray-400">:</span>{" "}
              <span className="text-orange-300">&quot;your_app_id&quot;</span>
              <span className="text-gray-400">,</span>
              {"\n"}
              {"    "}
              <span className="text-white">returnScheme</span>
              <span className="text-gray-400">:</span>{" "}
              <span className="text-orange-300">&quot;eupay-myapp://return&quot;</span>
              <span className="text-gray-400">,</span>
              {"\n"}
              {"    "}
              <span className="text-white">checkoutMode</span>
              <span className="text-gray-400">:</span>{" "}
              <span className="text-gray-400">.</span>
              <span className="text-teal-300">inAppSafari</span>
              {"\n"}
              <span className="text-gray-400">))</span>
            </code>
          </pre>
        </div>
        <p className="mt-3 text-sm text-gray-400">
          Replace the placeholder values with your real API key and App ID from
          the{" "}
          <Link
            href="/dashboard"
            className="text-teal-400 underline underline-offset-2 hover:text-teal-300"
          >
            dashboard
          </Link>
          .
        </p>
      </section>

      {/* First checkout */}
      <section className="mt-12">
        <h2 className="text-xl font-semibold text-white">
          Your First Checkout
        </h2>
        <p className="mt-3 text-sm text-gray-400">
          Add the <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs font-mono text-teal-300">.eupayCheckout</code> modifier to any SwiftUI button:
        </p>
        <div className="mt-4 overflow-x-auto rounded-lg border border-white/10 bg-white/5 px-5 py-4">
          <pre className="text-sm leading-relaxed font-mono">
            <code>
              <span className="text-purple-400">struct</span>{" "}
              <span className="text-teal-300">ContentView</span>
              <span className="text-gray-400">:</span>{" "}
              <span className="text-teal-300">View</span>{" "}
              <span className="text-gray-400">{"{"}</span>
              {"\n"}
              {"  "}
              <span className="text-purple-400">var</span>{" "}
              <span className="text-white">body</span>
              <span className="text-gray-400">:</span>{" "}
              <span className="text-purple-400">some</span>{" "}
              <span className="text-teal-300">View</span>{" "}
              <span className="text-gray-400">{"{"}</span>
              {"\n"}
              {"    "}
              <span className="text-teal-300">Button</span>
              <span className="text-gray-400">(</span>
              <span className="text-orange-300">&quot;Subscribe — €4.99/mo&quot;</span>
              <span className="text-gray-400">)</span>{" "}
              <span className="text-gray-400">{"{"}</span>{" "}
              <span className="text-gray-400">{"}"}</span>
              {"\n"}
              {"      "}
              <span className="text-yellow-300">.eupayCheckout</span>
              <span className="text-gray-400">(</span>
              <span className="text-white">productId</span>
              <span className="text-gray-400">:</span>{" "}
              <span className="text-orange-300">&quot;pro_monthly&quot;</span>
              <span className="text-gray-400">)</span>
              {"\n"}
              {"  "}
              <span className="text-gray-400">{"}"}</span>
              {"\n"}
              <span className="text-gray-400">{"}"}</span>
            </code>
          </pre>
        </div>
        <p className="mt-3 text-sm text-gray-400">
          That&apos;s it. The modifier handles EU region detection, Apple&apos;s DMA
          disclosure, Stripe Checkout, and entitlement verification
          automatically.
        </p>
      </section>

      {/* Apple Entitlement */}
      <section className="mt-12">
        <h2 className="text-xl font-semibold text-white">
          Apple Entitlement (Required)
        </h2>
        <p className="mt-3 text-sm text-gray-400">
          Before submitting to the App Store, request the{" "}
          <strong className="text-white">
            External Purchase Link Entitlement
          </strong>{" "}
          in App Store Connect. Add this to your{" "}
          <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs font-mono text-teal-300">
            Info.plist
          </code>
          :
        </p>
        <div className="mt-4 overflow-x-auto rounded-lg border border-white/10 bg-white/5 px-5 py-4">
          <pre className="text-sm leading-relaxed font-mono">
            <code className="text-gray-300">
              <span className="text-gray-500">&lt;</span>
              <span className="text-teal-300">key</span>
              <span className="text-gray-500">&gt;</span>
              com.apple.developer.storekit.external-purchase-link
              <span className="text-gray-500">&lt;/</span>
              <span className="text-teal-300">key</span>
              <span className="text-gray-500">&gt;</span>
              {"\n"}
              <span className="text-gray-500">&lt;</span>
              <span className="text-teal-300">true</span>
              <span className="text-gray-500">/&gt;</span>
            </code>
          </pre>
        </div>
      </section>

      {/* Next steps */}
      <section className="mt-12 rounded-lg border border-white/10 bg-white/[0.03] px-6 py-5">
        <p className="text-sm font-medium text-white">Next steps</p>
        <p className="mt-1 text-sm text-gray-400">
          Ready for the full picture? The{" "}
          <Link
            href="/docs/integration-guide"
            className="text-teal-400 underline underline-offset-2 hover:text-teal-300"
          >
            Integration Guide
          </Link>{" "}
          covers handling purchase results, entitlement verification, StoreKit
          fallback for non-EU users, and sandbox testing.
        </p>
      </section>
    </article>
  )
}
