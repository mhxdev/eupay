"use client"

import { useState } from "react"

type RetentionOffer = {
  type: "discount" | "pause" | "downgrade"
  label: string
  discountPercent?: number
  pauseDays?: number
  downgradeProductId?: string
}

type Props = {
  token: string
  appName: string
  productName: string
  surveyQuestions: string[]
  retentionOffers: RetentionOffer[]
}

type Step = "survey" | "offer" | "confirming" | "done"

export function CancelFlow({
  token,
  appName,
  productName,
  surveyQuestions,
  retentionOffers,
}: Props) {
  const [step, setStep] = useState<Step>("survey")
  const [reason, setReason] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ type: "saved" | "cancelled"; message: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleAcceptOffer(offer: RetentionOffer) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/v1/retention/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          reason,
          offerType: offer.type,
          discountPercent: offer.discountPercent,
          pauseDays: offer.pauseDays,
          downgradeProductId: offer.downgradeProductId,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Something went wrong")
        setLoading(false)
        return
      }
      setResult({ type: "saved", message: data.message || "Your subscription has been updated." })
      setStep("done")
    } catch {
      setError("Network error. Please try again.")
    }
    setLoading(false)
  }

  async function handleCancel() {
    setLoading(true)
    setError(null)
    setStep("confirming")
    try {
      const res = await fetch("/api/v1/retention/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, reason }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Something went wrong")
        setStep("offer")
        setLoading(false)
        return
      }
      setResult({ type: "cancelled", message: data.message || "Your subscription will end at the current period." })
      setStep("done")
    } catch {
      setError("Network error. Please try again.")
      setStep("offer")
    }
    setLoading(false)
  }

  if (step === "done" && result) {
    return (
      <div className="space-y-4 text-center">
        <div className="text-4xl">{result.type === "saved" ? "🎉" : "👋"}</div>
        <h2 className="text-xl font-semibold text-white">
          {result.type === "saved" ? "Welcome back!" : "Subscription cancelled"}
        </h2>
        <p className="text-zinc-400 text-sm">{result.message}</p>
      </div>
    )
  }

  if (step === "confirming") {
    return (
      <div className="space-y-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto" />
        <p className="text-zinc-400 text-sm">Processing your request...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white">
          {step === "survey" ? "We're sorry to see you go" : "Before you go..."}
        </h2>
        <p className="text-zinc-400 text-sm mt-1">
          {step === "survey"
            ? `Cancelling ${productName} for ${appName}`
            : "Would any of these help you stay?"}
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {step === "survey" && (
        <>
          <p className="text-sm text-zinc-400">
            Please let us know why you&apos;re cancelling (optional):
          </p>
          <div className="space-y-2">
            {surveyQuestions.map((q) => (
              <button
                key={q}
                onClick={() => setReason(q)}
                className={`w-full text-left rounded-lg border px-4 py-3 text-sm transition-colors ${
                  reason === q
                    ? "border-teal-500 bg-teal-500/10 text-teal-300"
                    : "border-zinc-700 text-zinc-300 hover:border-zinc-500"
                }`}
              >
                {q}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-2 pt-2">
            {retentionOffers.length > 0 ? (
              <button
                onClick={() => setStep("offer")}
                className="w-full rounded-lg bg-white text-zinc-900 font-medium px-4 py-3 text-sm hover:bg-zinc-200 transition-colors"
              >
                Continue
              </button>
            ) : (
              <button
                onClick={handleCancel}
                disabled={loading}
                className="w-full rounded-lg bg-red-600 text-white font-medium px-4 py-3 text-sm hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                Cancel Subscription
              </button>
            )}
            <button
              onClick={() => setStep("offer")}
              className="text-xs text-zinc-500 underline hover:text-zinc-400"
            >
              {retentionOffers.length > 0 ? "Skip survey" : ""}
            </button>
          </div>
        </>
      )}

      {step === "offer" && (
        <>
          {retentionOffers.length > 0 && (
            <div className="space-y-3">
              {retentionOffers.map((offer, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAcceptOffer(offer)}
                  disabled={loading}
                  className="w-full rounded-lg border border-teal-500/30 bg-teal-500/10 px-4 py-3 text-sm text-teal-300 text-left hover:bg-teal-500/20 transition-colors disabled:opacity-50"
                >
                  {offer.label}
                </button>
              ))}
            </div>
          )}

          {/* EU compliance: cancel option always visible */}
          <button
            onClick={handleCancel}
            disabled={loading}
            className="w-full rounded-lg border border-zinc-700 text-zinc-400 px-4 py-3 text-sm hover:border-zinc-500 hover:text-zinc-300 transition-colors disabled:opacity-50"
          >
            No thanks, cancel my subscription
          </button>
        </>
      )}
    </div>
  )
}
