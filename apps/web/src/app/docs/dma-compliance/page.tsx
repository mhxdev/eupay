export default function DMACompliancePage() {
  return (
    <article className="prose-docs">
      <h1 className="text-3xl font-bold tracking-tight text-white">
        DMA Compliance
      </h1>
      <p className="mt-4 text-lg text-gray-400">
        How EUPay keeps your app compliant with the EU Digital Markets Act so
        you can focus on building, not legal paperwork.
      </p>

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

      {/* How EUPay handles it */}
      <section className="mt-12">
        <h2 className="text-xl font-semibold text-white">
          How EUPay Handles It
        </h2>
        <p className="mt-3 text-sm text-gray-400">
          EUPay automates every DMA requirement so your integration stays
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
              EUPay automatically reports every transaction to Apple&apos;s
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
              the fee breakdown shown in your dashboard. EUPay tracks this
              automatically — you don&apos;t need to calculate or remit it
              separately. Apple invoices developers directly based on the
              transaction reports.
            </p>
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
          Entitlement from Apple. EUPay handles everything else.
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
                Go to your app in App Store Connect and apply for the{" "}
                <strong className="text-white">
                  External Purchase Link Entitlement
                </strong>
                . Apple typically approves this within a few business days.
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
                That&apos;s it
              </p>
              <p className="mt-1 text-sm text-gray-400">
                EUPay handles the disclosure UI, transaction reporting, null
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
            <p className="font-medium text-gray-300">EUPay handles</p>
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
              <li>Nothing else</li>
            </ul>
          </div>
        </div>
      </section>
    </article>
  )
}
