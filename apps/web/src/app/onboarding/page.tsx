"use client"

import { useAuth } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

const REVENUE_TIERS = [
  { value: "<1k", label: "Less than \u20AC1,000/mo" },
  { value: "1k-10k", label: "\u20AC1,000 \u2013 \u20AC10,000/mo" },
  { value: "10k-100k", label: "\u20AC10,000 \u2013 \u20AC100,000/mo" },
  { value: ">100k", label: "More than \u20AC100,000/mo" },
]

export default function OnboardingPage() {
  const { isLoaded, isSignedIn } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const [appName, setAppName] = useState("")
  const [bundleId, setBundleId] = useState("")
  const [revenueTier, setRevenueTier] = useState("")

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

  async function handleSubmit() {
    if (!appName.trim() || !bundleId.trim()) {
      setError("App name and bundle ID are required")
      return
    }
    if (!/^[a-zA-Z][a-zA-Z0-9]*(\.[a-zA-Z][a-zA-Z0-9]*){2,}$/.test(bundleId)) {
      setError("Enter a valid bundle ID (e.g. com.company.app)")
      return
    }
    setError("")
    setSubmitting(true)

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appName, bundleId, revenueTier: revenueTier || null, plan: "byos" }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Something went wrong")
        setSubmitting(false)
        return
      }

      router.push("/dashboard")
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setSubmitting(false)
    }
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
        <h1 className="text-center text-2xl font-bold text-white">
          Set up your app
        </h1>
        <p className="mt-2 text-center text-sm text-gray-400">
          Tell us about your iOS app
        </p>

        {error && (
          <div className="mt-6 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

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
            <label className="text-sm font-medium text-gray-300 inline-flex items-center gap-1.5">
              Apple Bundle ID
              <span className="relative group">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 hover:text-gray-200 cursor-help"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                <span className="invisible group-hover:visible absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 rounded-md bg-[#1a2035] border border-white/10 p-2 text-xs text-gray-300 font-normal shadow-md z-50">
                  Your app&apos;s Bundle Identifier from Xcode. You can find it in Xcode &rarr; your project &rarr; General &rarr; Bundle Identifier (e.g., com.yourcompany.yourapp). It must match exactly &mdash; this is how EuroPay links to your iOS app.
                </span>
              </span>
            </label>
            <input
              type="text"
              value={bundleId}
              onChange={(e) => setBundleId(e.target.value)}
              placeholder="com.example.myapp"
              className="mt-1.5 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300">
              Estimated monthly revenue <span className="text-gray-500 font-normal">(optional)</span>
            </label>
            <select
              value={revenueTier}
              onChange={(e) => setRevenueTier(e.target.value)}
              className="mt-1.5 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 [&>option]:bg-[#0a0f1e]"
            >
              <option value="">Select a tier</option>
              {REVENUE_TIERS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="mt-2 w-full rounded-md bg-teal-500 py-2.5 text-sm font-medium text-white hover:bg-teal-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Creating..." : "Create App"}
          </button>
        </div>
      </div>
    </div>
  )
}
