import Link from "next/link"
import { DocsNavigation } from "../DocsNavigation"

export default function GettingStartedPage() {
  return (
    <article className="prose-docs">
      <h1 className="text-4xl font-bold tracking-tight text-white">
        Getting Started
      </h1>
      <p className="mt-4 text-lg text-gray-400">
        Add alternative payments to your iOS app in 5 minutes.
      </p>

      {/* What is EuroPay? */}
      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-white">
          What is EuroPay?
        </h2>
        <div className="mt-4 space-y-3 text-base text-gray-300 leading-relaxed">
          <p>
            The EU Digital Markets Act requires Apple to let iOS developers use
            alternative payment processors for EU users. This means you can
            bypass Apple&apos;s 30% commission and process payments through
            Stripe instead — keeping significantly more revenue per transaction.
          </p>
          <p>
            EuroPay is an iOS SDK and backend service that handles this for you.
            You add{" "}
            <strong className="text-white">EuroPayKit</strong> to your app, and
            it takes care of EU region detection, Apple&apos;s required DMA
            disclosure modal, Stripe checkout, entitlement management, Apple
            transaction reporting, VAT, and transactional emails. Your app uses
            Apple IAP as normal for non-EU users.
          </p>
          <p>
            When an EU user hits your paywall, EuroPayKit detects their region,
            shows Apple&apos;s mandatory disclosure, then opens a Stripe
            checkout. After payment, EuroPay grants the entitlement, reports the
            transaction to Apple, and sends the customer a receipt. You check{" "}
            <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs font-mono text-teal-300">hasAccess(to:)</code>{" "}
            to gate content — same pattern as StoreKit.
          </p>
          <p>
            Total fees:{" "}
            <strong className="text-white">~8%</strong> (Stripe processing
            ~1.5% + &euro;0.25, Apple&apos;s Core Technology Fee ~5%, EuroPay
            1.5%) vs Apple IAP&apos;s 15–30%. For most apps this means 2–3x
            more revenue per EU transaction.
          </p>
        </div>
      </section>

      {/* What this guide covers */}
      <section className="mt-10">
        <h2 className="text-2xl font-semibold text-white">
          What this guide covers
        </h2>
        <ul className="mt-4 space-y-2 text-base text-gray-300 leading-relaxed">
          <li className="flex items-start gap-3">
            <span className="mt-0.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-teal-400" />
            Install the EuroPayKit iOS SDK
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-0.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-teal-400" />
            Accept your first EU payment via Stripe
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-0.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-teal-400" />
            Verify the entitlement was granted
          </li>
        </ul>
        <p className="mt-4 text-base text-gray-300 leading-relaxed">
          By the end, you&apos;ll have a working checkout flow for EU users —
          EuroPay handles the DMA disclosure, Stripe checkout, Apple reporting,
          and entitlement management automatically.
        </p>
      </section>

      {/* How it works */}
      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-white">How it works</h2>
        <div className="mt-6 flex flex-col items-stretch gap-3 md:flex-row md:items-center">
          <div className="flex-1 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-center">
            <p className="text-sm font-medium text-white">Your App</p>
            <p className="mt-1 text-xs text-gray-500">
              Region check
              <br />
              + purchase()
            </p>
          </div>
          <div className="shrink-0 py-1 text-center text-sm text-teal-400 md:py-0 md:px-1">
            <span className="hidden md:inline">&rarr;</span>
            <span className="inline md:hidden">&darr;</span>
          </div>
          <div className="flex-1 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-center">
            <p className="text-sm font-medium text-white">EuroPayKit</p>
            <p className="mt-1 text-xs text-gray-500">
              DMA disclosure
              <br />
              + Safari checkout
            </p>
          </div>
          <div className="shrink-0 py-1 text-center text-sm text-teal-400 md:py-0 md:px-1">
            <span className="hidden md:inline">&rarr;</span>
            <span className="inline md:hidden">&darr;</span>
          </div>
          <div className="flex-1 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-center">
            <p className="text-sm font-medium text-white">Stripe Checkout</p>
            <p className="mt-1 text-xs text-gray-500">
              User pays
              <br />
              via Stripe
            </p>
          </div>
          <div className="shrink-0 py-1 text-center text-sm text-teal-400 md:py-0 md:px-1">
            <span className="hidden md:inline">&rarr;</span>
            <span className="inline md:hidden">&darr;</span>
          </div>
          <div className="flex-1 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-center">
            <p className="text-sm font-medium text-white">Entitlement Granted</p>
            <p className="mt-1 text-xs text-gray-500">
              Automatic
              <br />
              via webhook
            </p>
          </div>
        </div>
        <p className="mt-4 text-base text-gray-300 leading-relaxed">
          You only write code for step 1. EuroPay handles steps 2–4.
        </p>
      </section>

      {/* Prerequisites */}
      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-white">Prerequisites</h2>
        <ul className="mt-4 space-y-3 text-base text-gray-300 leading-relaxed">
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
        <h2 className="text-2xl font-semibold text-white">Install the SDK</h2>
        <p className="mt-3 text-base text-gray-300 leading-relaxed">
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
        <h2 className="text-2xl font-semibold text-white">Configure</h2>
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
        <p className="mt-3 text-base text-gray-300 leading-relaxed">
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
        <h2 className="text-2xl font-semibold text-white">
          Check Region &amp; Purchase
        </h2>
        <p className="mt-3 text-base text-gray-300 leading-relaxed">
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

      {/* Handle the result */}
      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-white">
          Handle the Result
        </h2>
        <p className="mt-3 text-base text-gray-300 leading-relaxed">
          After a successful purchase, verify the entitlement was granted:
        </p>
        <div className="mt-4 overflow-x-auto rounded-lg border border-white/10 bg-white/5 px-5 py-4">
          <pre className="text-sm leading-relaxed font-mono">
            <code>
              <span className="text-gray-500">// After successful purchase, verify the entitlement</span>
              {"\n"}
              <span className="text-purple-400">try await</span>{" "}
              <span className="text-teal-300">EuroPayKit</span>
              <span className="text-gray-400">.</span>
              <span className="text-white">shared</span>
              <span className="text-gray-400">!.</span>
              <span className="text-white">refreshEntitlements</span>
              <span className="text-gray-400">(</span>
              <span className="text-white">userId</span>
              <span className="text-gray-400">:</span>{" "}
              <span className="text-orange-300">&quot;your-user-id&quot;</span>
              <span className="text-gray-400">)</span>
              {"\n\n"}
              <span className="text-purple-400">if</span>{" "}
              <span className="text-teal-300">EuroPayKit</span>
              <span className="text-gray-400">.</span>
              <span className="text-white">shared</span>
              <span className="text-gray-400">!.</span>
              <span className="text-white">hasAccess</span>
              <span className="text-gray-400">(</span>
              <span className="text-white">to</span>
              <span className="text-gray-400">:</span>{" "}
              <span className="text-orange-300">&quot;premium&quot;</span>
              <span className="text-gray-400">)</span>{" "}
              <span className="text-gray-400">{"{"}</span>
              {"\n"}
              {"  "}
              <span className="text-gray-500">// Unlock premium content</span>
              {"\n"}
              <span className="text-gray-400">{"}"}</span>
            </code>
          </pre>
        </div>
        <p className="mt-3 text-base text-gray-300 leading-relaxed">
          EuroPay grants entitlements automatically when the Stripe webhook
          confirms payment. Call{" "}
          <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs font-mono text-teal-300">refreshEntitlements</code>{" "}
          on app launch or after purchase to sync the latest state. Use{" "}
          <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs font-mono text-teal-300">hasAccess(to:)</code>{" "}
          to gate premium content.
        </p>
      </section>

      {/* Test it */}
      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-white">Test It</h2>
        <p className="mt-3 text-base text-gray-300 leading-relaxed">
          API keys starting with{" "}
          <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs font-mono text-teal-300">europay_test_</code>{" "}
          use Stripe test mode automatically. Walk through a full end-to-end test:
        </p>
        <div className="mt-6 space-y-4">
          <div className="flex gap-4">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-500/10 text-xs font-bold text-teal-400 border border-teal-500/20">
              1
            </div>
            <p className="text-base text-gray-300 leading-relaxed">
              In the EuroPay dashboard, make sure your app is in{" "}
              <strong className="text-white">Sandbox mode</strong> (toggle in
              app settings).
            </p>
          </div>
          <div className="flex gap-4">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-500/10 text-xs font-bold text-teal-400 border border-teal-500/20">
              2
            </div>
            <p className="text-base text-gray-300 leading-relaxed">
              Trigger a purchase in your app — the SDK will open a Stripe test
              checkout.
            </p>
          </div>
          <div className="flex gap-4">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-500/10 text-xs font-bold text-teal-400 border border-teal-500/20">
              3
            </div>
            <p className="text-base text-gray-300 leading-relaxed">
              Use card number{" "}
              <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs font-mono text-teal-300">4242 4242 4242 4242</code>
              , any future expiry, any CVC.
            </p>
          </div>
          <div className="flex gap-4">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-500/10 text-xs font-bold text-teal-400 border border-teal-500/20">
              4
            </div>
            <p className="text-base text-gray-300 leading-relaxed">
              After payment, check your{" "}
              <strong className="text-white">Webhook Log</strong> in the
              dashboard — you should see a{" "}
              <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs font-mono text-teal-300">checkout.session.completed</code>{" "}
              event with status &ldquo;Processed&rdquo;.
            </p>
          </div>
        </div>
        <p className="mt-4 text-base text-gray-300 leading-relaxed">
          If the webhook shows &ldquo;Processed&rdquo; and your entitlement
          check returns true, your integration is working end-to-end.
        </p>
      </section>

      {/* Timeline callout */}
      <section className="mt-12 rounded-lg border border-teal-500/20 bg-teal-500/5 px-6 py-5">
        <p className="text-sm font-medium text-white">
          How long does this take?
        </p>
        <p className="mt-2 text-base text-gray-300 leading-relaxed">
          The code integration takes about an hour. The longest wait is Apple
          approving your External Purchase Link Entitlement, which typically
          takes 2–5 business days. You can build and test your integration in
          Sandbox mode while waiting for approval.
        </p>
      </section>

      <DocsNavigation
        next={{ href: "/docs/integration-guide", label: "Integration Guide" }}
      />
    </article>
  )
}
