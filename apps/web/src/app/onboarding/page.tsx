"use client"

import { useAuth } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

const REVENUE_TIERS = [
  { value: "<1k", label: "Less than €1,000/mo" },
  { value: "1k-10k", label: "€1,000 – €10,000/mo" },
  { value: "10k-100k", label: "€10,000 – €100,000/mo" },
  { value: ">100k", label: "More than €100,000/mo" },
]

export default function OnboardingPage() {
  const { isLoaded, isSignedIn } = useAuth()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  // Step 1 state
  const [appName, setAppName] = useState("")
  const [bundleId, setBundleId] = useState("")
  const [revenueTier, setRevenueTier] = useState("")

  // Step 2 state
  const [plan, setPlan] = useState("")

  // Step 3 state
  const [apiKey, setApiKey] = useState("")
  const [copied, setCopied] = useState(false)

  // Redirect if not authenticated
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/sign-in")
    }
  }, [isLoaded, isSignedIn, router])

  // Check if user already has an app
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return
    fetch("/api/onboarding")
      .then((res) => res.json())
      .then((data) => {
        if (data.hasApp) {
          router.push("/dashboard")
        } else {
          setLoading(false)
        }
      })
      .catch(() => setLoading(false))
  }, [isLoaded, isSignedIn, router])

  async function handleStep1Next() {
    if (!appName.trim() || !bundleId.trim() || !revenueTier) {
      setError("All fields are required")
      return
    }
    if (!/^[a-zA-Z][a-zA-Z0-9]*(\.[a-zA-Z][a-zA-Z0-9]*){2,}$/.test(bundleId)) {
      setError("Enter a valid bundle ID (e.g. com.company.app)")
      return
    }
    setError("")
    setStep(2)
  }

  async function handleStep2Next() {
    if (!plan) {
      setError("Select a plan")
      return
    }
    setError("")
    setSubmitting(true)

    try {
      // Create the app
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appName, bundleId, revenueTier, plan }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Something went wrong")
        setSubmitting(false)
        return
      }

      // Generate API key
      const keyRes = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appId: data.appId }),
      })
      const keyData = await keyRes.json()
      if (!keyRes.ok) {
        setError(keyData.error || "Failed to generate API key")
        setSubmitting(false)
        return
      }

      setApiKey(keyData.apiKey)
      setStep(3)
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(apiKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!isLoaded || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0f1e]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-teal-400 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0f1e] px-4 pt-16 pb-12">
      <div className="mx-auto w-full max-w-lg">
        {/* Header */}
        <h1 className="text-center text-2xl font-bold text-white">
          Set up your app
        </h1>
        <p className="mt-2 text-center text-sm text-gray-400">
          {step === 1 && "Tell us about your iOS app"}
          {step === 2 && "Choose your payment plan"}
          {step === 3 && "Your API key is ready"}
        </p>

        {/* Progress bar */}
        <div className="mt-8 flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                s <= step ? "bg-teal-500" : "bg-white/10"
              }`}
            />
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[11px] text-gray-500">
          <span>App details</span>
          <span>Plan</span>
          <span>API key</span>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-6 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Step 1: App details */}
        {step === 1 && (
          <div className="mt-8 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300">
                App name
              </label>
              <input
                type="text"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                placeholder="My Awesome App"
                className="mt-1.5 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300">
                Bundle ID
              </label>
              <input
                type="text"
                value={bundleId}
                onChange={(e) => setBundleId(e.target.value)}
                placeholder="com.company.app"
                className="mt-1.5 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300">
                Estimated monthly revenue
              </label>
              <select
                value={revenueTier}
                onChange={(e) => setRevenueTier(e.target.value)}
                className="mt-1.5 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 [&>option]:bg-[#0a0f1e]"
              >
                <option value="" disabled>
                  Select a tier
                </option>
                {REVENUE_TIERS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleStep1Next}
              className="mt-2 w-full rounded-md bg-teal-500 py-2.5 text-sm font-medium text-white hover:bg-teal-400 transition-colors"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 2: Plan selection */}
        {step === 2 && (
          <div className="mt-8 space-y-4">
            {/* Managed */}
            <button
              onClick={() => setPlan("managed")}
              className={`w-full rounded-xl border p-5 text-left transition-colors ${
                plan === "managed"
                  ? "border-teal-500/50 bg-teal-500/5 ring-1 ring-teal-500/30"
                  : "border-white/10 bg-white/[0.02] hover:border-white/20"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold text-white">
                  Managed
                </span>
                <span className="rounded-full bg-teal-500/10 px-3 py-0.5 text-xs font-medium text-teal-400 border border-teal-500/20">
                  Recommended
                </span>
              </div>
              <p className="mt-3">
                <span className="text-3xl font-bold text-white">11.5%</span>
                <span className="ml-1 text-sm text-gray-400">total per transaction</span>
              </p>
              <ul className="mt-3 space-y-1 text-sm text-gray-400">
                <li>EuroPay 5% + Apple CTC 5% + Stripe ~1.5%</li>
                <li>We handle VAT, refunds, disputes, emails</li>
                <li>Fully managed Merchant of Record</li>
              </ul>
            </button>

            {/* BYOS */}
            <button
              onClick={() => setPlan("byos")}
              className={`w-full rounded-xl border p-5 text-left transition-colors ${
                plan === "byos"
                  ? "border-teal-500/50 bg-teal-500/5 ring-1 ring-teal-500/30"
                  : "border-white/10 bg-white/[0.02] hover:border-white/20"
              }`}
            >
              <span className="text-base font-semibold text-white">
                BYOS — Bring Your Own Stripe
              </span>
              <p className="mt-3">
                <span className="text-3xl font-bold text-white">7%</span>
                <span className="ml-1 text-sm text-gray-400">total per transaction</span>
              </p>
              <ul className="mt-3 space-y-1 text-sm text-gray-400">
                <li>EuroPay 0.5% + Apple CTC 5% + Stripe ~1.5%</li>
                <li>Connect your own Stripe account</li>
                <li>You manage VAT and disputes</li>
              </ul>
            </button>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setError("")
                  setStep(1)
                }}
                className="flex-1 rounded-md border border-white/10 py-2.5 text-sm font-medium text-gray-300 hover:border-white/20 hover:text-white transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleStep2Next}
                disabled={submitting || !plan}
                className="flex-1 rounded-md bg-teal-500 py-2.5 text-sm font-medium text-white hover:bg-teal-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Creating..." : "Continue"}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: API key */}
        {step === 3 && (
          <div className="mt-8 space-y-6">
            <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 px-4 py-3">
              <p className="text-sm font-medium text-yellow-400">
                Save this key — it won&apos;t be shown again
              </p>
              <p className="mt-1 text-xs text-yellow-400/70">
                Store it securely. You&apos;ll need it to configure EuroPayKit in your iOS app.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">
                Your API key
              </label>
              <div className="mt-1.5 flex items-center gap-2">
                <div className="flex-1 overflow-x-auto rounded-md border border-white/10 bg-white/5 px-4 py-3">
                  <code className="text-sm font-mono text-teal-300 break-all">
                    {apiKey}
                  </code>
                </div>
                <button
                  onClick={handleCopy}
                  className="shrink-0 rounded-md border border-white/10 px-3 py-3 text-sm text-gray-400 hover:border-white/20 hover:text-white transition-colors"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">
                Quick start
              </label>
              <div className="mt-1.5 overflow-x-auto rounded-lg border border-white/10 bg-white/5 px-5 py-4">
                <pre className="text-sm leading-relaxed font-mono">
                  <code>
                    <span className="text-purple-400">import</span>{" "}
                    <span className="text-white">EuroPayKit</span>
                    {"\n\n"}
                    <span className="text-teal-300">EuroPayKit</span>
                    <span className="text-gray-400">.</span>
                    <span className="text-white">configure</span>
                    <span className="text-gray-400">(</span>
                    <span className="text-teal-300">EuroPayConfig</span>
                    <span className="text-gray-400">(</span>
                    {"\n"}
                    {"  "}
                    <span className="text-white">apiKey</span>
                    <span className="text-gray-400">:</span>{" "}
                    <span className="text-orange-300">
                      &quot;{apiKey.slice(0, 20)}...&quot;
                    </span>
                    {"\n"}
                    <span className="text-gray-400">))</span>
                  </code>
                </pre>
              </div>
            </div>

            <button
              onClick={() => router.push("/dashboard")}
              className="w-full rounded-md bg-teal-500 py-2.5 text-sm font-medium text-white hover:bg-teal-400 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
