export default function DMACompliancePage() {
  return (
    <article className="prose-docs">
      <h1 className="text-3xl font-bold tracking-tight text-white">
        DMA Compliance
      </h1>
      <p className="mt-4 text-lg text-gray-400">
        How EuroPay keeps your app compliant with the EU Digital Markets Act so
        you can focus on building, not legal paperwork.
      </p>

      {/* Legal Basis */}
      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
          Legal Basis
        </h2>
        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          <a
            href="https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32022R1925"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.03] px-3 py-1.5 text-teal-400 hover:bg-white/[0.06] transition-colors"
          >
            EUR-Lex: DMA Full Text&nbsp;&#8599;
          </a>
          <a
            href="https://commission.europa.eu/strategy-and-policy/priorities-2019-2024/europe-fit-digital-age/digital-markets-act-ensuring-fair-and-open-digital-markets_en"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.03] px-3 py-1.5 text-teal-400 hover:bg-white/[0.06] transition-colors"
          >
            European Commission: DMA Overview&nbsp;&#8599;
          </a>
          <a
            href="https://developer.apple.com/support/dma-and-apps-in-the-eu/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.03] px-3 py-1.5 text-teal-400 hover:bg-white/[0.06] transition-colors"
          >
            Apple: DMA Compliance&nbsp;&#8599;
          </a>
          <a
            href="https://developer.apple.com/documentation/externalpurchaseserverapi"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.03] px-3 py-1.5 text-teal-400 hover:bg-white/[0.06] transition-colors"
          >
            Apple: External Purchase API Docs&nbsp;&#8599;
          </a>
        </div>
      </section>

      {/* What the DMA requires */}
      <section className="mt-12">
        <h2 className="text-xl font-semibold text-white">
          What the Digital Markets Act Requires
        </h2>
        <p className="mt-3 text-sm text-gray-400">
          The EU Digital Markets Act (DMA), specifically Article 5(7), requires
          Apple to allow iOS developers to use alternative payment processors
          for users in EU member states. This has been in effect since March
          2024.
        </p>
        <p className="mt-3 text-sm text-gray-400">
          In practice, this means:
        </p>
        <ul className="mt-4 space-y-3 text-sm text-gray-400">
          <li className="flex items-start gap-3">
            <span className="mt-0.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-teal-400" />
            <span>
              <strong className="text-white">Alternative payment processing</strong>{" "}
              — developers can use Stripe, or any other PSP, instead of Apple
              IAP for EU users
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-0.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-teal-400" />
            <span>
              <strong className="text-white">Informational disclosure</strong>{" "}
              — Apple requires a system-level disclosure modal informing the
              user they are leaving Apple&apos;s payment system before any
              alternative checkout is shown
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-0.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-teal-400" />
            <span>
              <strong className="text-white">
                Core Technology Fee (CTF)
              </strong>{" "}
              — Apple charges a 5% commission on alternative payment
              transactions (reduced from the initial 27% proposal after EU
              enforcement)
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-0.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-teal-400" />
            <span>
              <strong className="text-white">Transaction reporting</strong>{" "}
              — developers must report all external purchase transactions to
              Apple via their External Purchase Server API
            </span>
          </li>
        </ul>
      </section>

      {/* How EuroPay handles it */}
      <section className="mt-12">
        <h2 className="text-xl font-semibold text-white">
          How EuroPay Handles It
        </h2>
        <p className="mt-3 text-sm text-gray-400">
          EuroPay automates every DMA requirement so your integration stays
          simple.
        </p>

        <div className="mt-6 space-y-6">
          {/* Disclosure modal */}
          <div className="rounded-lg border border-white/10 bg-white/[0.03] px-5 py-4">
            <h3 className="text-base font-semibold text-white">
              Disclosure Modal
            </h3>
            <p className="mt-2 text-sm text-gray-400">
              On iOS 18.1+, the SDK calls Apple&apos;s{" "}
              <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs font-mono text-teal-300">
                ExternalPurchaseCustomLink.showNotice()
              </code>{" "}
              API to present Apple&apos;s official disclosure sheet. On older iOS
              versions, the SDK shows a custom DMA-compliant modal that
              mirrors Apple&apos;s language. Either way, the user must acknowledge
              the disclosure before reaching checkout.
            </p>
          </div>

          {/* Apple reporting */}
          <div className="rounded-lg border border-white/10 bg-white/[0.03] px-5 py-4">
            <h3 className="text-base font-semibold text-white">
              Apple Transaction Reporting
            </h3>
            <p className="mt-2 text-sm text-gray-400">
              EuroPay automatically reports every transaction to Apple&apos;s
              External Purchase Server API. This includes:
            </p>
            <ul className="mt-2 space-y-1.5 text-sm text-gray-400">
              <li className="flex items-start gap-2">
                <span className="mt-1 text-teal-400">&#8226;</span>
                Completed purchases — reported via Stripe webhook handler
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 text-teal-400">&#8226;</span>
                Subscription renewals — reported on each invoice payment
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 text-teal-400">&#8226;</span>
                Refunds — reported when Stripe issues a refund
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 text-teal-400">&#8226;</span>
                Abandoned checkouts — null tokens reported for sessions where
                the user didn&apos;t complete payment
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 text-teal-400">&#8226;</span>
                Nil reports — monthly cron job for months with zero transactions
              </li>
            </ul>
          </div>

          {/* CTC */}
          <div className="rounded-lg border border-white/10 bg-white/[0.03] px-5 py-4">
            <h3 className="text-base font-semibold text-white">
              Core Technology Fee (CTF)
            </h3>
            <p className="mt-2 text-sm text-gray-400">
              Apple&apos;s 5% CTF is calculated on each transaction and included in
              the fee breakdown shown in your dashboard. EuroPay tracks this
              automatically — you don&apos;t need to calculate or remit it
              separately. Apple invoices developers directly based on the
              transaction reports.
            </p>
            <div className="mt-4 rounded-md border border-white/5 bg-white/[0.02] px-4 py-3 space-y-2 text-sm text-gray-400">
              <p className="font-medium text-gray-300">CTF Details</p>
              <ul className="space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-teal-400">&#8226;</span>
                  <strong className="text-white">5% transaction commission</strong> — applied to all alternative-payment transactions for EU users
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-teal-400">&#8226;</span>
                  <strong className="text-white">&#8364;0.50 per first annual install</strong> — charged beyond 1&nbsp;million first annual installs in the EU
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-teal-400">&#8226;</span>
                  Apps earning under &#8364;10&nbsp;million in global revenue and under 1&nbsp;million EU first annual installs pay no per-install fee
                </li>
              </ul>
              <p className="text-xs text-gray-500 pt-1">
                Source:{" "}
                <a
                  href="https://developer.apple.com/support/core-technology-fee/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal-400 hover:underline"
                >
                  Apple Core Technology Fee
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What you need to do */}
      <section className="mt-12">
        <h2 className="text-xl font-semibold text-white">
          What You Need to Do
        </h2>
        <p className="mt-3 text-sm text-gray-400">
          Your only requirement is to request the External Purchase Link
          Entitlement from Apple. EuroPay handles everything else.
        </p>

        <div className="mt-6 space-y-4">
          <div className="flex gap-4">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-500/10 text-xs font-bold text-teal-400 border border-teal-500/20">
              1
            </div>
            <div>
              <p className="text-sm font-medium text-white">
                Request the entitlement in App Store Connect
              </p>
              <p className="mt-1 text-sm text-gray-400">
                Go to your app in{" "}
                <a
                  href="https://appstoreconnect.apple.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal-400 hover:underline"
                >
                  App Store Connect
                </a>{" "}
                and apply for the{" "}
                <strong className="text-white">
                  External Purchase Link Entitlement
                </strong>
                . Apple typically approves this within a few business days.
              </p>
              <p className="mt-2 text-xs text-gray-500">
                Note: You must agree to Apple&apos;s Alternative Terms Addendum for
                Apps in the EU before the entitlement can be granted.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-500/10 text-xs font-bold text-teal-400 border border-teal-500/20">
              2
            </div>
            <div>
              <p className="text-sm font-medium text-white">
                Add the entitlement to your Info.plist
              </p>
              <div className="mt-2 overflow-x-auto rounded-lg border border-white/10 bg-white/5 px-5 py-3">
                <pre className="text-sm font-mono">
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
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-500/10 text-xs font-bold text-teal-400 border border-teal-500/20">
              3
            </div>
            <div>
              <p className="text-sm font-medium text-white">
                Upload your Apple credentials in the EuroPay dashboard
              </p>
              <p className="mt-1 text-sm text-gray-400">
                For automated transaction reporting, EuroPay needs to sign JWT
                tokens for Apple&apos;s External Purchase Server API on your behalf.
                In the dashboard under your app&apos;s{" "}
                <strong className="text-white">Apple Reporting</strong>{" "}
                settings, provide:
              </p>
              <ul className="mt-2 space-y-1.5 text-sm text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-teal-400">&#8226;</span>
                  <strong className="text-white">Key ID</strong> — from the App Store Connect API keys page
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-teal-400">&#8226;</span>
                  <strong className="text-white">Issuer ID</strong> — shown at the top of the API keys page
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-teal-400">&#8226;</span>
                  <strong className="text-white">Private Key (.p8 file)</strong> — the key file you downloaded when creating the API key
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-teal-400">&#8226;</span>
                  <strong className="text-white">Bundle ID</strong> — your app&apos;s bundle identifier (e.g. com.example.myapp)
                </li>
              </ul>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-500/10 text-xs font-bold text-teal-400 border border-teal-500/20">
              4
            </div>
            <div>
              <p className="text-sm font-medium text-white">
                That&apos;s it
              </p>
              <p className="mt-1 text-sm text-gray-400">
                EuroPay handles the disclosure UI, transaction reporting, null
                reports, and CTF tracking. You ship your app as normal.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Summary */}
      <section className="mt-12 rounded-lg border border-teal-500/20 bg-teal-500/5 px-6 py-5">
        <p className="text-sm font-medium text-white">Summary</p>
        <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <p className="font-medium text-gray-300">EuroPay handles</p>
            <ul className="mt-1.5 space-y-1 text-gray-400">
              <li>DMA disclosure modal</li>
              <li>Apple transaction reporting</li>
              <li>Monthly nil reports</li>
              <li>CTF tracking &amp; dashboard</li>
              <li>EU region detection</li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-gray-300">You handle</p>
            <ul className="mt-1.5 space-y-1 text-gray-400">
              <li>Request Apple entitlement</li>
              <li>Add Info.plist key</li>
              <li>Upload Apple credentials to dashboard</li>
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mt-12">
        <h2 className="text-xl font-semibold text-white">
          Frequently Asked Questions
        </h2>
        <div className="mt-6 space-y-4">
          <details className="group rounded-lg border border-white/10 bg-white/[0.03]">
            <summary className="cursor-pointer px-5 py-3 text-sm font-medium text-white select-none">
              Does this only apply to EU users?
            </summary>
            <p className="px-5 pb-4 text-sm text-gray-400">
              Yes. The DMA only applies to users located in EU member states.
              EuroPay&apos;s iOS SDK detects the user&apos;s App Store storefront and only
              offers alternative checkout for EU storefronts. Users outside the EU
              continue to use Apple IAP as normal.
            </p>
          </details>

          <details className="group rounded-lg border border-white/10 bg-white/[0.03]">
            <summary className="cursor-pointer px-5 py-3 text-sm font-medium text-white select-none">
              What happens if I don&apos;t report transactions to Apple?
            </summary>
            <p className="px-5 pb-4 text-sm text-gray-400">
              Apple requires all external purchase transactions to be reported
              within 24&nbsp;hours. Failure to report may result in Apple revoking
              your External Purchase Link Entitlement and removing your app from
              the App Store in the EU. EuroPay reports transactions automatically
              so you don&apos;t have to worry about this.
            </p>
          </details>

          <details className="group rounded-lg border border-white/10 bg-white/[0.03]">
            <summary className="cursor-pointer px-5 py-3 text-sm font-medium text-white select-none">
              Do I need my own Stripe account?
            </summary>
            <p className="px-5 pb-4 text-sm text-gray-400">
              Yes. EuroPay uses Stripe Connect to process payments directly into
              your Stripe account. You&apos;ll connect your Stripe account during
              onboarding. EuroPay charges a 1.5% platform fee on each transaction,
              collected automatically via Stripe Connect.
            </p>
          </details>

          <details className="group rounded-lg border border-white/10 bg-white/[0.03]">
            <summary className="cursor-pointer px-5 py-3 text-sm font-medium text-white select-none">
              How do fees stack up compared to Apple IAP?
            </summary>
            <p className="px-5 pb-4 text-sm text-gray-400">
              With Apple IAP you pay 15–30%. With EuroPay, your total fees are:
              Stripe processing (~1.5% + &#8364;0.25), Apple&apos;s 5% CTF, and
              EuroPay&apos;s 1.5% — roughly 8% total versus Apple&apos;s 15–30%.
              For most developers this means significantly more revenue per
              transaction.
            </p>
          </details>

          <details className="group rounded-lg border border-white/10 bg-white/[0.03]">
            <summary className="cursor-pointer px-5 py-3 text-sm font-medium text-white select-none">
              How long does the entitlement approval take?
            </summary>
            <p className="px-5 pb-4 text-sm text-gray-400">
              Apple typically reviews and approves External Purchase Link
              Entitlement requests within 2–5 business days. You must first agree
              to Apple&apos;s Alternative Terms Addendum for Apps in the EU. Once
              approved, add the entitlement key to your Info.plist and submit a new
              build.
            </p>
          </details>
        </div>
      </section>
    </article>
  )
}
