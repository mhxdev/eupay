export default function ApiReferencePage() {
  return (
    <article className="prose-docs">
      <h1 className="text-3xl font-bold tracking-tight text-white">
        API Reference
      </h1>
      <p className="mt-4 text-lg text-gray-400">
        The EUPay REST API. All endpoints are under{" "}
        <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs font-mono text-teal-300">
          /api/v1
        </code>{" "}
        and require a Bearer token unless noted otherwise.
      </p>

      {/* Authentication */}
      <section className="mt-12">
        <h2 className="text-xl font-semibold text-white">Authentication</h2>
        <p className="mt-3 text-sm text-gray-400">
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
              <span className="text-orange-300">Bearer eupay_live_your_api_key</span>
            </code>
          </pre>
        </div>
        <p className="mt-3 text-sm text-gray-400">
          API keys are generated in the{" "}
          <strong className="text-white">Dashboard &rarr; Apps</strong> section.
          Keys are shown once at creation — store them securely.
        </p>
      </section>

      {/* Endpoints table */}
      <section className="mt-12">
        <h2 className="text-xl font-semibold text-white">Endpoints</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left">
                <th className="pb-3 pr-4 font-medium text-gray-400">Method</th>
                <th className="pb-3 pr-4 font-medium text-gray-400">Path</th>
                <th className="pb-3 font-medium text-gray-400">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <tr>
                <td className="py-3 pr-4">
                  <span className="rounded bg-green-500/10 px-2 py-0.5 text-xs font-mono font-medium text-green-400">
                    POST
                  </span>
                </td>
                <td className="py-3 pr-4 font-mono text-xs text-teal-300">
                  /v1/checkout/create
                </td>
                <td className="py-3 text-gray-400">Create a Stripe Checkout session</td>
              </tr>
              <tr>
                <td className="py-3 pr-4">
                  <span className="rounded bg-blue-500/10 px-2 py-0.5 text-xs font-mono font-medium text-blue-400">
                    GET
                  </span>
                </td>
                <td className="py-3 pr-4 font-mono text-xs text-teal-300">
                  /v1/products/:appId
                </td>
                <td className="py-3 text-gray-400">List active products for an app</td>
              </tr>
              <tr>
                <td className="py-3 pr-4">
                  <span className="rounded bg-blue-500/10 px-2 py-0.5 text-xs font-mono font-medium text-blue-400">
                    GET
                  </span>
                </td>
                <td className="py-3 pr-4 font-mono text-xs text-teal-300">
                  /v1/entitlements/:userId
                </td>
                <td className="py-3 text-gray-400">Get entitlements for a user</td>
              </tr>
              <tr>
                <td className="py-3 pr-4">
                  <span className="rounded bg-green-500/10 px-2 py-0.5 text-xs font-mono font-medium text-green-400">
                    POST
                  </span>
                </td>
                <td className="py-3 pr-4 font-mono text-xs text-teal-300">
                  /v1/webhooks/stripe
                </td>
                <td className="py-3 text-gray-400">Stripe webhook receiver (no API key)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* POST /v1/checkout/create */}
      <section className="mt-12">
        <div className="flex items-center gap-3">
          <span className="rounded bg-green-500/10 px-2 py-0.5 text-xs font-mono font-medium text-green-400">
            POST
          </span>
          <h3 className="text-lg font-semibold text-white font-mono">
            /v1/checkout/create
          </h3>
        </div>
        <p className="mt-3 text-sm text-gray-400">
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
                <span className="text-gray-500">// required</span>
                {"\n"}
                {"  "}
                <span className="text-teal-300">&quot;cancelUrl&quot;</span>
                <span className="text-gray-400">:</span>{" "}
                <span className="text-orange-300">&quot;string&quot;</span>
                <span className="text-gray-400">,</span>
                {"        "}
                <span className="text-gray-500">// required</span>
                {"\n"}
                {"  "}
                <span className="text-teal-300">&quot;locale&quot;</span>
                <span className="text-gray-400">:</span>{" "}
                <span className="text-orange-300">&quot;string?&quot;</span>
                <span className="text-gray-400">,</span>
                {"          "}
                <span className="text-gray-500">// &quot;de&quot;, &quot;fr&quot;, etc.</span>
                {"\n"}
                {"  "}
                <span className="text-teal-300">&quot;appleExternalPurchaseToken&quot;</span>
                <span className="text-gray-400">:</span>{" "}
                <span className="text-orange-300">&quot;string?&quot;</span>
                {"  "}
                <span className="text-gray-500">// Apple DMA token</span>
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

      {/* GET /v1/products/:appId */}
      <section className="mt-12">
        <div className="flex items-center gap-3">
          <span className="rounded bg-blue-500/10 px-2 py-0.5 text-xs font-mono font-medium text-blue-400">
            GET
          </span>
          <h3 className="text-lg font-semibold text-white font-mono">
            /v1/products/:appId
          </h3>
        </div>
        <p className="mt-3 text-sm text-gray-400">
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

      {/* GET /v1/entitlements/:userId */}
      <section className="mt-12">
        <div className="flex items-center gap-3">
          <span className="rounded bg-blue-500/10 px-2 py-0.5 text-xs font-mono font-medium text-blue-400">
            GET
          </span>
          <h3 className="text-lg font-semibold text-white font-mono">
            /v1/entitlements/:userId
          </h3>
        </div>
        <p className="mt-3 text-sm text-gray-400">
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

      {/* POST /v1/webhooks/stripe */}
      <section className="mt-12">
        <div className="flex items-center gap-3">
          <span className="rounded bg-green-500/10 px-2 py-0.5 text-xs font-mono font-medium text-green-400">
            POST
          </span>
          <h3 className="text-lg font-semibold text-white font-mono">
            /v1/webhooks/stripe
          </h3>
        </div>
        <p className="mt-3 text-sm text-gray-400">
          Receives Stripe webhook events. Authenticated via Stripe signature
          verification (no API key required). This endpoint processes:
        </p>
        <ul className="mt-3 space-y-1.5 text-sm text-gray-400">
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

      {/* Error responses */}
      <section className="mt-12">
        <h2 className="text-xl font-semibold text-white">Error Responses</h2>
        <p className="mt-3 text-sm text-gray-400">
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
                <td className="py-2.5 pr-4 font-mono text-xs text-teal-300">422</td>
                <td className="py-2.5 text-gray-400">Validation error (check request body)</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4 font-mono text-xs text-teal-300">500</td>
                <td className="py-2.5 text-gray-400">Internal server error</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </article>
  )
}
