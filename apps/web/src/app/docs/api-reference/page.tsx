import { DocsNavigation } from "../DocsNavigation"

export default function ApiReferencePage() {
  return (
    <article className="prose-docs">
      <h1 className="text-4xl font-bold tracking-tight text-white">
        API Reference
      </h1>
      <p className="mt-4 text-lg text-gray-400">
        The EuroPay REST API. All endpoints are under{" "}
        <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs font-mono text-teal-300">
          /api/v1
        </code>{" "}
        and require a Bearer token unless noted otherwise.
      </p>

      {/* SDK callout */}
      <div className="mt-8 rounded-lg border border-teal-500/20 bg-teal-500/5 px-6 py-5">
        <p className="text-sm text-gray-300">
          <strong className="text-white">Most developers don&apos;t need this page.</strong>{" "}
          The EuroPayKit iOS SDK handles checkout, entitlements, and portal sessions
          automatically. You only need direct API access if you&apos;re building a custom
          backend integration or non-iOS client.
        </p>
      </div>

      {/* Authentication */}
      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-white">Authentication</h2>
        <p className="mt-3 text-base text-gray-300 leading-relaxed">
          Include your API key in the{" "}
          <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs font-mono text-teal-300">
            Authorization
          </code>{" "}
          header on every request:
        </p>
        <div className="mt-4 overflow-x-auto rounded-lg border border-white/10 bg-white/5 px-5 py-4">
          <pre className="text-sm font-mono">
            <code>
              <span className="text-teal-300">Authorization</span>
              <span className="text-gray-400">:</span>{" "}
              <span className="text-orange-300">Bearer europay_live_your_api_key</span>
            </code>
          </pre>
        </div>
        <p className="mt-3 text-base text-gray-300 leading-relaxed">
          API keys are generated in the{" "}
          <strong className="text-white">Dashboard &rarr; Apps</strong> section.
          Keys are shown once at creation — store them securely.
        </p>
      </section>

      {/* Endpoints table */}
      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-white">Endpoints</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left">
                <th className="pb-3 pr-4 font-medium text-gray-400">Method</th>
                <th className="pb-3 pr-4 font-medium text-gray-400">Path</th>
                <th className="pb-3 pr-4 font-medium text-gray-400">Description</th>
                <th className="pb-3 font-medium text-gray-400">Scope</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {/* Checkout */}
              <tr>
                <td className="py-3 pr-4">
                  <span className="rounded bg-green-500/10 px-2 py-0.5 text-xs font-mono font-medium text-green-400">
                    POST
                  </span>
                </td>
                <td className="py-3 pr-4 font-mono text-xs text-teal-300">
                  /v1/checkout/create
                </td>
                <td className="py-3 pr-4 text-gray-400">Create a Stripe Checkout session</td>
                <td className="py-3"><span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-xs font-medium text-purple-400 border border-purple-500/20">SDK-managed</span></td>
              </tr>
              <tr>
                <td className="py-3 pr-4">
                  <span className="rounded bg-blue-500/10 px-2 py-0.5 text-xs font-mono font-medium text-blue-400">
                    GET
                  </span>
                </td>
                <td className="py-3 pr-4 font-mono text-xs text-teal-300">
                  /v1/checkout/success
                </td>
                <td className="py-3 pr-4 text-gray-400">Verify checkout session status</td>
                <td className="py-3"><span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-xs font-medium text-purple-400 border border-purple-500/20">SDK-managed</span></td>
              </tr>
              <tr>
                <td className="py-3 pr-4">
                  <span className="rounded bg-green-500/10 px-2 py-0.5 text-xs font-mono font-medium text-green-400">
                    POST
                  </span>
                </td>
                <td className="py-3 pr-4 font-mono text-xs text-teal-300">
                  /v1/checkout/preload
                </td>
                <td className="py-3 pr-4 text-gray-400">Pre-create a checkout session for faster presentation</td>
                <td className="py-3"><span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-xs font-medium text-purple-400 border border-purple-500/20">SDK-managed</span></td>
              </tr>
              <tr>
                <td className="py-3 pr-4">
                  <span className="rounded bg-green-500/10 px-2 py-0.5 text-xs font-mono font-medium text-green-400">
                    POST
                  </span>
                </td>
                <td className="py-3 pr-4 font-mono text-xs text-teal-300">
                  /v1/checkout/validate
                </td>
                <td className="py-3 pr-4 text-gray-400">Check if a preloaded session is still valid</td>
                <td className="py-3"><span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-xs font-medium text-purple-400 border border-purple-500/20">SDK-managed</span></td>
              </tr>
              {/* Products */}
              <tr>
                <td className="py-3 pr-4">
                  <span className="rounded bg-blue-500/10 px-2 py-0.5 text-xs font-mono font-medium text-blue-400">
                    GET
                  </span>
                </td>
                <td className="py-3 pr-4 font-mono text-xs text-teal-300">
                  /v1/products/:appId
                </td>
                <td className="py-3 pr-4 text-gray-400">List active products for an app</td>
                <td className="py-3"><span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-xs font-medium text-purple-400 border border-purple-500/20">SDK-managed</span></td>
              </tr>
              {/* Entitlements */}
              <tr>
                <td className="py-3 pr-4">
                  <span className="rounded bg-blue-500/10 px-2 py-0.5 text-xs font-mono font-medium text-blue-400">
                    GET
                  </span>
                </td>
                <td className="py-3 pr-4 font-mono text-xs text-teal-300">
                  /v1/entitlements/:userId
                </td>
                <td className="py-3 pr-4 text-gray-400">Get entitlements for a user</td>
                <td className="py-3"><span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-xs font-medium text-purple-400 border border-purple-500/20">SDK-managed</span></td>
              </tr>
              {/* Subscriptions */}
              <tr>
                <td className="py-3 pr-4">
                  <span className="rounded bg-green-500/10 px-2 py-0.5 text-xs font-mono font-medium text-green-400">
                    POST
                  </span>
                </td>
                <td className="py-3 pr-4 font-mono text-xs text-teal-300">
                  /v1/subscriptions/cancel
                </td>
                <td className="py-3 pr-4 text-gray-400">Cancel subscription or apply save offer</td>
                <td className="py-3"><span className="rounded-full bg-teal-500/10 px-2 py-0.5 text-xs font-medium text-teal-400 border border-teal-500/20">Developer</span></td>
              </tr>
              <tr>
                <td className="py-3 pr-4">
                  <span className="rounded bg-green-500/10 px-2 py-0.5 text-xs font-mono font-medium text-green-400">
                    POST
                  </span>
                </td>
                <td className="py-3 pr-4 font-mono text-xs text-teal-300">
                  /v1/subscriptions/pause
                </td>
                <td className="py-3 pr-4 text-gray-400">Pause a subscription</td>
                <td className="py-3"><span className="rounded-full bg-teal-500/10 px-2 py-0.5 text-xs font-medium text-teal-400 border border-teal-500/20">Developer</span></td>
              </tr>
              <tr>
                <td className="py-3 pr-4">
                  <span className="rounded bg-green-500/10 px-2 py-0.5 text-xs font-mono font-medium text-green-400">
                    POST
                  </span>
                </td>
                <td className="py-3 pr-4 font-mono text-xs text-teal-300">
                  /v1/subscriptions/resume
                </td>
                <td className="py-3 pr-4 text-gray-400">Resume a paused subscription</td>
                <td className="py-3"><span className="rounded-full bg-teal-500/10 px-2 py-0.5 text-xs font-medium text-teal-400 border border-teal-500/20">Developer</span></td>
              </tr>
              {/* Portal */}
              <tr>
                <td className="py-3 pr-4">
                  <span className="rounded bg-green-500/10 px-2 py-0.5 text-xs font-mono font-medium text-green-400">
                    POST
                  </span>
                </td>
                <td className="py-3 pr-4 font-mono text-xs text-teal-300">
                  /v1/portal
                </td>
                <td className="py-3 pr-4 text-gray-400">Create a billing portal session</td>
                <td className="py-3"><span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-xs font-medium text-purple-400 border border-purple-500/20">SDK-managed</span></td>
              </tr>
              {/* GDPR */}
              <tr>
                <td className="py-3 pr-4">
                  <span className="rounded bg-blue-500/10 px-2 py-0.5 text-xs font-mono font-medium text-blue-400">
                    GET
                  </span>
                </td>
                <td className="py-3 pr-4 font-mono text-xs text-teal-300">
                  /v1/gdpr/export
                </td>
                <td className="py-3 pr-4 text-gray-400">Export user data (GDPR Art. 15 &amp; 20)</td>
                <td className="py-3"><span className="rounded-full bg-teal-500/10 px-2 py-0.5 text-xs font-medium text-teal-400 border border-teal-500/20">Developer</span></td>
              </tr>
              <tr>
                <td className="py-3 pr-4">
                  <span className="rounded bg-red-500/10 px-2 py-0.5 text-xs font-mono font-medium text-red-400">
                    DELETE
                  </span>
                </td>
                <td className="py-3 pr-4 font-mono text-xs text-teal-300">
                  /v1/gdpr/delete
                </td>
                <td className="py-3 pr-4 text-gray-400">Delete user data (GDPR Art. 17)</td>
                <td className="py-3"><span className="rounded-full bg-teal-500/10 px-2 py-0.5 text-xs font-medium text-teal-400 border border-teal-500/20">Developer</span></td>
              </tr>
              {/* Apple Reporting */}
              <tr>
                <td className="py-3 pr-4">
                  <span className="rounded bg-green-500/10 px-2 py-0.5 text-xs font-mono font-medium text-green-400">
                    POST
                  </span>
                </td>
                <td className="py-3 pr-4 font-mono text-xs text-teal-300">
                  /v1/apple/report
                </td>
                <td className="py-3 pr-4 text-gray-400">Report transaction to Apple (dashboard auth)</td>
                <td className="py-3"><span className="rounded-full bg-gray-500/10 px-2 py-0.5 text-xs font-medium text-gray-400 border border-gray-500/20">Internal</span></td>
              </tr>
              {/* Retention */}
              <tr>
                <td className="py-3 pr-4">
                  <span className="rounded bg-green-500/10 px-2 py-0.5 text-xs font-mono font-medium text-green-400">
                    POST
                  </span>
                </td>
                <td className="py-3 pr-4 font-mono text-xs text-teal-300">
                  /v1/retention/token
                </td>
                <td className="py-3 pr-4 text-gray-400">Generate cancel page JWT token</td>
                <td className="py-3"><span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-xs font-medium text-purple-400 border border-purple-500/20">SDK-managed</span></td>
              </tr>
              <tr>
                <td className="py-3 pr-4">
                  <span className="rounded bg-green-500/10 px-2 py-0.5 text-xs font-mono font-medium text-green-400">
                    POST
                  </span>
                </td>
                <td className="py-3 pr-4 font-mono text-xs text-teal-300">
                  /v1/retention/accept
                </td>
                <td className="py-3 pr-4 text-gray-400">Accept a retention offer (public, JWT auth)</td>
                <td className="py-3"><span className="rounded-full bg-gray-500/10 px-2 py-0.5 text-xs font-medium text-gray-400 border border-gray-500/20">Internal</span></td>
              </tr>
              <tr>
                <td className="py-3 pr-4">
                  <span className="rounded bg-green-500/10 px-2 py-0.5 text-xs font-mono font-medium text-green-400">
                    POST
                  </span>
                </td>
                <td className="py-3 pr-4 font-mono text-xs text-teal-300">
                  /v1/retention/cancel
                </td>
                <td className="py-3 pr-4 text-gray-400">Cancel subscription at period end (public, JWT auth)</td>
                <td className="py-3"><span className="rounded-full bg-gray-500/10 px-2 py-0.5 text-xs font-medium text-gray-400 border border-gray-500/20">Internal</span></td>
              </tr>
              {/* Experiments */}
              <tr>
                <td className="py-3 pr-4">
                  <span className="rounded bg-blue-500/10 px-2 py-0.5 text-xs font-mono font-medium text-blue-400">
                    GET
                  </span>
                </td>
                <td className="py-3 pr-4 font-mono text-xs text-teal-300">
                  /v1/experiments/config
                </td>
                <td className="py-3 pr-4 text-gray-400">Get experiment variant assignments for a user</td>
                <td className="py-3"><span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-xs font-medium text-purple-400 border border-purple-500/20">SDK-managed</span></td>
              </tr>
              <tr>
                <td className="py-3 pr-4">
                  <span className="rounded bg-green-500/10 px-2 py-0.5 text-xs font-mono font-medium text-green-400">
                    POST
                  </span>
                </td>
                <td className="py-3 pr-4 font-mono text-xs text-teal-300">
                  /v1/experiments/event
                </td>
                <td className="py-3 pr-4 text-gray-400">Record an experiment event</td>
                <td className="py-3"><span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-xs font-medium text-purple-400 border border-purple-500/20">SDK-managed</span></td>
              </tr>
              {/* Webhooks */}
              <tr>
                <td className="py-3 pr-4">
                  <span className="rounded bg-green-500/10 px-2 py-0.5 text-xs font-mono font-medium text-green-400">
                    POST
                  </span>
                </td>
                <td className="py-3 pr-4 font-mono text-xs text-teal-300">
                  /v1/webhooks/stripe
                </td>
                <td className="py-3 pr-4 text-gray-400">Stripe webhook receiver (no API key)</td>
                <td className="py-3"><span className="rounded-full bg-gray-500/10 px-2 py-0.5 text-xs font-medium text-gray-400 border border-gray-500/20">Internal</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ════════ Checkout ════════ */}
      <section className="mt-16">
        <h2 className="text-2xl font-semibold text-white">Checkout</h2>
      </section>

      {/* POST /v1/checkout/create */}
      <section className="mt-8">
        <div className="flex items-center gap-3">
          <span className="rounded bg-green-500/10 px-2 py-0.5 text-xs font-mono font-medium text-green-400">
            POST
          </span>
          <h3 className="text-lg font-semibold text-white font-mono">
            /v1/checkout/create
          </h3>
        </div>
        <p className="mt-3 text-base text-gray-300 leading-relaxed">
          Creates a Stripe Checkout Session. This is the main endpoint called
          by the iOS SDK to initiate a purchase.
        </p>

        <div className="mt-4">
          <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase">
            Request body
          </p>
          <div className="mt-2 overflow-x-auto rounded-lg border border-white/10 bg-white/5 px-5 py-4">
            <pre className="text-sm leading-relaxed font-mono">
              <code>
                <span className="text-gray-400">{"{"}</span>
                {"\n"}
                {"  "}
                <span className="text-teal-300">&quot;productId&quot;</span>
                <span className="text-gray-400">:</span>{" "}
                <span className="text-orange-300">&quot;string&quot;</span>
                <span className="text-gray-400">,</span>
                {"       "}
                <span className="text-gray-500">// required</span>
                {"\n"}
                {"  "}
                <span className="text-teal-300">&quot;userId&quot;</span>
                <span className="text-gray-400">:</span>{" "}
                <span className="text-orange-300">&quot;string&quot;</span>
                <span className="text-gray-400">,</span>
                {"          "}
                <span className="text-gray-500">// required</span>
                {"\n"}
                {"  "}
                <span className="text-teal-300">&quot;userEmail&quot;</span>
                <span className="text-gray-400">:</span>{" "}
                <span className="text-orange-300">&quot;string?&quot;</span>
                <span className="text-gray-400">,</span>
                {"        "}
                <span className="text-gray-500">// pre-fill email</span>
                {"\n"}
                {"  "}
                <span className="text-teal-300">&quot;successUrl&quot;</span>
                <span className="text-gray-400">:</span>{" "}
                <span className="text-orange-300">&quot;string&quot;</span>
                <span className="text-gray-400">,</span>
                {"       "}
                <span className="text-gray-500">// required, valid URL</span>
                {"\n"}
                {"  "}
                <span className="text-teal-300">&quot;cancelUrl&quot;</span>
                <span className="text-gray-400">:</span>{" "}
                <span className="text-orange-300">&quot;string&quot;</span>
                <span className="text-gray-400">,</span>
                {"        "}
                <span className="text-gray-500">// required, valid URL</span>
                {"\n"}
                {"  "}
                <span className="text-teal-300">&quot;locale&quot;</span>
                <span className="text-gray-400">:</span>{" "}
                <span className="text-orange-300">&quot;string&quot;</span>
                {"           "}
                <span className="text-gray-500">// 2-letter code, default &quot;de&quot;</span>
                {"\n"}
                <span className="text-gray-400">{"}"}</span>
              </code>
            </pre>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase">
            Response
          </p>
          <div className="mt-2 overflow-x-auto rounded-lg border border-white/10 bg-white/5 px-5 py-4">
            <pre className="text-sm leading-relaxed font-mono">
              <code>
                <span className="text-gray-400">{"{"}</span>
                {"\n"}
                {"  "}
                <span className="text-teal-300">&quot;sessionId&quot;</span>
                <span className="text-gray-400">:</span>{" "}
                <span className="text-orange-300">&quot;cs_live_...&quot;</span>
                <span className="text-gray-400">,</span>
                {"\n"}
                {"  "}
                <span className="text-teal-300">&quot;checkoutUrl&quot;</span>
                <span className="text-gray-400">:</span>{" "}
                <span className="text-orange-300">&quot;https://checkout.stripe.com/...&quot;</span>
                <span className="text-gray-400">,</span>
                {"\n"}
                {"  "}
                <span className="text-teal-300">&quot;expiresAt&quot;</span>
                <span className="text-gray-400">:</span>{" "}
                <span className="text-orange-300">&quot;2026-03-01T12:00:00Z&quot;</span>
                {"\n"}
                <span className="text-gray-400">{"}"}</span>
              </code>
            </pre>
          </div>
        </div>
      </section>

      {/* GET /v1/checkout/success */}
      <section className="mt-12">
        <div className="flex items-center gap-3">
          <span className="rounded bg-blue-500/10 px-2 py-0.5 text-xs font-mono font-medium text-blue-400">
            GET
          </span>
          <h3 className="text-lg font-semibold text-white font-mono">
            /v1/checkout/success
          </h3>
        </div>
        <p className="mt-3 text-base text-gray-300 leading-relaxed">
          Verifies a completed checkout session and confirms whether the
          entitlement was granted. Called by the iOS SDK after the user returns
          from Stripe Checkout.
        </p>

        <div className="mt-4">
          <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase">
            Query parameters
          </p>
          <div className="mt-2 overflow-x-auto rounded-lg border border-white/10 bg-white/5 px-5 py-4">
            <pre className="text-sm leading-relaxed font-mono">
              <code>
                <span className="text-teal-300">sessionId</span>
                <span className="text-gray-400">=</span>
                <span className="text-orange-300">cs_live_...</span>
                {"  "}
                <span className="text-gray-500">// required</span>
              </code>
            </pre>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase">
            Response
          </p>
          <div className="mt-2 overflow-x-auto rounded-lg border border-white/10 bg-white/5 px-5 py-4">
            <pre className="text-sm leading-relaxed font-mono">
              <code>
                <span className="text-gray-400">{"{"}</span>
                {"\n"}
                {"  "}
                <span className="text-teal-300">&quot;sessionId&quot;</span>
                <span className="text-gray-400">:</span>{" "}
                <span className="text-orange-300">&quot;cs_live_...&quot;</span>
                <span className="text-gray-400">,</span>
                {"\n"}
                {"  "}
                <span className="text-teal-300">&quot;paymentStatus&quot;</span>
                <span className="text-gray-400">:</span>{" "}
                <span className="text-orange-300">&quot;paid | unpaid | no_payment_required&quot;</span>
                <span className="text-gray-400">,</span>
                {"\n"}
                {"  "}
                <span className="text-teal-300">&quot;transactionStatus&quot;</span>
                <span className="text-gray-400">:</span>{" "}
                <span className="text-orange-300">&quot;PENDING | SUCCEEDED | UNKNOWN&quot;</span>
                {"\n"}
                <span className="text-gray-400">{"}"}</span>
              </code>
            </pre>
          </div>
        </div>
      </section>

      {/* POST /v1/checkout/preload */}
      <section className="mt-12">
        <div className="flex items-center gap-3">
          <span className="rounded bg-green-500/10 px-2 py-0.5 text-xs font-mono font-medium text-green-400">
            POST
          </span>
          <h3 className="text-lg font-semibold text-white font-mono">
            /v1/checkout/preload
          </h3>
        </div>
        <p className="mt-3 text-base text-gray-300 leading-relaxed">
          Pre-creates a Stripe Checkout Session for faster presentation. Sessions
          expire after 30 minutes. The SDK calls this in the background so
          checkout appears instantly when the user taps &quot;Buy&quot;.
        </p>

        <div className="mt-4">
          <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase">
            Request body
          </p>
          <div className="mt-2 overflow-x-auto rounded-lg border border-white/10 bg-white/5 px-5 py-4">
            <pre className="text-sm leading-relaxed font-mono">
              <code>
                <span className="text-gray-400">{"{"}</span>
                {"\n"}
                {"  "}
                <span className="text-teal-300">&quot;productId&quot;</span>
                <span className="text-gray-400">:</span>{" "}
                <span className="text-orange-300">&quot;string&quot;</span>
                <span className="text-gray-400">,</span>
                {"       "}
                <span className="text-gray-500">// required</span>
                {"\n"}
                {"  "}
                <span className="text-teal-300">&quot;userId&quot;</span>
                <span className="text-gray-400">:</span>{" "}
                <span className="text-orange-300">&quot;string&quot;</span>
                <span className="text-gray-400">,</span>
                {"          "}
                <span className="text-gray-500">// required</span>
                {"\n"}
                {"  "}
                <span className="text-teal-300">&quot;locale&quot;</span>
                <span className="text-gray-400">:</span>{" "}
                <span className="text-orange-300">&quot;string&quot;</span>
                {"           "}
                <span className="text-gray-500">// optional, default &quot;en&quot;</span>
                {"\n"}
                {"  "}
                <span className="text-teal-300">&quot;promotionId&quot;</span>
                <span className="text-gray-400">:</span>{" "}
                <span className="text-orange-300">&quot;string?&quot;</span>
                {"       "}
                <span className="text-gray-500">// optional</span>
                {"\n"}
                <span className="text-gray-400">{"}"}</span>
              </code>
            </pre>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase">
            Response
          </p>
          <div className="mt-2 overflow-x-auto rounded-lg border border-white/10 bg-white/5 px-5 py-4">
            <pre className="text-sm leading-relaxed font-mono">
              <code>
                <span className="text-gray-400">{"{"}</span>
                {"\n"}
                {"  "}
                <span className="text-teal-300">&quot;sessionId&quot;</span>
                <span className="text-gray-400">:</span>{" "}
                <span className="text-orange-300">&quot;cs_live_...&quot;</span>
                <span className="text-gray-400">,</span>
                {"\n"}
                {"  "}
                <span className="text-teal-300">&quot;sessionUrl&quot;</span>
                <span className="text-gray-400">:</span>{" "}
                <span className="text-orange-300">&quot;https://checkout.stripe.com/...&quot;</span>
                <span className="text-gray-400">,</span>
                {"\n"}
                {"  "}
                <span className="text-teal-300">&quot;expiresAt&quot;</span>
                <span className="text-gray-400">:</span>{" "}
                <span className="text-orange-300">&quot;2026-03-07T18:30:00Z&quot;</span>
                <span className="text-gray-400">,</span>
                {"\n"}
                {"  "}
                <span className="text-teal-300">&quot;productId&quot;</span>
                <span className="text-gray-400">:</span>{" "}
                <span className="text-orange-300">&quot;prod_123&quot;</span>
                <span className="text-gray-400">,</span>
                {"\n"}
                {"  "}
                <span className="text-teal-300">&quot;amountCents&quot;</span>
                <span className="text-gray-400">:</span>{" "}
                <span className="text-orange-300">4999</span>
                <span className="text-gray-400">,</span>
                {"\n"}
                {"  "}
                <span className="text-teal-300">&quot;currency&quot;</span>
                <span className="text-gray-400">:</span>{" "}
                <span className="text-orange-300">&quot;eur&quot;</span>
                <span className="text-gray-400">,</span>
                {"\n"}
                {"  "}
                <span className="text-teal-300">&quot;promotionalAmountCents&quot;</span>
                <span className="text-gray-400">:</span>{" "}
                <span className="text-orange-300">3999</span>
                {"  "}
                <span className="text-gray-500">// present if promotion applies</span>
                {"\n"}
                <span className="text-gray-400">{"}"}</span>
              </code>
            </pre>
          </div>
        </div>
      </section>

      {/* POST /v1/checkout/validate */}
      <section className="mt-12">
        <div className="flex items-center gap-3">
          <span className="rounded bg-green-500/10 px-2 py-0.5 text-xs font-mono font-medium text-green-400">
            POST
          </span>
          <h3 className="text-lg font-semibold text-white font-mono">
            /v1/checkout/validate
          </h3>
        </div>
        <p className="mt-3 text-base text-gray-300 leading-relaxed">
          Checks if a preloaded checkout session is still valid before presenting
          it. Returns the session status and expiry time.
        </p>

        <div className="mt-4">
          <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase">
            Request body
          </p>
          <div className="mt-2 overflow-x-auto rounded-lg border border-white/10 bg-white/5 px-5 py-4">
            <pre className="text-sm leading-relaxed font-mono">
              <code>
                <span className="text-gray-400">{"{"}</span>
                {"\n"}
                {"  "}
                <span className="text-teal-300">&quot;sessionId&quot;</span>
                <span className="text-gray-400">:</span>{" "}
                <span className="text-orange-300">&quot;cs_live_...&quot;</span>
                {"  "}
                <span className="text-gray-500">// required</span>
                {"\n"}
                <span className="text-gray-400">{"}"}</span>
              </code>
            </pre>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase">
            Response
          </p>
          <div className="mt-2 overflow-x-auto rounded-lg border border-white/10 bg-white/5 px-5 py-4">
            <pre className="text-sm leading-relaxed font-mono">
              <code>
                <span className="text-gray-400">{"{"}</span>
                {"\n"}
                {"  "}
                <span className="text-teal-300">&quot;valid&quot;</span>
                <span className="text-gray-400">:</span>{" "}
                <span className="text-orange-300">true</span>
                <span className="text-gray-400">,</span>
                {"\n"}
                {"  "}
                <span className="text-teal-300">&quot;status&quot;</span>
                <span className="text-gray-400">:</span>{" "}
                <span className="text-orange-300">&quot;open&quot;</span>
                <span className="text-gray-400">,</span>
                {"\n"}
                {"  "}
                <span className="text-teal-300">&quot;expiresAt&quot;</span>
                <span className="text-gray-400">:</span>{" "}
                <span className="text-orange-300">&quot;2026-03-07T18:30:00Z&quot;</span>
                {"\n"}
                <span className="text-gray-400">{"}"}</span>
              </code>
            </pre>
          </div>
        </div>
      </section>

      {/* ════════ Products ════════ */}
      <section className="mt-16">
        <h2 className="text-2xl font-semibold text-white">Products</h2>
      </section>

      {/* GET /v1/products/:appId */}
      <section className="mt-8">
        <div className="flex items-center gap-3">
          <span className="rounded bg-blue-500/10 px-2 py-0.5 text-xs font-mono font-medium text-blue-400">
            GET
          </span>
          <h3 className="text-lg font-semibold text-white font-mono">
            /v1/products/:appId
          </h3>
        </div>
        <p className="mt-3 text-base text-gray-300 leading-relaxed">
          Returns all active products for a given app. Called by the iOS SDK to
          display available purchase options.
        </p>

        <div className="mt-4">
          <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase">
            Response
          </p>
          <div className="mt-2 overflow-x-auto rounded-lg border border-white/10 bg-white/5 px-5 py-4">
            <pre className="text-sm leading-relaxed font-mono">
              <code>
                <span className="text-gray-400">{"{"}</span>
                {"\n"}
                {"  "}
                <span className="text-teal-300">&quot;products&quot;</span>
                <span className="text-gray-400">: [</span>
                {"\n"}
                {"    "}
                <span className="text-gray-400">{"{"}</span>
                {"\n"}
                {"      "}
                <span className="text-teal-300">&quot;id&quot;</span>
                <span className="text-gray-400">:</span>{" "}
                <span className="text-orange-300">&quot;string&quot;</span>
                <span className="text-gray-400">,</span>
                {"\n"}
                {"      "}
                <span className="text-teal-300">&quot;name&quot;</span>
                <span className="text-gray-400">:</span>{" "}
                <span className="text-orange-300">&quot;string&quot;</span>
                <span className="text-gray-400">,</span>
                {"\n"}
                {"      "}
                <span className="text-teal-300">&quot;description&quot;</span>
                <span className="text-gray-400">:</span>{" "}
                <span className="text-orange-300">&quot;string | null&quot;</span>
                <span className="text-gray-400">,</span>
                {"\n"}
                {"      "}
                <span className="text-teal-300">&quot;productType&quot;</span>
                <span className="text-gray-400">:</span>{" "}
                <span className="text-orange-300">&quot;ONE_TIME | SUBSCRIPTION&quot;</span>
                <span className="text-gray-400">,</span>
                {"\n"}
                {"      "}
                <span className="text-teal-300">&quot;appStoreProductId&quot;</span>
                <span className="text-gray-400">:</span>{" "}
                <span className="text-orange-300">&quot;string | null&quot;</span>
                <span className="text-gray-400">,</span>
                {"\n"}
                {"      "}
                <span className="text-teal-300">&quot;amountCents&quot;</span>
                <span className="text-gray-400">:</span>{" "}
                <span className="text-orange-300">499</span>
                <span className="text-gray-400">,</span>
                {"\n"}
                {"      "}
                <span className="text-teal-300">&quot;currency&quot;</span>
                <span className="text-gray-400">:</span>{" "}
                <span className="text-orange-300">&quot;eur&quot;</span>
                <span className="text-gray-400">,</span>
                {"\n"}
                {"      "}
                <span className="text-teal-300">&quot;interval&quot;</span>
                <span className="text-gray-400">:</span>{" "}
                <span className="text-orange-300">&quot;month | year | null&quot;</span>
                <span className="text-gray-400">,</span>
                {"\n"}
                {"      "}
                <span className="text-teal-300">&quot;intervalCount&quot;</span>
                <span className="text-gray-400">:</span>{" "}
                <span className="text-orange-300">1</span>
                <span className="text-gray-400">,</span>
                {"\n"}
                {"      "}
                <span className="text-teal-300">&quot;trialDays&quot;</span>
                <span className="text-gray-400">:</span>{" "}
                <span className="text-orange-300">0</span>
                {"\n"}
                {"    "}
                <span className="text-gray-400">{"}"}</span>
                {"\n"}
                {"  "}
                <span className="text-gray-400">]</span>
                {"\n"}
                <span className="text-gray-400">{"}"}</span>
              </code>
            </pre>
          </div>
        </div>
      </section>

      {/* ════════ Entitlements ════════ */}
      <section className="mt-16">
        <h2 className="text-2xl font-semibold text-white">Entitlements</h2>
      </section>

      {/* GET /v1/entitlements/:userId */}
      <section className="mt-8">
        <div className="flex items-center gap-3">
          <span className="rounded bg-blue-500/10 px-2 py-0.5 text-xs font-mono font-medium text-blue-400">
            GET
          </span>
          <h3 className="text-lg font-semibold text-white font-mono">
            /v1/entitlements/:userId
          </h3>
        </div>
        <p className="mt-3 text-base text-gray-300 leading-relaxed">
          Returns all entitlements for a user. Use the optional{" "}
          <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs font-mono text-teal-300">
            ?includeExpired=true
          </code>{" "}
          query parameter to include expired entitlements.
        </p>

        <div className="mt-4">
          <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase">
            Response
          </p>
          <div className="mt-2 overflow-x-auto rounded-lg border border-white/10 bg-white/5 px-5 py-4">
            <pre className="text-sm leading-relaxed font-mono">
              <code>
                <span className="text-gray-400">{"{"}</span>
                {"\n"}
                {"  "}
                <span className="text-teal-300">&quot;userId&quot;</span>
                <span className="text-gray-400">:</span>{" "}
                <span className="text-orange-300">&quot;user_123&quot;</span>
                <span className="text-gray-400">,</span>
                {"\n"}
                {"  "}
                <span className="text-teal-300">&quot;entitlements&quot;</span>
                <span className="text-gray-400">: [</span>
                {"\n"}
                {"    "}
                <span className="text-gray-400">{"{"}</span>
                {"\n"}
                {"      "}
                <span className="text-teal-300">&quot;id&quot;</span>
                <span className="text-gray-400">:</span>{" "}
                <span className="text-orange-300">&quot;string&quot;</span>
                <span className="text-gray-400">,</span>
                {"\n"}
                {"      "}
                <span className="text-teal-300">&quot;productId&quot;</span>
                <span className="text-gray-400">:</span>{" "}
                <span className="text-orange-300">&quot;string&quot;</span>
                <span className="text-gray-400">,</span>
                {"\n"}
                {"      "}
                <span className="text-teal-300">&quot;appStoreProductId&quot;</span>
                <span className="text-gray-400">:</span>{" "}
                <span className="text-orange-300">&quot;string | null&quot;</span>
                <span className="text-gray-400">,</span>
                {"\n"}
                {"      "}
                <span className="text-teal-300">&quot;status&quot;</span>
                <span className="text-gray-400">:</span>{" "}
                <span className="text-orange-300">&quot;ACTIVE | EXPIRED | CANCELLED | PAUSED&quot;</span>
                <span className="text-gray-400">,</span>
                {"\n"}
                {"      "}
                <span className="text-teal-300">&quot;currentPeriodEnd&quot;</span>
                <span className="text-gray-400">:</span>{" "}
                <span className="text-orange-300">&quot;ISO 8601 | null&quot;</span>
                <span className="text-gray-400">,</span>
                {"\n"}
                {"      "}
                <span className="text-teal-300">&quot;cancelAtPeriodEnd&quot;</span>
                <span className="text-gray-400">:</span>{" "}
                <span className="text-orange-300">false</span>
                {"\n"}
                {"    "}
                <span className="text-gray-400">{"}"}</span>
                {"\n"}
                {"  "}
                <span className="text-gray-400">]</span>
                {"\n"}
                <span className="text-gray-400">{"}"}</span>
              </code>
            </pre>
          </div>
        </div>
      </section>

      {/* ════════ Subscriptions ════════ */}
      <section className="mt-16">
        <h2 className="text-2xl font-semibold text-white">Subscriptions</h2>
      </section>

      {/* POST /v1/subscriptions/cancel */}
      <section className="mt-8">
        <div className="flex items-center gap-3">
          <span className="rounded bg-green-500/10 px-2 py-0.5 text-xs font-mono font-medium text-green-400">
            POST
          </span>
          <h3 className="text-lg font-semibold text-white font-mono">
            /v1/subscriptions/cancel
          </h3>
        </div>
        <p className="mt-3 text-base text-gray-300 leading-relaxed">
          Cancels a subscription at the end of the current billing period. Set{" "}
          <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs font-mono text-teal-300">
            acceptSaveOffer
          </code>{" "}
          to{" "}
          <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs font-mono text-teal-300">
            true
          </code>{" "}
          to apply a 20%-off-for-3-months discount instead of cancelling.
        </p>

        <div className="mt-4">
          <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase">
            Request body
          </p>
          <div className="mt-2 overflow-x-auto rounded-lg border border-white/10 bg-white/5 px-5 py-4">
            <pre className="text-sm leading-relaxed font-mono">
              <code>
                <span className="text-gray-400">{"{"}</span>
                {"\n"}
                {"  "}
                <span className="text-teal-300">&quot;userId&quot;</span>
                <span className="text-gray-400">:</span>{" "}
                <span className="text-orange-300">&quot;string&quot;</span>
                <span className="text-gray-400">,</span>
                {"            "}
                <span className="text-gray-500">// required</span>
                {"\n"}
                {"  "}
                <span className="text-teal-300">&quot;entitlementId&quot;</span>
                <span className="text-gray-400">:</span>{" "}
                <span className="text-orange-300">&quot;string&quot;</span>
                <span className="text-gray-400">,</span>
                {"     "}
                <span className="text-gray-500">// required</span>
                {"\n"}
                {"  "}
                <span className="text-teal-300">&quot;acceptSaveOffer&quot;</span>
                <span className="text-gray-400">:</span>{" "}
                <span className="text-orange-300">false</span>
                {"          "}
                <span className="text-gray-500">// optional, default false</span>
                {"\n"}
                <span className="text-gray-400">{"}"}</span>
              </code>
            </pre>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase">
            Response (cancellation)
          </p>
          <div className="mt-2 overflow-x-auto rounded-lg border border-white/10 bg-white/5 px-5 py-4">
            <pre className="text-sm leading-relaxed font-mono">
              <code>
                <span className="text-gray-400">{"{"}</span>
                {"\n"}
                {"  "}
                <span className="text-teal-300">&quot;success&quot;</span>
                <span className="text-gray-400">:</span>{" "}
                <span className="text-orange-300">true</span>
                <span className="text-gray-400">,</span>
                {"\n"}
                {"  "}
                <span className="text-teal-300">&quot;cancelAtPeriodEnd&quot;</span>
                <span className="text-gray-400">:</span>{" "}
                <span className="text-orange-300">true</span>
                {"\n"}
                <span className="text-gray-400">{"}"}</span>
              </code>
            </pre>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase">
            Response (save offer accepted)
          </p>
          <div className="mt-2 overflow-x-auto rounded-lg border border-white/10 bg-white/5 px-5 py-4">
            <pre className="text-sm leading-relaxed font-mono">
              <code>
                <span className="text-gray-400">{"{"}</span>
                {"\n"}
                {"  "}
                <span className="text-teal-300">&quot;success&quot;</span>
                <span className="text-gray-400">:</span>{" "}
                <span className="text-orange-300">true</span>
                <span className="text-gray-400">,</span>
                {"\n"}
                {"  "}
                <span className="text-teal-300">&quot;saveOfferApplied&quot;</span>
                <span className="text-gray-400">:</span>{" "}
                <span className="text-orange-300">true</span>
                <span className="text-gray-400">,</span>
                {"\n"}
                {"  "}
                <span className="text-teal-300">&quot;discount&quot;</span>
                <span className="text-gray-400">:</span>{" "}
                <span className="text-gray-400">{"{"}</span>
                {"\n"}
                {"    "}
                <span className="text-teal-300">&quot;percentOff&quot;</span>
                <span className="text-gray-400">:</span>{" "}
                <span className="text-orange-300">20</span>
                <span className="text-gray-400">,</span>
                {"\n"}
                {"    "}
                <span className="text-teal-300">&quot;durationMonths&quot;</span>
                <span className="text-gray-400">:</span>{" "}
                <span className="text-orange-300">3</span>
                {"\n"}
                {"  "}
                <span className="text-gray-400">{"}"}</span>
                {"\n"}
                <span className="text-gray-400">{"}"}</span>
              </code>
            </pre>
          </div>
        </div>
      </section>

      {/* POST /v1/subscriptions/pause */}
      <section className="mt-12">
        <div className="flex items-center gap-3">
          <span className="rounded bg-green-500/10 px-2 py-0.5 text-xs font-mono font-medium text-green-400">
            POST
          </span>
          <h3 className="text-lg font-semibold text-white font-mono">
            /v1/subscriptions/pause
          </h3>
        </div>
        <p className="mt-3 text-base text-gray-300 leading-relaxed">
          Pauses an active subscription. Invoices will not be generated while
          paused. Only active subscriptions can be paused.
        </p>

        <div className="mt-4">
          <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase">
            Request body
          </p>
          <div className="mt-2 overflow-x-auto rounded-lg border border-white/10 bg-white/5 px-5 py-4">
            <pre className="text-sm leading-relaxed font-mono">
              <code>
                <span className="text-gray-400">{"{"}</span>
                {"\n"}
                {"  "}
                <span className="text-teal-300">&quot;userId&quot;</span>
                <span className="text-gray-400">:</span>{" "}
                <span className="text-orange-300">&quot;string&quot;</span>
                <span className="text-gray-400">,</span>
                {"        "}
                <span className="text-gray-500">// required</span>
                {"\n"}
                {"  "}
                <span className="text-teal-300">&quot;entitlementId&quot;</span>
                <span className="text-gray-400">:</span>{" "}
                <span className="text-orange-300">&quot;string&quot;</span>
                {"  "}
                <span className="text-gray-500">// required</span>
                {"\n"}
                <span className="text-gray-400">{"}"}</span>
              </code>
            </pre>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase">
            Response
          </p>
          <div className="mt-2 overflow-x-auto rounded-lg border border-white/10 bg-white/5 px-5 py-4">
            <pre className="text-sm leading-relaxed font-mono">
              <code>
                <span className="text-gray-400">{"{"}</span>
                {"\n"}
                {"  "}
                <span className="text-teal-300">&quot;success&quot;</span>
                <span className="text-gray-400">:</span>{" "}
                <span className="text-orange-300">true</span>
                <span className="text-gray-400">,</span>
                {"\n"}
                {"  "}
                <span className="text-teal-300">&quot;status&quot;</span>
                <span className="text-gray-400">:</span>{" "}
                <span className="text-orange-300">&quot;PAUSED&quot;</span>
                {"\n"}
                <span className="text-gray-400">{"}"}</span>
              </code>
            </pre>
          </div>
        </div>
      </section>

      {/* POST /v1/subscriptions/resume */}
      <section className="mt-12">
        <div className="flex items-center gap-3">
          <span className="rounded bg-green-500/10 px-2 py-0.5 text-xs font-mono font-medium text-green-400">
            POST
          </span>
          <h3 className="text-lg font-semibold text-white font-mono">
            /v1/subscriptions/resume
          </h3>
        </div>
        <p className="mt-3 text-base text-gray-300 leading-relaxed">
          Resumes a paused subscription. Billing restarts immediately.
        </p>

        <div className="mt-4">
          <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase">
            Request body
          </p>
          <div className="mt-2 overflow-x-auto rounded-lg border border-white/10 bg-white/5 px-5 py-4">
            <pre className="text-sm leading-relaxed font-mono">
              <code>
                <span className="text-gray-400">{"{"}</span>
                {"\n"}
                {"  "}
                <span className="text-teal-300">&quot;userId&quot;</span>
                <span className="text-gray-400">:</span>{" "}
                <span className="text-orange-300">&quot;string&quot;</span>
                <span className="text-gray-400">,</span>
                {"        "}
                <span className="text-gray-500">// required</span>
                {"\n"}
                {"  "}
                <span className="text-teal-300">&quot;entitlementId&quot;</span>
                <span className="text-gray-400">:</span>{" "}
                <span className="text-orange-300">&quot;string&quot;</span>
                {"  "}
                <span className="text-gray-500">// required</span>
                {"\n"}
                <span className="text-gray-400">{"}"}</span>
              </code>
            </pre>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase">
            Response
          </p>
          <div className="mt-2 overflow-x-auto rounded-lg border border-white/10 bg-white/5 px-5 py-4">
            <pre className="text-sm leading-relaxed font-mono">
              <code>
                <span className="text-gray-400">{"{"}</span>
                {"\n"}
                {"  "}
                <span className="text-teal-300">&quot;success&quot;</span>
                <span className="text-gray-400">:</span>{" "}
                <span className="text-orange-300">true</span>
                <span className="text-gray-400">,</span>
                {"\n"}
                {"  "}
                <span className="text-teal-300">&quot;status&quot;</span>
                <span className="text-gray-400">:</span>{" "}
                <span className="text-orange-300">&quot;ACTIVE&quot;</span>
                {"\n"}
                <span className="text-gray-400">{"}"}</span>
              </code>
            </pre>
          </div>
        </div>
      </section>

      {/* ════════ Billing Portal ════════ */}
      <section className="mt-16">
        <h2 className="text-2xl font-semibold text-white">Billing Portal</h2>
      </section>

      {/* POST /v1/portal */}
      <section className="mt-8">
        <div className="flex items-center gap-3">
          <span className="rounded bg-green-500/10 px-2 py-0.5 text-xs font-mono font-medium text-green-400">
            POST
          </span>
          <h3 className="text-lg font-semibold text-white font-mono">
            /v1/portal
          </h3>
        </div>
        <p className="mt-3 text-base text-gray-300 leading-relaxed">
          Creates a billing portal session so an end user can manage their
          subscription, update payment methods, and view invoices.
        </p>

        <div className="mt-4">
          <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase">
            Request body
          </p>
          <div className="mt-2 overflow-x-auto rounded-lg border border-white/10 bg-white/5 px-5 py-4">
            <pre className="text-sm leading-relaxed font-mono">
              <code>
                <span className="text-gray-400">{"{"}</span>
                {"\n"}
                {"  "}
                <span className="text-teal-300">&quot;userId&quot;</span>
                <span className="text-gray-400">:</span>{" "}
                <span className="text-orange-300">&quot;string&quot;</span>
                <span className="text-gray-400">,</span>
                {"     "}
                <span className="text-gray-500">// required</span>
                {"\n"}
                {"  "}
                <span className="text-teal-300">&quot;returnUrl&quot;</span>
                <span className="text-gray-400">:</span>{" "}
                <span className="text-orange-300">&quot;string&quot;</span>
                {"  "}
                <span className="text-gray-500">// required, URL to return to after portal</span>
                {"\n"}
                <span className="text-gray-400">{"}"}</span>
              </code>
            </pre>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase">
            Response
          </p>
          <div className="mt-2 overflow-x-auto rounded-lg border border-white/10 bg-white/5 px-5 py-4">
            <pre className="text-sm leading-relaxed font-mono">
              <code>
                <span className="text-gray-400">{"{"}</span>
                {"\n"}
                {"  "}
                <span className="text-teal-300">&quot;url&quot;</span>
                <span className="text-gray-400">:</span>{" "}
                <span className="text-orange-300">&quot;https://billing.stripe.com/...&quot;</span>
                {"\n"}
                <span className="text-gray-400">{"}"}</span>
              </code>
            </pre>
          </div>
        </div>
      </section>

      {/* ════════ GDPR ════════ */}
      <section className="mt-16">
        <h2 className="text-2xl font-semibold text-white">GDPR</h2>
      </section>

      {/* GET /v1/gdpr/export */}
      <section className="mt-8">
        <div className="flex items-center gap-3">
          <span className="rounded bg-blue-500/10 px-2 py-0.5 text-xs font-mono font-medium text-blue-400">
            GET
          </span>
          <h3 className="text-lg font-semibold text-white font-mono">
            /v1/gdpr/export
          </h3>
        </div>
        <p className="mt-3 text-base text-gray-300 leading-relaxed">
          Returns all data held for a user as JSON. Implements GDPR Article 15
          (right of access) and Article 20 (data portability). Stripe internal
          IDs are redacted from the export.
        </p>

        <div className="mt-4">
          <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase">
            Query parameters
          </p>
          <div className="mt-2 overflow-x-auto rounded-lg border border-white/10 bg-white/5 px-5 py-4">
            <pre className="text-sm leading-relaxed font-mono">
              <code>
                <span className="text-teal-300">userId</span>
                <span className="text-gray-400">=</span>
                <span className="text-orange-300">user_123</span>
                {"  "}
                <span className="text-gray-500">// required</span>
              </code>
            </pre>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase">
            Response
          </p>
          <div className="mt-2 overflow-x-auto rounded-lg border border-white/10 bg-white/5 px-5 py-4">
            <pre className="text-sm leading-relaxed font-mono">
              <code>
                <span className="text-gray-400">{"{"}</span>
                {"\n"}
                {"  "}
                <span className="text-teal-300">&quot;customer&quot;</span>
                <span className="text-gray-400">:</span>{" "}
                <span className="text-gray-400">{"{"}</span>
                {"\n"}
                {"    "}
                <span className="text-teal-300">&quot;externalUserId&quot;</span>
                <span className="text-gray-400">,</span>{" "}
                <span className="text-teal-300">&quot;email&quot;</span>
                <span className="text-gray-400">,</span>{" "}
                <span className="text-teal-300">&quot;name&quot;</span>
                <span className="text-gray-400">,</span>
                {"\n"}
                {"    "}
                <span className="text-teal-300">&quot;countryCode&quot;</span>
                <span className="text-gray-400">,</span>{" "}
                <span className="text-teal-300">&quot;gdprConsentAt&quot;</span>
                <span className="text-gray-400">,</span>{" "}
                <span className="text-teal-300">&quot;createdAt&quot;</span>
                {"\n"}
                {"  "}
                <span className="text-gray-400">{"}"}</span>
                <span className="text-gray-400">,</span>
                {"\n"}
                {"  "}
                <span className="text-teal-300">&quot;entitlements&quot;</span>
                <span className="text-gray-400">: [</span>
                {"\n"}
                {"    "}
                <span className="text-gray-400">{"{"}</span>{" "}
                <span className="text-teal-300">&quot;productName&quot;</span>
                <span className="text-gray-400">,</span>{" "}
                <span className="text-teal-300">&quot;status&quot;</span>
                <span className="text-gray-400">,</span>{" "}
                <span className="text-teal-300">&quot;source&quot;</span>
                <span className="text-gray-400">,</span>{" "}
                <span className="text-teal-300">&quot;currentPeriodEnd&quot;</span>
                <span className="text-gray-400">,</span>
                {"\n"}
                {"      "}
                <span className="text-teal-300">&quot;cancelAtPeriodEnd&quot;</span>
                <span className="text-gray-400">,</span>{" "}
                <span className="text-teal-300">&quot;createdAt&quot;</span>{" "}
                <span className="text-gray-400">{"}"}</span>
                {"\n"}
                {"  "}
                <span className="text-gray-400">]</span>
                <span className="text-gray-400">,</span>
                {"\n"}
                {"  "}
                <span className="text-teal-300">&quot;transactions&quot;</span>
                <span className="text-gray-400">: [</span>
                {"\n"}
                {"    "}
                <span className="text-gray-400">{"{"}</span>{" "}
                <span className="text-teal-300">&quot;amountTotal&quot;</span>
                <span className="text-gray-400">,</span>{" "}
                <span className="text-teal-300">&quot;amountSubtotal&quot;</span>
                <span className="text-gray-400">,</span>{" "}
                <span className="text-teal-300">&quot;amountTax&quot;</span>
                <span className="text-gray-400">,</span>
                {"\n"}
                {"      "}
                <span className="text-teal-300">&quot;vatRate&quot;</span>
                <span className="text-gray-400">,</span>{" "}
                <span className="text-teal-300">&quot;vatCountry&quot;</span>
                <span className="text-gray-400">,</span>{" "}
                <span className="text-teal-300">&quot;currency&quot;</span>
                <span className="text-gray-400">,</span>{" "}
                <span className="text-teal-300">&quot;status&quot;</span>
                <span className="text-gray-400">,</span>{" "}
                <span className="text-teal-300">&quot;createdAt&quot;</span>{" "}
                <span className="text-gray-400">{"}"}</span>
                {"\n"}
                {"  "}
                <span className="text-gray-400">]</span>
                {"\n"}
                <span className="text-gray-400">{"}"}</span>
              </code>
            </pre>
          </div>
        </div>
      </section>

      {/* DELETE /v1/gdpr/delete */}
      <section className="mt-12">
        <div className="flex items-center gap-3">
          <span className="rounded bg-red-500/10 px-2 py-0.5 text-xs font-mono font-medium text-red-400">
            DELETE
          </span>
          <h3 className="text-lg font-semibold text-white font-mono">
            /v1/gdpr/delete
          </h3>
        </div>
        <p className="mt-3 text-base text-gray-300 leading-relaxed">
          Anonymises all PII for a user (GDPR Article 17 — right to erasure).
          Email, name, and Stripe customer ID are scrubbed. Financial records
          (amounts, dates, tax info) are retained for 10-year tax compliance
          (GoBD). The Stripe customer is also deleted.
        </p>

        <div className="mt-4">
          <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase">
            Query parameters
          </p>
          <div className="mt-2 overflow-x-auto rounded-lg border border-white/10 bg-white/5 px-5 py-4">
            <pre className="text-sm leading-relaxed font-mono">
              <code>
                <span className="text-teal-300">userId</span>
                <span className="text-gray-400">=</span>
                <span className="text-orange-300">user_123</span>
                {"  "}
                <span className="text-gray-500">// required</span>
              </code>
            </pre>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase">
            Response
          </p>
          <div className="mt-2 overflow-x-auto rounded-lg border border-white/10 bg-white/5 px-5 py-4">
            <pre className="text-sm leading-relaxed font-mono">
              <code>
                <span className="text-gray-400">{"{"}</span>
                {"\n"}
                {"  "}
                <span className="text-teal-300">&quot;success&quot;</span>
                <span className="text-gray-400">:</span>{" "}
                <span className="text-orange-300">true</span>
                <span className="text-gray-400">,</span>
                {"\n"}
                {"  "}
                <span className="text-teal-300">&quot;deletedAt&quot;</span>
                <span className="text-gray-400">:</span>{" "}
                <span className="text-orange-300">&quot;2026-03-04T10:30:00.000Z&quot;</span>
                {"\n"}
                <span className="text-gray-400">{"}"}</span>
              </code>
            </pre>
          </div>
        </div>
      </section>

      {/* ════════ Apple Reporting ════════ */}
      <section className="mt-16">
        <h2 className="text-2xl font-semibold text-white">Apple Reporting</h2>
      </section>

      {/* POST /v1/apple/report */}
      <section className="mt-8">
        <div className="flex items-center gap-3">
          <span className="rounded bg-green-500/10 px-2 py-0.5 text-xs font-mono font-medium text-green-400">
            POST
          </span>
          <h3 className="text-lg font-semibold text-white font-mono">
            /v1/apple/report
          </h3>
        </div>
        <p className="mt-3 text-base text-gray-300 leading-relaxed">
          Manually triggers a transaction report to Apple&apos;s External Purchase
          Server API. Requires Apple credentials (Key ID, Issuer ID, Private
          Key, Bundle ID) to be configured in the dashboard.
        </p>
        <div className="mt-2 rounded-md border border-yellow-500/20 bg-yellow-500/5 px-4 py-2.5">
          <p className="text-xs text-yellow-300">
            This endpoint uses <strong>dashboard session auth</strong> (Clerk),
            not Bearer token auth. It is intended for use from the dashboard,
            not from client apps.
          </p>
        </div>

        <div className="mt-4">
          <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase">
            Request body
          </p>
          <div className="mt-2 overflow-x-auto rounded-lg border border-white/10 bg-white/5 px-5 py-4">
            <pre className="text-sm leading-relaxed font-mono">
              <code>
                <span className="text-gray-400">{"{"}</span>
                {"\n"}
                {"  "}
                <span className="text-teal-300">&quot;appId&quot;</span>
                <span className="text-gray-400">:</span>{" "}
                <span className="text-orange-300">&quot;string&quot;</span>
                <span className="text-gray-400">,</span>
                {"          "}
                <span className="text-gray-500">// required</span>
                {"\n"}
                {"  "}
                <span className="text-teal-300">&quot;transactionId&quot;</span>
                <span className="text-gray-400">:</span>{" "}
                <span className="text-orange-300">&quot;string&quot;</span>
                {"  "}
                <span className="text-gray-500">// required</span>
                {"\n"}
                <span className="text-gray-400">{"}"}</span>
              </code>
            </pre>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase">
            Response
          </p>
          <div className="mt-2 overflow-x-auto rounded-lg border border-white/10 bg-white/5 px-5 py-4">
            <pre className="text-sm leading-relaxed font-mono">
              <code>
                <span className="text-gray-400">{"{"}</span>
                {"\n"}
                {"  "}
                <span className="text-teal-300">&quot;success&quot;</span>
                <span className="text-gray-400">:</span>{" "}
                <span className="text-orange-300">true</span>
                {"\n"}
                <span className="text-gray-400">{"}"}</span>
              </code>
            </pre>
          </div>
        </div>
      </section>

      {/* ════════ Retention ════════ */}
      <section className="mt-16">
        <h2 className="text-2xl font-semibold text-white">Retention (Save the Sale)</h2>
        <p className="mt-3 text-base text-gray-300 leading-relaxed">
          Intercept cancellation requests with a branded survey and retention offer flow.
        </p>
      </section>

      {/* POST /v1/retention/token */}
      <section className="mt-8">
        <div className="flex items-center gap-3">
          <span className="rounded bg-green-500/10 px-2 py-0.5 text-xs font-mono font-medium text-green-400">
            POST
          </span>
          <h3 className="text-lg font-semibold text-white font-mono">
            /v1/retention/token
          </h3>
        </div>
        <p className="mt-3 text-base text-gray-300 leading-relaxed">
          Generate a short-lived JWT token for the public cancellation page. Requires API key auth.
        </p>

        <div className="mt-4 space-y-4">
          <div>
            <h4 className="text-sm font-medium text-white mb-2">Request body</h4>
            <div className="overflow-x-auto rounded-lg border border-white/10 bg-white/5 px-5 py-4">
              <pre className="text-sm font-mono">
                <code>
{`{
  "userId": "user_abc123",        // required — external user ID
  "productId": "clxxx..."         // optional — specific product
}`}
                </code>
              </pre>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-white mb-2">Response</h4>
            <div className="overflow-x-auto rounded-lg border border-white/10 bg-white/5 px-5 py-4">
              <pre className="text-sm font-mono">
                <code>
{`{
  "token": "eyJhbGciOi...",
  "cancelUrl": "https://app.europay.dev/cancel/eyJhbGci...",
  "expiresIn": 3600,
  "productName": "Pro Monthly"
}`}
                </code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* POST /v1/retention/accept */}
      <section className="mt-8">
        <div className="flex items-center gap-3">
          <span className="rounded bg-green-500/10 px-2 py-0.5 text-xs font-mono font-medium text-green-400">
            POST
          </span>
          <h3 className="text-lg font-semibold text-white font-mono">
            /v1/retention/accept
          </h3>
        </div>
        <p className="mt-3 text-base text-gray-300 leading-relaxed">
          Accept a retention offer. Authenticated by the JWT token (no API key required).
          Called from the public cancellation page.
        </p>

        <div className="mt-4 space-y-4">
          <div>
            <h4 className="text-sm font-medium text-white mb-2">Request body</h4>
            <div className="overflow-x-auto rounded-lg border border-white/10 bg-white/5 px-5 py-4">
              <pre className="text-sm font-mono">
                <code>
{`{
  "token": "eyJhbGciOi...",       // required — JWT from /retention/token
  "reason": "Too expensive",      // optional — selected survey reason
  "offerType": "discount",        // "discount" | "pause" | "downgrade"
  "discountPercent": 20,          // for discount offers
  "pauseDays": 30,                // for pause offers
  "downgradeProductId": "cl..."   // for downgrade offers
}`}
                </code>
              </pre>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-white mb-2">Response</h4>
            <div className="overflow-x-auto rounded-lg border border-white/10 bg-white/5 px-5 py-4">
              <pre className="text-sm font-mono">
                <code>
{`{
  "success": true,
  "message": "20% discount applied for 3 months."
}`}
                </code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* POST /v1/retention/cancel */}
      <section className="mt-8">
        <div className="flex items-center gap-3">
          <span className="rounded bg-green-500/10 px-2 py-0.5 text-xs font-mono font-medium text-green-400">
            POST
          </span>
          <h3 className="text-lg font-semibold text-white font-mono">
            /v1/retention/cancel
          </h3>
        </div>
        <p className="mt-3 text-base text-gray-300 leading-relaxed">
          Cancel the subscription at the end of the current billing period. Authenticated by
          JWT token. The subscription remains active until the period ends.
        </p>

        <div className="mt-4 space-y-4">
          <div>
            <h4 className="text-sm font-medium text-white mb-2">Request body</h4>
            <div className="overflow-x-auto rounded-lg border border-white/10 bg-white/5 px-5 py-4">
              <pre className="text-sm font-mono">
                <code>
{`{
  "token": "eyJhbGciOi...",       // required — JWT from /retention/token
  "reason": "Not using it"        // optional — selected survey reason
}`}
                </code>
              </pre>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-white mb-2">Response</h4>
            <div className="overflow-x-auto rounded-lg border border-white/10 bg-white/5 px-5 py-4">
              <pre className="text-sm font-mono">
                <code>
{`{
  "success": true,
  "message": "Your subscription will end at the current billing period."
}`}
                </code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* ════════ Experiments ════════ */}
      <section className="mt-16">
        <h2 className="text-2xl font-semibold text-white">Experiments (A/B Testing)</h2>
        <p className="mt-3 text-base text-gray-300 leading-relaxed">
          Server-side experiment assignment and event tracking. The SDK fetches variant assignments on launch. Purchase events are auto-tagged via webhooks.
        </p>
      </section>

      {/* GET /v1/experiments/config */}
      <section className="mt-8">
        <div className="flex items-center gap-3">
          <span className="rounded bg-blue-500/10 px-2 py-0.5 text-xs font-mono font-medium text-blue-400">
            GET
          </span>
          <h3 className="text-lg font-semibold text-white font-mono">
            /v1/experiments/config
          </h3>
        </div>
        <p className="mt-3 text-base text-gray-300 leading-relaxed">
          Returns the user&apos;s variant assignments for all running experiments. Assigns deterministically if the user hasn&apos;t been assigned yet.
        </p>

        <div className="mt-4 space-y-4">
          <div>
            <h4 className="text-sm font-medium text-white mb-2">Query parameters</h4>
            <div className="overflow-x-auto rounded-lg border border-white/10 bg-white/5 px-5 py-4">
              <pre className="text-sm font-mono">
                <code>
{`GET /api/v1/experiments/config?userId=user_abc123
Authorization: Bearer ep_live_xxx`}
                </code>
              </pre>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-white mb-2">Response</h4>
            <div className="overflow-x-auto rounded-lg border border-white/10 bg-white/5 px-5 py-4">
              <pre className="text-sm font-mono">
                <code>
{`{
  "experiments": [
    {
      "id": "exp_123",
      "name": "Pricing Test",
      "placement": "paywall",
      "variant": {
        "id": "var_456",
        "name": "Variant A",
        "config": {
          "productId": "prod_annual",
          "price": 3999,
          "ctaText": "Save 20%"
        }
      }
    }
  ]
}`}
                </code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* POST /v1/experiments/event */}
      <section className="mt-8">
        <div className="flex items-center gap-3">
          <span className="rounded bg-green-500/10 px-2 py-0.5 text-xs font-mono font-medium text-green-400">
            POST
          </span>
          <h3 className="text-lg font-semibold text-white font-mono">
            /v1/experiments/event
          </h3>
        </div>
        <p className="mt-3 text-base text-gray-300 leading-relaxed">
          Record an experiment event. The user must already be assigned to the experiment (via the config endpoint). Purchase events are auto-tagged — use this for view, custom, and other event types.
        </p>

        <div className="mt-4 space-y-4">
          <div>
            <h4 className="text-sm font-medium text-white mb-2">Request body</h4>
            <div className="overflow-x-auto rounded-lg border border-white/10 bg-white/5 px-5 py-4">
              <pre className="text-sm font-mono">
                <code>
{`{
  "experimentId": "exp_123",      // required
  "userId": "user_abc123",        // required
  "eventType": "view",            // "view", "purchase", "trial_start", etc.
  "revenueCents": 3999,           // optional — for purchase events
  "metadata": { "page": "main" }  // optional — arbitrary data
}`}
                </code>
              </pre>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-white mb-2">Response</h4>
            <div className="overflow-x-auto rounded-lg border border-white/10 bg-white/5 px-5 py-4">
              <pre className="text-sm font-mono">
                <code>
{`{ "success": true }`}
                </code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* ════════ Webhooks ════════ */}
      <section className="mt-16">
        <h2 className="text-2xl font-semibold text-white">Webhooks</h2>
      </section>

      {/* POST /v1/webhooks/stripe */}
      <section className="mt-8">
        <div className="flex items-center gap-3">
          <span className="rounded bg-green-500/10 px-2 py-0.5 text-xs font-mono font-medium text-green-400">
            POST
          </span>
          <h3 className="text-lg font-semibold text-white font-mono">
            /v1/webhooks/stripe
          </h3>
        </div>
        <p className="mt-3 text-base text-gray-300 leading-relaxed">
          Receives Stripe webhook events. Authenticated via Stripe signature
          verification (no API key required). This endpoint processes:
        </p>
        <ul className="mt-3 space-y-1.5 text-base text-gray-300 leading-relaxed">
          <li className="flex items-start gap-2">
            <span className="mt-1 text-teal-400">&#8226;</span>
            <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs font-mono text-teal-300">checkout.session.completed</code>{" "}
            — grants entitlements
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 text-teal-400">&#8226;</span>
            <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs font-mono text-teal-300">customer.subscription.updated</code>{" "}
            — syncs subscription status
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 text-teal-400">&#8226;</span>
            <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs font-mono text-teal-300">customer.subscription.deleted</code>{" "}
            — cancels entitlement
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 text-teal-400">&#8226;</span>
            <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs font-mono text-teal-300">invoice.payment_succeeded</code>{" "}
            — records renewal
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 text-teal-400">&#8226;</span>
            <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs font-mono text-teal-300">invoice.payment_failed</code>{" "}
            — marks expired
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 text-teal-400">&#8226;</span>
            <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs font-mono text-teal-300">charge.refunded</code>{" "}
            — revokes entitlement
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 text-teal-400">&#8226;</span>
            <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs font-mono text-teal-300">charge.dispute.created</code>{" "}
            — marks disputed
          </li>
        </ul>
      </section>

      {/* Developer Webhook Signature Verification */}
      <section className="mt-8">
        <h3 className="text-lg font-semibold text-white">
          Webhook Signature Verification
        </h3>
        <p className="mt-3 text-base text-gray-300 leading-relaxed">
          EuroPay signs webhook payloads using HMAC-SHA256. Each request
          includes{" "}
          <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs font-mono text-teal-300">
            X-EuroPay-Signature
          </code>{" "}
          (the hex-encoded HMAC of{" "}
          <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs font-mono text-teal-300">
            {"{timestamp}.{payload}"}
          </code>{" "}
          using your webhook secret) and{" "}
          <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs font-mono text-teal-300">
            X-EuroPay-Timestamp
          </code>
          . Verify by computing the HMAC on your end and comparing:
        </p>
        <div className="mt-4 overflow-x-auto rounded-lg border border-white/10 bg-white/5 px-5 py-4">
          <pre className="text-sm leading-relaxed font-mono">
            <code>
              <span className="text-gray-500">{"// Node.js verification example"}</span>
              {"\n"}
              <span className="text-purple-400">const</span>{" "}
              <span className="text-white">crypto</span>{" "}
              <span className="text-gray-400">=</span>{" "}
              <span className="text-teal-300">require</span>
              <span className="text-gray-400">(</span>
              <span className="text-orange-300">&quot;crypto&quot;</span>
              <span className="text-gray-400">);</span>
              {"\n\n"}
              <span className="text-purple-400">const</span>{" "}
              <span className="text-white">timestamp</span>{" "}
              <span className="text-gray-400">=</span>{" "}
              <span className="text-white">headers</span>
              <span className="text-gray-400">[</span>
              <span className="text-orange-300">&quot;x-europay-timestamp&quot;</span>
              <span className="text-gray-400">];</span>
              {"\n"}
              <span className="text-purple-400">const</span>{" "}
              <span className="text-white">expected</span>{" "}
              <span className="text-gray-400">=</span>{" "}
              <span className="text-white">crypto</span>
              {"\n"}
              {"  "}
              <span className="text-gray-400">.</span>
              <span className="text-teal-300">createHmac</span>
              <span className="text-gray-400">(</span>
              <span className="text-orange-300">&quot;sha256&quot;</span>
              <span className="text-gray-400">,</span>{" "}
              <span className="text-white">webhookSecret</span>
              <span className="text-gray-400">)</span>
              {"\n"}
              {"  "}
              <span className="text-gray-400">.</span>
              <span className="text-teal-300">update</span>
              <span className="text-gray-400">(</span>
              <span className="text-orange-300">{"`${timestamp}.${rawBody}`"}</span>
              <span className="text-gray-400">)</span>
              {"\n"}
              {"  "}
              <span className="text-gray-400">.</span>
              <span className="text-teal-300">digest</span>
              <span className="text-gray-400">(</span>
              <span className="text-orange-300">&quot;hex&quot;</span>
              <span className="text-gray-400">);</span>
              {"\n\n"}
              <span className="text-purple-400">const</span>{" "}
              <span className="text-white">valid</span>{" "}
              <span className="text-gray-400">=</span>{" "}
              <span className="text-white">expected</span>{" "}
              <span className="text-gray-400">===</span>{" "}
              <span className="text-white">headers</span>
              <span className="text-gray-400">[</span>
              <span className="text-orange-300">&quot;x-europay-signature&quot;</span>
              <span className="text-gray-400">];</span>
            </code>
          </pre>
        </div>
      </section>

      {/* Error responses */}
      <section className="mt-16">
        <h2 className="text-2xl font-semibold text-white">Error Responses</h2>
        <p className="mt-3 text-base text-gray-300 leading-relaxed">
          All error responses follow a consistent format:
        </p>
        <div className="mt-4 overflow-x-auto rounded-lg border border-white/10 bg-white/5 px-5 py-4">
          <pre className="text-sm leading-relaxed font-mono">
            <code>
              <span className="text-gray-400">{"{"}</span>
              {"\n"}
              {"  "}
              <span className="text-teal-300">&quot;error&quot;</span>
              <span className="text-gray-400">:</span>{" "}
              <span className="text-orange-300">&quot;Human-readable error message&quot;</span>
              <span className="text-gray-400">,</span>
              {"\n"}
              {"  "}
              <span className="text-teal-300">&quot;code&quot;</span>
              <span className="text-gray-400">:</span>{" "}
              <span className="text-orange-300">&quot;MACHINE_READABLE_CODE&quot;</span>
              {"\n"}
              <span className="text-gray-400">{"}"}</span>
            </code>
          </pre>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left">
                <th className="pb-3 pr-4 font-medium text-gray-400">Status</th>
                <th className="pb-3 font-medium text-gray-400">Meaning</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <tr>
                <td className="py-2.5 pr-4 font-mono text-xs text-teal-300">400</td>
                <td className="py-2.5 text-gray-400">Invalid JSON or validation error</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4 font-mono text-xs text-teal-300">401</td>
                <td className="py-2.5 text-gray-400">Missing or invalid API key</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4 font-mono text-xs text-teal-300">403</td>
                <td className="py-2.5 text-gray-400">API key doesn&apos;t match the requested resource</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4 font-mono text-xs text-teal-300">404</td>
                <td className="py-2.5 text-gray-400">Resource not found</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4 font-mono text-xs text-teal-300">409</td>
                <td className="py-2.5 text-gray-400">Conflict (e.g. already paused, already deleted)</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4 font-mono text-xs text-teal-300">422</td>
                <td className="py-2.5 text-gray-400">Precondition not met (e.g. no Stripe account connected)</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4 font-mono text-xs text-teal-300">500</td>
                <td className="py-2.5 text-gray-400">Internal server error</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <DocsNavigation
        prev={{ href: "/docs/dma-compliance", label: "DMA Compliance" }}
        next={{ href: "/docs/changelog", label: "Changelog" }}
      />
    </article>
  )
}
