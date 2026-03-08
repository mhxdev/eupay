"use client"

import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import Link from "next/link"

export function ApiKeyReveal({ apiKey }: { apiKey: string }) {
  const [visible, setVisible] = useState(false)
  const [copied, setCopied] = useState(false)

  const maskedKey = apiKey.slice(0, 8) + "\u2022".repeat(24)
  const truncatedKey = apiKey.slice(0, 20) + "..."

  function handleCopy() {
    navigator.clipboard.writeText(apiKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Yellow warning banner */}
      <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 px-4 py-3">
        <p className="text-sm font-medium text-yellow-400">
          Save this key &mdash; it won&apos;t be shown again
        </p>
        <p className="mt-1 text-xs text-yellow-400/70">
          Store it securely. You&apos;ll need it to configure EuroPayKit in your iOS app.
        </p>
      </div>

      {/* API key field */}
      <div>
        <label className="block text-sm font-medium text-gray-300">
          Your API key
        </label>
        <div className="mt-1.5 flex items-center gap-2">
          <div className="flex-1 rounded-md border border-white/10 bg-black/30 px-4 py-3 overflow-x-auto">
            <code className="text-sm font-mono text-teal-300 break-all select-all">
              {visible ? apiKey : maskedKey}
            </code>
          </div>
          <button
            onClick={() => setVisible(!visible)}
            className="shrink-0 rounded-md border border-white/10 p-3 text-gray-400 hover:border-white/20 hover:text-white transition-colors"
            title={visible ? "Hide key" : "Show key"}
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
          <button
            onClick={handleCopy}
            className="shrink-0 rounded-md bg-teal-500 px-4 py-3 text-sm font-medium text-white hover:bg-teal-400 transition-colors"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      {/* Next steps */}
      <div>
        <h3 className="text-sm font-medium text-gray-300">Next steps</h3>
        <div className="mt-3 space-y-4">
          {/* Step 1 */}
          <div className="flex gap-3">
            <StepBadge n={1} />
            <div>
              <p className="text-sm font-medium text-white">
                Add EuroPayKit to your Xcode project
              </p>
              <p className="mt-0.5 text-xs text-gray-400">
                Swift Package Manager &rarr;{" "}
                <span className="text-teal-400 font-mono">
                  https://github.com/mhxdev/EuroPayKit
                </span>
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-3">
            <StepBadge n={2} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white">
                Initialize the SDK in your AppDelegate or App struct
              </p>
              <CodeBlock>{`EuroPayKit.configure(EuroPayConfig(\n  apiKey: "${truncatedKey}"\n))`}</CodeBlock>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-3">
            <StepBadge n={3} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white">
                Show your paywall and trigger a purchase
              </p>
              <CodeBlock>{`let result = try await EuroPayKit.shared.purchase(\n  product: product,\n  userId: "user_123",\n  presenting: viewController\n)`}</CodeBlock>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex gap-3">
            <StepBadge n={4} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white">
                Check access to gate premium content
              </p>
              <CodeBlock>{`let hasAccess = try await EuroPayKit.shared.hasAccess(\n  to: "pro_monthly",\n  userId: "user_123"\n)`}</CodeBlock>
            </div>
          </div>

          {/* Step 5 */}
          <div className="flex gap-3">
            <StepBadge n={5} />
            <div>
              <p className="text-sm font-medium text-white">
                Connect your Stripe account in the Dashboard
              </p>
              <p className="mt-0.5 text-xs text-gray-400">
                You&apos;ll do this after clicking &quot;Go to Dashboard&quot; below.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Link
        href="/docs/getting-started"
        className="block text-sm text-teal-400 hover:text-teal-300 transition-colors"
      >
        Read the full integration guide &rarr;
      </Link>
    </div>
  )
}

function StepBadge({ n }: { n: number }) {
  return (
    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-500/20 text-[11px] font-bold text-teal-400">
      {n}
    </span>
  )
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="mt-1.5 overflow-x-auto rounded-md border border-white/10 bg-black/30 px-3 py-2.5 text-xs leading-relaxed font-mono text-gray-300">
      {children}
    </pre>
  )
}
