"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useState, Suspense } from "react"

function CheckoutReturnContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session") ?? ""
  const scheme = searchParams.get("scheme") ?? ""
  const cancelled = searchParams.get("cancelled") === "true"
  const [showFallback, setShowFallback] = useState(false)

  useEffect(() => {
    if (!scheme) {
      setShowFallback(true)
      return
    }

    const redirectUrl = `${scheme}://europay-return?session=${encodeURIComponent(sessionId)}${cancelled ? "&cancelled=true" : ""}`

    const timer = setTimeout(() => {
      window.location.href = redirectUrl
    }, cancelled ? 1000 : 1500)

    // If still on page after redirect attempt, show fallback
    const fallbackTimer = setTimeout(() => {
      setShowFallback(true)
    }, cancelled ? 3000 : 3500)

    return () => {
      clearTimeout(timer)
      clearTimeout(fallbackTimer)
    }
  }, [scheme, sessionId, cancelled])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0f1e] px-4">
      <div className="mx-auto max-w-sm text-center">
        {cancelled ? (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-500/10 border border-gray-500/20">
              <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="mt-6 text-xl font-semibold text-white">
              Purchase cancelled
            </h1>
            <p className="mt-2 text-sm text-gray-400">
              {showFallback
                ? "Tap Done in the toolbar to return to your app."
                : "Returning to app..."}
            </p>
          </>
        ) : (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-teal-500/10 border border-teal-500/20">
              <svg className="h-8 w-8 text-teal-400 animate-[scale_0.5s_ease-out]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="mt-6 text-xl font-semibold text-white">
              Payment successful!
            </h1>
            <p className="mt-2 text-sm text-gray-400">
              {showFallback
                ? "Your purchase has been confirmed. Tap Done in the toolbar to return to your app."
                : "Returning to app..."}
            </p>
          </>
        )}

        {showFallback && (
          <div className="mt-8 rounded-lg border border-white/10 bg-white/5 px-4 py-3">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-300">
              <svg className="h-4 w-4 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              <span>Tap <strong className="text-white">Done</strong> to return to your app</span>
            </div>
          </div>
        )}

        {/* Loading indicator */}
        {!showFallback && (
          <div className="mt-8">
            <div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-teal-400 border-t-transparent" />
          </div>
        )}
      </div>

      {/* Branding */}
      <div className="absolute bottom-8 text-center">
        <p className="text-xs text-gray-600">Secured by EuroPay</p>
      </div>
    </div>
  )
}

export default function CheckoutReturnPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#0a0f1e]">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-teal-400 border-t-transparent" />
        </div>
      }
    >
      <CheckoutReturnContent />
    </Suspense>
  )
}
