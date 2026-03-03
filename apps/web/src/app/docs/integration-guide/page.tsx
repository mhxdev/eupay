import Link from "next/link"

export default function IntegrationGuidePage() {
  return (
    <article className="prose-docs">
      <h1 className="text-3xl font-bold tracking-tight text-white">
        Integration Guide
      </h1>
      <p className="mt-4 text-lg text-gray-400">
        A complete walkthrough of integrating EuroPayKit into a SwiftUI app —
        from setup to production.
      </p>

      {/* Full SwiftUI integration */}
      <section className="mt-12">
        <h2 className="text-xl font-semibold text-white">
          Full SwiftUI Integration
        </h2>
        <p className="mt-3 text-sm text-gray-400">
          A typical integration has three parts: configure the SDK at launch,
          fetch products, and present the purchase flow.
        </p>
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
              <span className="text-orange-300">&quot;europay_live_...&quot;</span>
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
              <span className="text-orange-300">&quot;myapp://eupay-return&quot;</span>
              <span className="text-gray-400">,</span>
              {"\n"}
              {"      "}
              <span className="text-white">checkoutMode</span>
              <span className="text-gray-400">:</span>{" "}
              <span className="text-gray-400">.</span>
              <span className="text-teal-300">inAppSafari</span>
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
              <span className="text-teal-300">PaywallView</span>
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
      </section>

      {/* Handling purchase results */}
      <section className="mt-12">
        <h2 className="text-xl font-semibold text-white">
          Handling Purchase Results
        </h2>
        <p className="mt-3 text-sm text-gray-400">
          The <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs font-mono text-teal-300">purchase()</code> method returns an <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs font-mono text-teal-300">EuroPayTransaction</code> on success or throws an <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs font-mono text-teal-300">EuroPayError</code> on failure:
        </p>
        <div className="mt-4 overflow-x-auto rounded-lg border border-white/10 bg-white/5 px-5 py-4">
          <pre className="text-sm leading-relaxed font-mono">
            <code>
              <span className="text-purple-400">do</span>{" "}
              <span className="text-gray-400">{"{"}</span>
              {"\n"}
              {"  "}
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
              {"    "}
              <span className="text-white">product</span>
              <span className="text-gray-400">:</span>{" "}
              <span className="text-white">selectedProduct</span>
              <span className="text-gray-400">,</span>
              {"\n"}
              {"    "}
              <span className="text-white">userId</span>
              <span className="text-gray-400">:</span>{" "}
              <span className="text-orange-300">&quot;user_123&quot;</span>
              <span className="text-gray-400">,</span>
              {"\n"}
              {"    "}
              <span className="text-white">presenting</span>
              <span className="text-gray-400">:</span>{" "}
              <span className="text-white">viewController</span>
              {"\n"}
              {"  "}
              <span className="text-gray-400">)</span>
              {"\n\n"}
              {"  "}
              <span className="text-gray-500">// Success — unlock content</span>
              {"\n"}
              {"  "}
              <span className="text-purple-400">switch</span>{" "}
              <span className="text-white">tx</span>
              <span className="text-gray-400">.</span>
              <span className="text-white">status</span>{" "}
              <span className="text-gray-400">{"{"}</span>
              {"\n"}
              {"  "}
              <span className="text-purple-400">case</span>{" "}
              <span className="text-gray-400">.</span>
              <span className="text-teal-300">succeeded</span>
              <span className="text-gray-400">:</span>
              {"\n"}
              {"    "}
              <span className="text-white">unlockPremium</span>
              <span className="text-gray-400">()</span>
              {"\n"}
              {"  "}
              <span className="text-purple-400">case</span>{" "}
              <span className="text-gray-400">.</span>
              <span className="text-teal-300">pending</span>
              <span className="text-gray-400">:</span>
              {"\n"}
              {"    "}
              <span className="text-white">showPendingMessage</span>
              <span className="text-gray-400">()</span>
              {"\n"}
              {"  "}
              <span className="text-gray-400">{"}"}</span>
              {"\n\n"}
              <span className="text-gray-400">{"}"}</span>{" "}
              <span className="text-purple-400">catch</span>{" "}
              <span className="text-teal-300">EuroPayError</span>
              <span className="text-gray-400">.</span>
              <span className="text-white">userCancelled</span>{" "}
              <span className="text-gray-400">{"{"}</span>
              {"\n"}
              {"  "}
              <span className="text-gray-500">// User dismissed — do nothing</span>
              {"\n\n"}
              <span className="text-gray-400">{"}"}</span>{" "}
              <span className="text-purple-400">catch</span>{" "}
              <span className="text-teal-300">EuroPayError</span>
              <span className="text-gray-400">.</span>
              <span className="text-white">regionNotSupported</span>{" "}
              <span className="text-gray-400">{"{"}</span>
              {"\n"}
              {"  "}
              <span className="text-gray-500">// Not in EU — use StoreKit</span>
              {"\n"}
              {"  "}
              <span className="text-white">fallbackToStoreKit</span>
              <span className="text-gray-400">()</span>
              {"\n\n"}
              <span className="text-gray-400">{"}"}</span>{" "}
              <span className="text-purple-400">catch</span>{" "}
              <span className="text-teal-300">EuroPayError</span>
              <span className="text-gray-400">.</span>
              <span className="text-white">verificationTimeout</span>{" "}
              <span className="text-gray-400">{"{"}</span>
              {"\n"}
              {"  "}
              <span className="text-gray-500">// Payment may have succeeded</span>
              {"\n"}
              {"  "}
              <span className="text-white">showRetryMessage</span>
              <span className="text-gray-400">()</span>
              {"\n\n"}
              <span className="text-gray-400">{"}"}</span>{" "}
              <span className="text-purple-400">catch</span>{" "}
              <span className="text-gray-400">{"{"}</span>
              {"\n"}
              {"  "}
              <span className="text-white">showError</span>
              <span className="text-gray-400">(</span>
              <span className="text-white">error</span>
              <span className="text-gray-400">)</span>
              {"\n"}
              <span className="text-gray-400">{"}"}</span>
            </code>
          </pre>
        </div>
        <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.03] px-5 py-4">
          <p className="text-sm text-gray-400">
            <strong className="text-white">Error types:</strong>
          </p>
          <ul className="mt-2 space-y-1.5 text-sm text-gray-400">
            <li>
              <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs font-mono text-teal-300">.userCancelled</code>{" "}
              — user dismissed the disclosure or checkout
            </li>
            <li>
              <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs font-mono text-teal-300">.regionNotSupported</code>{" "}
              — user is not in an EU App Store region
            </li>
            <li>
              <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs font-mono text-teal-300">.verificationTimeout</code>{" "}
              — payment may have succeeded but entitlement wasn&apos;t confirmed in
              time
            </li>
            <li>
              <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs font-mono text-teal-300">.networkError(Error)</code>{" "}
              — a network request failed
            </li>
            <li>
              <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs font-mono text-teal-300">.invalidProduct</code>{" "}
              — the requested product was not found
            </li>
          </ul>
        </div>
      </section>

      {/* Entitlement verification */}
      <section className="mt-12">
        <h2 className="text-xl font-semibold text-white">
          Entitlement Verification
        </h2>
        <p className="mt-3 text-sm text-gray-400">
          After a successful purchase, entitlements are cached locally in the
          Keychain. Refresh them on app launch and check access anywhere:
        </p>
        <div className="mt-4 overflow-x-auto rounded-lg border border-white/10 bg-white/5 px-5 py-4">
          <pre className="text-sm leading-relaxed font-mono">
            <code>
              <span className="text-gray-500">// On app launch — sync with server</span>
              {"\n"}
              <span className="text-purple-400">await</span>{" "}
              <span className="text-teal-300">EuroPayKit</span>
              <span className="text-gray-400">.</span>
              <span className="text-white">shared</span>
              <span className="text-gray-400">!.</span>
              <span className="text-white">refreshEntitlements</span>
              <span className="text-gray-400">(</span>
              <span className="text-white">userId</span>
              <span className="text-gray-400">:</span>{" "}
              <span className="text-orange-300">&quot;user_123&quot;</span>
              <span className="text-gray-400">)</span>
              {"\n\n"}
              <span className="text-gray-500">// Check access anywhere in your app</span>
              {"\n"}
              <span className="text-purple-400">if</span>{" "}
              <span className="text-teal-300">EuroPayKit</span>
              <span className="text-gray-400">.</span>
              <span className="text-white">shared</span>
              <span className="text-gray-400">!.</span>
              <span className="text-white">hasAccess</span>
              <span className="text-gray-400">(</span>
              <span className="text-white">to</span>
              <span className="text-gray-400">:</span>{" "}
              <span className="text-orange-300">&quot;com.myapp.premium&quot;</span>
              <span className="text-gray-400">)</span>{" "}
              <span className="text-gray-400">{"{"}</span>
              {"\n"}
              {"  "}
              <span className="text-white">showPremiumContent</span>
              <span className="text-gray-400">()</span>
              {"\n"}
              <span className="text-gray-400">{"}"}</span>
            </code>
          </pre>
        </div>
        <p className="mt-3 text-sm text-gray-400">
          The SDK publishes <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs font-mono text-teal-300">@Published entitlements</code> — observe it in SwiftUI to reactively update your UI when access changes.
        </p>
      </section>

      {/* StoreKit fallback */}
      <section className="mt-12">
        <h2 className="text-xl font-semibold text-white">
          StoreKit Fallback for Non-EU Users
        </h2>
        <p className="mt-3 text-sm text-gray-400">
          EuroPay only works for users in EU App Store regions. Use{" "}
          <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs font-mono text-teal-300">checkRegion()</code>{" "}
          to decide which payment flow to show:
        </p>
        <div className="mt-4 overflow-x-auto rounded-lg border border-white/10 bg-white/5 px-5 py-4">
          <pre className="text-sm leading-relaxed font-mono">
            <code>
              <span className="text-purple-400">switch await</span>{" "}
              <span className="text-teal-300">EuroPayKit</span>
              <span className="text-gray-400">.</span>
              <span className="text-white">shared</span>
              <span className="text-gray-400">!.</span>
              <span className="text-white">checkRegion</span>
              <span className="text-gray-400">()</span>{" "}
              <span className="text-gray-400">{"{"}</span>
              {"\n"}
              <span className="text-purple-400">case</span>{" "}
              <span className="text-gray-400">.</span>
              <span className="text-teal-300">supported</span>
              <span className="text-gray-400">:</span>
              {"\n"}
              {"  "}
              <span className="text-gray-500">// EU user — show EuroPay checkout</span>
              {"\n"}
              {"  "}
              <span className="text-white">showEuroPayButton</span>
              <span className="text-gray-400">()</span>
              {"\n"}
              <span className="text-purple-400">case</span>{" "}
              <span className="text-gray-400">.</span>
              <span className="text-teal-300">notSupported</span>
              <span className="text-gray-400">:</span>
              {"\n"}
              {"  "}
              <span className="text-gray-500">// Non-EU — use native StoreKit</span>
              {"\n"}
              {"  "}
              <span className="text-white">showStoreKitButton</span>
              <span className="text-gray-400">()</span>
              {"\n"}
              <span className="text-gray-400">{"}"}</span>
            </code>
          </pre>
        </div>
        <p className="mt-3 text-sm text-gray-400">
          Region detection uses StoreKit 2&apos;s <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs font-mono text-teal-300">Storefront.current</code> — it checks the user&apos;s actual App Store country, not IP geolocation.
        </p>
      </section>

      {/* Sandbox / test mode */}
      <section className="mt-12">
        <h2 className="text-xl font-semibold text-white">
          Sandbox &amp; Test Mode
        </h2>
        <p className="mt-3 text-sm text-gray-400">
          During development, EuroPay uses Stripe&apos;s test mode automatically when
          your API key starts with <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs font-mono text-teal-300">europay_test_</code>.
        </p>
        <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.03] px-5 py-4">
          <p className="text-sm font-medium text-white">Test card numbers</p>
          <ul className="mt-2 space-y-1.5 text-sm text-gray-400">
            <li>
              <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs font-mono text-teal-300">4242 4242 4242 4242</code>{" "}
              — Successful payment
            </li>
            <li>
              <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs font-mono text-teal-300">4000 0000 0000 3220</code>{" "}
              — 3D Secure authentication required
            </li>
            <li>
              <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs font-mono text-teal-300">4000 0000 0000 0002</code>{" "}
              — Card declined
            </li>
          </ul>
          <p className="mt-3 text-sm text-gray-400">
            Use any future expiry date and any 3-digit CVC.
          </p>
        </div>
        <p className="mt-4 text-sm text-gray-400">
          To test EU region detection in the Simulator, set the storefront to
          an EU country in{" "}
          <strong className="text-white">
            Settings &rarr; App Store &rarr; Country
          </strong>
          , or use a Sandbox Apple ID registered in an EU country.
        </p>
      </section>

      {/* Next */}
      <section className="mt-12 rounded-lg border border-white/10 bg-white/[0.03] px-6 py-5">
        <p className="text-sm font-medium text-white">Next steps</p>
        <p className="mt-1 text-sm text-gray-400">
          See the{" "}
          <Link
            href="/docs/api-reference"
            className="text-teal-400 underline underline-offset-2 hover:text-teal-300"
          >
            API Reference
          </Link>{" "}
          for the full REST API, or read about{" "}
          <Link
            href="/docs/dma-compliance"
            className="text-teal-400 underline underline-offset-2 hover:text-teal-300"
          >
            DMA Compliance
          </Link>{" "}
          to understand what Apple requires.
        </p>
      </section>
    </article>
  )
}
