import Link from "next/link"

export default function GettingStartedPage() {
  return (
    <article className="prose-docs">
      <h1 className="text-3xl font-bold tracking-tight text-white">
        Getting Started
      </h1>
      <p className="mt-4 text-lg text-gray-400">
        Add alternative payments to your iOS app in 5 minutes.
      </p>

      {/* Prerequisites */}
      <section className="mt-12">
        <h2 className="text-xl font-semibold text-white">Prerequisites</h2>
        <ul className="mt-4 space-y-3 text-sm text-gray-400">
          <li className="flex items-start gap-3">
            <span className="mt-0.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-teal-400" />
            <span>Xcode 15+ / Swift 5.9+ / iOS 16+ deployment target</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-0.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-teal-400" />
            <span>
              A Stripe account —{" "}
              <a
                href="https://stripe.com"
                className="text-teal-400 underline underline-offset-2 hover:text-teal-300"
              >
                stripe.com
              </a>
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-0.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-teal-400" />
            <span>
              A EuroPay account —{" "}
              <Link
                href="/sign-up"
                className="text-teal-400 underline underline-offset-2 hover:text-teal-300"
              >
                sign up
              </Link>
              , create an app, and connect Stripe in the{" "}
              <Link
                href="/dashboard"
                className="text-teal-400 underline underline-offset-2 hover:text-teal-300"
              >
                dashboard
              </Link>
            </span>
          </li>
        </ul>
      </section>

      {/* Install */}
      <section className="mt-12">
        <h2 className="text-xl font-semibold text-white">Install the SDK</h2>
        <p className="mt-3 text-sm text-gray-400">
          In Xcode:{" "}
          <strong className="text-white">
            File &rarr; Add Package Dependencies
          </strong>
        </p>
        <div className="mt-4 overflow-x-auto rounded-lg border border-white/10 bg-white/5 px-5 py-4">
          <code className="text-sm font-mono text-teal-300">
            https://github.com/mhxdev/EuroPayKit
          </code>
        </div>
      </section>

      {/* Configure */}
      <section className="mt-12">
        <h2 className="text-xl font-semibold text-white">Configure</h2>
        <div className="mt-4 overflow-x-auto rounded-lg border border-white/10 bg-white/5 px-5 py-4">
          <pre className="text-sm leading-relaxed font-mono">
            <code>
              <span className="text-purple-400">import</span>{" "}
              <span className="text-white">SwiftUI</span>
              {"\n"}
              <span className="text-purple-400">import</span>{" "}
              <span className="text-white">EuroPayKit</span>
              {"\n\n"}
              <span className="text-purple-400">@main</span>
              {"\n"}
              <span className="text-purple-400">struct</span>{" "}
              <span className="text-teal-300">MyApp</span>
              <span className="text-gray-400">:</span>{" "}
              <span className="text-teal-300">App</span>{" "}
              <span className="text-gray-400">{"{"}</span>
              {"\n"}
              {"  "}
              <span className="text-purple-400">init</span>
              <span className="text-gray-400">()</span>{" "}
              <span className="text-gray-400">{"{"}</span>
              {"\n"}
              {"    "}
              <span className="text-teal-300">EuroPayKit</span>
              <span className="text-gray-400">.</span>
              <span className="text-white">configure</span>
              <span className="text-gray-400">(</span>
              <span className="text-teal-300">EuroPayConfig</span>
              <span className="text-gray-400">(</span>
              {"\n"}
              {"      "}
              <span className="text-white">apiKey</span>
              <span className="text-gray-400">:</span>{" "}
              <span className="text-orange-300">&quot;europay_test_...&quot;</span>
              <span className="text-gray-400">,</span>
              {"\n"}
              {"      "}
              <span className="text-white">appId</span>
              <span className="text-gray-400">:</span>{" "}
              <span className="text-orange-300">&quot;app_...&quot;</span>
              <span className="text-gray-400">,</span>
              {"\n"}
              {"      "}
              <span className="text-white">returnScheme</span>
              <span className="text-gray-400">:</span>{" "}
              <span className="text-orange-300">&quot;europay-myapp://return&quot;</span>
              {"\n"}
              {"    "}
              <span className="text-gray-400">))</span>
              {"\n"}
              {"  "}
              <span className="text-gray-400">{"}"}</span>
              {"\n\n"}
              {"  "}
              <span className="text-purple-400">var</span>{" "}
              <span className="text-white">body</span>
              <span className="text-gray-400">:</span>{" "}
              <span className="text-purple-400">some</span>{" "}
              <span className="text-teal-300">Scene</span>{" "}
              <span className="text-gray-400">{"{"}</span>
              {"\n"}
              {"    "}
              <span className="text-teal-300">WindowGroup</span>{" "}
              <span className="text-gray-400">{"{"}</span>
              {"\n"}
              {"      "}
              <span className="text-teal-300">ContentView</span>
              <span className="text-gray-400">()</span>
              {"\n"}
              {"        "}
              <span className="text-gray-400">.</span>
              <span className="text-white">euroPayCheckoutReturnHandler</span>
              <span className="text-gray-400">()</span>
              {"\n"}
              {"    "}
              <span className="text-gray-400">{"}"}</span>
              {"\n"}
              {"  "}
              <span className="text-gray-400">{"}"}</span>
              {"\n"}
              <span className="text-gray-400">{"}"}</span>
            </code>
          </pre>
        </div>
        <p className="mt-3 text-sm text-gray-400">
          Get your API key and App ID from the{" "}
          <Link
            href="/dashboard"
            className="text-teal-400 underline underline-offset-2 hover:text-teal-300"
          >
            dashboard
          </Link>
          .
        </p>
      </section>

      {/* Check region + purchase */}
      <section className="mt-12">
        <h2 className="text-xl font-semibold text-white">
          Check Region &amp; Purchase
        </h2>
        <p className="mt-3 text-sm text-gray-400">
          The SDK detects the user&apos;s EU region, shows Apple&apos;s DMA
          disclosure, and opens Stripe Checkout — all in one call:
        </p>
        <div className="mt-4 overflow-x-auto rounded-lg border border-white/10 bg-white/5 px-5 py-4">
          <pre className="text-sm leading-relaxed font-mono">
            <code>
              <span className="text-purple-400">let</span>{" "}
              <span className="text-white">products</span>{" "}
              <span className="text-gray-400">=</span>{" "}
              <span className="text-purple-400">try await</span>{" "}
              <span className="text-teal-300">EuroPayKit</span>
              <span className="text-gray-400">.</span>
              <span className="text-white">shared</span>
              <span className="text-gray-400">!.</span>
              <span className="text-white">fetchProducts</span>
              <span className="text-gray-400">()</span>
              {"\n\n"}
              <span className="text-purple-400">let</span>{" "}
              <span className="text-white">tx</span>{" "}
              <span className="text-gray-400">=</span>{" "}
              <span className="text-purple-400">try await</span>{" "}
              <span className="text-teal-300">EuroPayKit</span>
              <span className="text-gray-400">.</span>
              <span className="text-white">shared</span>
              <span className="text-gray-400">!.</span>
              <span className="text-white">purchase</span>
              <span className="text-gray-400">(</span>
              {"\n"}
              {"  "}
              <span className="text-white">product</span>
              <span className="text-gray-400">:</span>{" "}
              <span className="text-white">products</span>
              <span className="text-gray-400">[</span>
              <span className="text-orange-300">0</span>
              <span className="text-gray-400">],</span>
              {"\n"}
              {"  "}
              <span className="text-white">userId</span>
              <span className="text-gray-400">:</span>{" "}
              <span className="text-orange-300">&quot;user_123&quot;</span>
              <span className="text-gray-400">,</span>
              {"\n"}
              {"  "}
              <span className="text-white">presenting</span>
              <span className="text-gray-400">:</span>{" "}
              <span className="text-white">viewController</span>
              {"\n"}
              <span className="text-gray-400">)</span>
              {"\n\n"}
              <span className="text-purple-400">if</span>{" "}
              <span className="text-white">tx</span>
              <span className="text-gray-400">.</span>
              <span className="text-white">status</span>{" "}
              <span className="text-gray-400">==</span>{" "}
              <span className="text-gray-400">.</span>
              <span className="text-teal-300">succeeded</span>{" "}
              <span className="text-gray-400">{"{"}</span>{" "}
              <span className="text-white">unlockPremium</span>
              <span className="text-gray-400">()</span>{" "}
              <span className="text-gray-400">{"}"}</span>
            </code>
          </pre>
        </div>
      </section>

      {/* Test it */}
      <section className="mt-12">
        <h2 className="text-xl font-semibold text-white">Test It</h2>
        <p className="mt-3 text-sm text-gray-400">
          API keys starting with{" "}
          <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs font-mono text-teal-300">europay_test_</code>{" "}
          use Stripe test mode automatically. Use card{" "}
          <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs font-mono text-teal-300">4242 4242 4242 4242</code>{" "}
          with any future expiry and any CVC.
        </p>
      </section>

      {/* Next steps */}
      <section className="mt-12 rounded-lg border border-white/10 bg-white/[0.03] px-6 py-5">
        <p className="text-sm font-medium text-white">Next steps</p>
        <ul className="mt-2 space-y-1.5 text-sm text-gray-400">
          <li>
            <Link
              href="/docs/integration-guide"
              className="text-teal-400 underline underline-offset-2 hover:text-teal-300"
            >
              Integration Guide
            </Link>{" "}
            — error handling, entitlements, subscriptions, non-EU fallback
          </li>
          <li>
            <Link
              href="/docs/dma-compliance"
              className="text-teal-400 underline underline-offset-2 hover:text-teal-300"
            >
              DMA Compliance
            </Link>{" "}
            — Apple entitlement setup and what the SDK handles for you
          </li>
          <li>
            <Link
              href="/docs/api-reference"
              className="text-teal-400 underline underline-offset-2 hover:text-teal-300"
            >
              API Reference
            </Link>{" "}
            — full REST API documentation
          </li>
        </ul>
      </section>
    </article>
  )
}
