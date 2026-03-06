import Link from "next/link"
import { DocsNavigation } from "../DocsNavigation"

export default function IntegrationGuidePage() {
  return (
    <article className="prose-docs">
      <h1 className="text-4xl font-bold tracking-tight text-white">
        Integration Guide
      </h1>
      <p className="mt-4 text-lg text-gray-400">
        Everything beyond the{" "}
        <Link
          href="/docs/getting-started"
          className="text-teal-400 underline underline-offset-2 hover:text-teal-300"
        >
          quickstart
        </Link>
        . Each section is self-contained — skip to what you need.
      </p>

      {/* 1. Handling Errors */}
      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-white">
          1. Handling Errors
        </h2>
        <p className="mt-3 text-base text-gray-300 leading-relaxed">
          <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs font-mono text-teal-300">purchase()</code>{" "}
          returns an <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs font-mono text-teal-300">EuroPayTransaction</code>{" "}
          on success or throws an <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs font-mono text-teal-300">EuroPayError</code>:
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
              <span className="text-white">product</span>
              <span className="text-gray-400">:</span>{" "}
              <span className="text-white">product</span>
              <span className="text-gray-400">,</span>{" "}
              <span className="text-white">userId</span>
              <span className="text-gray-400">:</span>{" "}
              <span className="text-orange-300">&quot;user_123&quot;</span>
              <span className="text-gray-400">,</span>{" "}
              <span className="text-white">presenting</span>
              <span className="text-gray-400">:</span>{" "}
              <span className="text-white">vc</span>
              <span className="text-gray-400">)</span>
              {"\n\n"}
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
              <span className="text-gray-400">:</span>{" "}
              <span className="text-white">unlockPremium</span>
              <span className="text-gray-400">()</span>
              {"\n"}
              {"  "}
              <span className="text-purple-400">case</span>{" "}
              <span className="text-gray-400">.</span>
              <span className="text-teal-300">pending</span>
              <span className="text-gray-400">:</span>{"  "}
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
              {"\n"}
              <span className="text-gray-400">{"}"}</span>{" "}
              <span className="text-purple-400">catch</span>{" "}
              <span className="text-teal-300">EuroPayError</span>
              <span className="text-gray-400">.</span>
              <span className="text-white">regionNotSupported</span>{" "}
              <span className="text-gray-400">{"{"}</span>
              {"\n"}
              {"  "}
              <span className="text-white">fallbackToStoreKit</span>
              <span className="text-gray-400">()</span>
              {"\n"}
              <span className="text-gray-400">{"}"}</span>{" "}
              <span className="text-purple-400">catch</span>{" "}
              <span className="text-teal-300">EuroPayError</span>
              <span className="text-gray-400">.</span>
              <span className="text-white">verificationTimeout</span>{" "}
              <span className="text-gray-400">{"{"}</span>
              {"\n"}
              {"  "}
              <span className="text-gray-500">// Payment may have succeeded — retry entitlement check</span>
              {"\n"}
              {"  "}
              <span className="text-white">showRetryMessage</span>
              <span className="text-gray-400">()</span>
              {"\n"}
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
          <p className="text-base text-gray-300 leading-relaxed">
            <strong className="text-white">Error types:</strong>
          </p>
          <ul className="mt-2 space-y-1.5 text-base text-gray-300 leading-relaxed">
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
              — payment may have succeeded but entitlement wasn&apos;t confirmed in time
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

      {/* 2. Checking Entitlements */}
      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-white">
          2. Checking Entitlements
        </h2>
        <p className="mt-3 text-base text-gray-300 leading-relaxed">
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
        <p className="mt-3 text-base text-gray-300 leading-relaxed">
          The SDK publishes <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs font-mono text-teal-300">@Published entitlements</code> — observe it in SwiftUI to reactively update your UI when access changes.
        </p>
      </section>

      {/* 3. Subscription Management */}
      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-white">
          3. Subscription Management
        </h2>
        <p className="mt-3 text-base text-gray-300 leading-relaxed">
          Let subscribers manage their plan through Stripe&apos;s Customer Portal:
        </p>
        <div className="mt-4 overflow-x-auto rounded-lg border border-white/10 bg-white/5 px-5 py-4">
          <pre className="text-sm leading-relaxed font-mono">
            <code>
              <span className="text-purple-400">try await</span>{" "}
              <span className="text-teal-300">EuroPayKit</span>
              <span className="text-gray-400">.</span>
              <span className="text-white">shared</span>
              <span className="text-gray-400">!.</span>
              <span className="text-white">openCustomerPortal</span>
              <span className="text-gray-400">(</span>
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
            </code>
          </pre>
        </div>
        <p className="mt-3 text-base text-gray-300 leading-relaxed">
          The portal lets users update payment methods, view invoices, and cancel
          or change their subscription. No additional UI needed on your side.
        </p>
      </section>

      {/* 4. SwiftUI Integration */}
      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-white">
          4. SwiftUI Integration
        </h2>
        <p className="mt-3 text-base text-gray-300 leading-relaxed">
          A complete paywall view with product loading and purchase:
        </p>
        <div className="mt-4 overflow-x-auto rounded-lg border border-white/10 bg-white/5 px-5 py-4">
          <pre className="text-sm leading-relaxed font-mono">
            <code>
              <span className="text-purple-400">struct</span>{" "}
              <span className="text-teal-300">PaywallView</span>
              <span className="text-gray-400">:</span>{" "}
              <span className="text-teal-300">View</span>{" "}
              <span className="text-gray-400">{"{"}</span>
              {"\n"}
              {"  "}
              <span className="text-purple-400">@State</span>{" "}
              <span className="text-purple-400">private var</span>{" "}
              <span className="text-white">products</span>
              <span className="text-gray-400">:</span>{" "}
              <span className="text-gray-400">[</span>
              <span className="text-teal-300">EuroPayProduct</span>
              <span className="text-gray-400">]</span>{" "}
              <span className="text-gray-400">=</span>{" "}
              <span className="text-gray-400">[]</span>
              {"\n\n"}
              {"  "}
              <span className="text-purple-400">var</span>{" "}
              <span className="text-white">body</span>
              <span className="text-gray-400">:</span>{" "}
              <span className="text-purple-400">some</span>{" "}
              <span className="text-teal-300">View</span>{" "}
              <span className="text-gray-400">{"{"}</span>
              {"\n"}
              {"    "}
              <span className="text-teal-300">ForEach</span>
              <span className="text-gray-400">(</span>
              <span className="text-white">products</span>
              <span className="text-gray-400">)</span>{" "}
              <span className="text-gray-400">{"{"}</span>{" "}
              <span className="text-white">product</span>{" "}
              <span className="text-purple-400">in</span>
              {"\n"}
              {"      "}
              <span className="text-teal-300">Button</span>
              <span className="text-gray-400">(</span>
              <span className="text-white">product</span>
              <span className="text-gray-400">.</span>
              <span className="text-white">name</span>
              <span className="text-gray-400">)</span>{" "}
              <span className="text-gray-400">{"{"}</span>
              {"\n"}
              {"        "}
              <span className="text-teal-300">Task</span>{" "}
              <span className="text-gray-400">{"{"}</span>{" "}
              <span className="text-purple-400">await</span>{" "}
              <span className="text-white">buy</span>
              <span className="text-gray-400">(</span>
              <span className="text-white">product</span>
              <span className="text-gray-400">)</span>{" "}
              <span className="text-gray-400">{"}"}</span>
              {"\n"}
              {"      "}
              <span className="text-gray-400">{"}"}</span>
              {"\n"}
              {"    "}
              <span className="text-gray-400">{"}"}</span>
              {"\n"}
              {"    "}
              <span className="text-gray-400">.</span>
              <span className="text-white">task</span>{" "}
              <span className="text-gray-400">{"{"}</span>
              {"\n"}
              {"      "}
              <span className="text-white">products</span>{" "}
              <span className="text-gray-400">=</span>{" "}
              <span className="text-gray-400">(</span>
              <span className="text-purple-400">try?</span>{" "}
              <span className="text-purple-400">await</span>{" "}
              <span className="text-teal-300">EuroPayKit</span>
              <span className="text-gray-400">.</span>
              <span className="text-white">shared</span>
              <span className="text-gray-400">!.</span>
              <span className="text-white">fetchProducts</span>
              <span className="text-gray-400">())</span>{" "}
              <span className="text-gray-400">??</span>{" "}
              <span className="text-gray-400">[]</span>
              {"\n"}
              {"    "}
              <span className="text-gray-400">{"}"}</span>
              {"\n"}
              {"  "}
              <span className="text-gray-400">{"}"}</span>
              {"\n\n"}
              {"  "}
              <span className="text-purple-400">private func</span>{" "}
              <span className="text-white">buy</span>
              <span className="text-gray-400">(</span>
              <span className="text-purple-400">_</span>{" "}
              <span className="text-white">product</span>
              <span className="text-gray-400">:</span>{" "}
              <span className="text-teal-300">EuroPayProduct</span>
              <span className="text-gray-400">)</span>{" "}
              <span className="text-purple-400">async</span>{" "}
              <span className="text-gray-400">{"{"}</span>
              {"\n"}
              {"    "}
              <span className="text-purple-400">guard let</span>{" "}
              <span className="text-white">vc</span>{" "}
              <span className="text-gray-400">=</span>{" "}
              <span className="text-teal-300">UIApplication</span>
              <span className="text-gray-400">.</span>
              <span className="text-white">shared</span>
              <span className="text-gray-400">.</span>
              <span className="text-white">connectedScenes</span>
              {"\n"}
              {"      "}
              <span className="text-gray-400">.</span>
              <span className="text-white">compactMap</span>
              <span className="text-gray-400">({"{"}</span>{" "}
              <span className="text-white">$0</span>{" "}
              <span className="text-purple-400">as?</span>{" "}
              <span className="text-teal-300">UIWindowScene</span>{" "}
              <span className="text-gray-400">{"}"})</span>
              {"\n"}
              {"      "}
              <span className="text-gray-400">.</span>
              <span className="text-white">first</span>
              <span className="text-gray-400">?.</span>
              <span className="text-white">windows</span>
              <span className="text-gray-400">.</span>
              <span className="text-white">first</span>
              <span className="text-gray-400">?.</span>
              <span className="text-white">rootViewController</span>
              {"\n"}
              {"    "}
              <span className="text-purple-400">else</span>{" "}
              <span className="text-gray-400">{"{"}</span>{" "}
              <span className="text-purple-400">return</span>{" "}
              <span className="text-gray-400">{"}"}</span>
              {"\n\n"}
              {"    "}
              <span className="text-purple-400">do</span>{" "}
              <span className="text-gray-400">{"{"}</span>
              {"\n"}
              {"      "}
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
              <span className="text-white">product</span>
              <span className="text-gray-400">:</span>{" "}
              <span className="text-white">product</span>
              <span className="text-gray-400">,</span>{" "}
              <span className="text-white">userId</span>
              <span className="text-gray-400">:</span>{" "}
              <span className="text-orange-300">&quot;user_123&quot;</span>
              <span className="text-gray-400">,</span>{" "}
              <span className="text-white">presenting</span>
              <span className="text-gray-400">:</span>{" "}
              <span className="text-white">vc</span>
              <span className="text-gray-400">)</span>
              {"\n"}
              {"      "}
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
              {"\n"}
              {"    "}
              <span className="text-gray-400">{"}"}</span>{" "}
              <span className="text-purple-400">catch</span>{" "}
              <span className="text-teal-300">EuroPayError</span>
              <span className="text-gray-400">.</span>
              <span className="text-white">userCancelled</span>{" "}
              <span className="text-gray-400">{"{"}</span>
              {"\n"}
              {"      "}
              <span className="text-gray-500">// User dismissed</span>
              {"\n"}
              {"    "}
              <span className="text-gray-400">{"}"}</span>{" "}
              <span className="text-purple-400">catch</span>{" "}
              <span className="text-gray-400">{"{"}</span>
              {"\n"}
              {"      "}
              <span className="text-white">print</span>
              <span className="text-gray-400">(</span>
              <span className="text-white">error</span>
              <span className="text-gray-400">)</span>
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

      {/* 5. Checkout Return Handling */}
      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-white">
          5. Checkout Return Handling
        </h2>
        <p className="mt-3 text-base text-gray-300 leading-relaxed">
          After Stripe Checkout completes, the browser redirects back to your app via
          the <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs font-mono text-teal-300">returnScheme</code>{" "}
          you configured. The simplest approach:
        </p>
        <div className="mt-4 overflow-x-auto rounded-lg border border-white/10 bg-white/5 px-5 py-4">
          <pre className="text-sm leading-relaxed font-mono">
            <code>
              <span className="text-teal-300">ContentView</span>
              <span className="text-gray-400">()</span>
              {"\n"}
              {"  "}
              <span className="text-gray-400">.</span>
              <span className="text-white">euroPayCheckoutReturnHandler</span>
              <span className="text-gray-400">()</span>
            </code>
          </pre>
        </div>
        <p className="mt-3 text-base text-gray-300 leading-relaxed">
          For manual control (e.g. logging), use <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs font-mono text-teal-300">.onOpenURL</code> instead:
        </p>
        <div className="mt-4 overflow-x-auto rounded-lg border border-white/10 bg-white/5 px-5 py-4">
          <pre className="text-sm leading-relaxed font-mono">
            <code>
              <span className="text-teal-300">ContentView</span>
              <span className="text-gray-400">()</span>
              {"\n"}
              {"  "}
              <span className="text-gray-400">.</span>
              <span className="text-white">onOpenURL</span>{" "}
              <span className="text-gray-400">{"{"}</span>{" "}
              <span className="text-white">url</span>{" "}
              <span className="text-purple-400">in</span>
              {"\n"}
              {"    "}
              <span className="text-teal-300">EuroPayCheckoutSheet</span>
              <span className="text-gray-400">.</span>
              <span className="text-white">handleReturnURL</span>
              <span className="text-gray-400">(</span>
              <span className="text-white">url</span>
              <span className="text-gray-400">)</span>
              {"\n"}
              {"  "}
              <span className="text-gray-400">{"}"}</span>
            </code>
          </pre>
        </div>
        <p className="mt-3 text-base text-gray-300 leading-relaxed">
          Pick one — don&apos;t use both. Make sure the URL scheme in your{" "}
          <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs font-mono text-teal-300">Info.plist</code>{" "}
          matches the{" "}
          <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs font-mono text-teal-300">returnScheme</code>{" "}
          in <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs font-mono text-teal-300">EuroPayConfig</code>.
        </p>
      </section>

      {/* 6. Apple Entitlement Setup */}
      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-white">
          6. Apple Entitlement Setup
        </h2>
        <p className="mt-3 text-base text-gray-300 leading-relaxed">
          Before submitting to the App Store, request the{" "}
          <strong className="text-white">
            External Purchase Link Entitlement
          </strong>{" "}
          in{" "}
          <a
            href="https://appstoreconnect.apple.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-teal-400 hover:underline"
          >
            App Store Connect
          </a>
          . Then add these keys to your{" "}
          <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs font-mono text-teal-300">Info.plist</code>:
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
              {"\n\n"}
              <span className="text-gray-500">&lt;</span>
              <span className="text-teal-300">key</span>
              <span className="text-gray-500">&gt;</span>
              com.apple.developer.associated-domains
              <span className="text-gray-500">&lt;/</span>
              <span className="text-teal-300">key</span>
              <span className="text-gray-500">&gt;</span>
              {"\n"}
              <span className="text-gray-500">&lt;</span>
              <span className="text-teal-300">array</span>
              <span className="text-gray-500">&gt;</span>
              {"\n"}
              {"  "}
              <span className="text-gray-500">&lt;</span>
              <span className="text-teal-300">string</span>
              <span className="text-gray-500">&gt;</span>
              applinks:europay.dev
              <span className="text-gray-500">&lt;/</span>
              <span className="text-teal-300">string</span>
              <span className="text-gray-500">&gt;</span>
              {"\n"}
              <span className="text-gray-500">&lt;/</span>
              <span className="text-teal-300">array</span>
              <span className="text-gray-500">&gt;</span>
            </code>
          </pre>
        </div>
        <p className="mt-3 text-xs text-gray-500">
          You must agree to Apple&apos;s Alternative Terms Addendum for Apps in the EU.
          Approval typically takes 2–5 business days. See{" "}
          <Link
            href="/docs/dma-compliance"
            className="text-teal-400 hover:underline"
          >
            DMA Compliance
          </Link>{" "}
          for full details.
        </p>
      </section>

      {/* 7. Non-EU Users */}
      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-white">
          7. Non-EU Users
        </h2>
        <p className="mt-3 text-base text-gray-300 leading-relaxed">
          EuroPay only works for EU App Store regions. Use{" "}
          <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs font-mono text-teal-300">checkRegion()</code>{" "}
          to decide which flow to show:
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
              <span className="text-white">showEuroPayButton</span>
              <span className="text-gray-400">()</span>
              {"\n"}
              <span className="text-purple-400">case</span>{" "}
              <span className="text-gray-400">.</span>
              <span className="text-teal-300">notSupported</span>
              <span className="text-gray-400">:</span>
              {"\n"}
              {"  "}
              <span className="text-white">showStoreKitButton</span>
              <span className="text-gray-400">()</span>
              {"\n"}
              <span className="text-gray-400">{"}"}</span>
            </code>
          </pre>
        </div>
        <p className="mt-3 text-base text-gray-300 leading-relaxed">
          Region detection uses StoreKit 2&apos;s{" "}
          <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs font-mono text-teal-300">Storefront.current</code>{" "}
          — it checks the user&apos;s actual App Store country, not IP geolocation.
        </p>
      </section>

      {/* Sandbox */}
      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-white">
          Sandbox &amp; Test Mode
        </h2>
        <p className="mt-3 text-base text-gray-300 leading-relaxed">
          API keys starting with <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs font-mono text-teal-300">europay_test_</code>{" "}
          use Stripe test mode automatically.
        </p>
        <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.03] px-5 py-4">
          <p className="text-sm font-medium text-white">Test card numbers</p>
          <ul className="mt-2 space-y-1.5 text-base text-gray-300 leading-relaxed">
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
          <p className="mt-3 text-base text-gray-300 leading-relaxed">
            Use any future expiry date and any 3-digit CVC.
          </p>
        </div>
        <p className="mt-4 text-base text-gray-300 leading-relaxed">
          To test EU region detection in the Simulator, set the storefront to
          an EU country in{" "}
          <strong className="text-white">
            Settings &rarr; App Store &rarr; Country
          </strong>
          , or use a Sandbox Apple ID registered in an EU country.
        </p>
      </section>

      {/* Custom Email Handling */}
      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-white">
          Custom Email Handling
        </h2>
        <p className="mt-3 text-base text-gray-300 leading-relaxed">
          By default, EuroPay sends transactional emails to your end customers
          on your behalf: purchase confirmations, withdrawal waiver
          confirmations (Widerrufsrecht), and cancellation notifications. These
          emails identify your app as the merchant and comply with EU consumer
          law requirements.
        </p>
        <p className="mt-3 text-base text-gray-300 leading-relaxed">
          If you prefer to send your own branded emails, you can disable
          EuroPay&apos;s end-customer emails in your app settings
          (&quot;End-customer emails&quot; toggle). When disabled, all data
          needed for legally compliant emails is included in webhook events
          under the{" "}
          <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs font-mono text-teal-300">
            europay
          </code>{" "}
          key: customer email, product name, amount, currency, transaction ID,
          and withdrawal waiver details (accepted status, timestamp, locale,
          and the exact text the customer agreed to).
        </p>
        <div className="mt-4 rounded-lg border border-orange-200/30 bg-orange-500/5 px-5 py-4">
          <p className="text-sm text-orange-300 leading-relaxed">
            <strong className="text-orange-200">Warning:</strong> If you handle
            emails yourself, you are responsible for sending legally required
            purchase confirmations and withdrawal waiver confirmations under EU
            consumer law (Consumer Rights Directive 2011/83/EU, German BGB
            &sect;&sect;312d, 356). Failure to send these may expose you to
            legal liability.
          </p>
        </div>
      </section>

      <DocsNavigation
        prev={{ href: "/docs/getting-started", label: "Getting Started" }}
        next={{ href: "/docs/dma-compliance", label: "DMA Compliance" }}
      />
    </article>
  )
}
