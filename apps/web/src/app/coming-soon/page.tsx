"use client"

import { useState } from "react"
import { Check } from "lucide-react"

export default function ComingSoonPage() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus("loading")
    setErrorMsg("")

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) {
        setStatus("error")
        setErrorMsg(data.error ?? "Something went wrong")
        return
      }
      setStatus("success")
    } catch {
      setStatus("error")
      setErrorMsg("Network error. Please try again.")
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0f1e] px-6 text-white">
      <p className="text-2xl font-bold tracking-tight">EuroPay</p>

      <h1 className="mt-10 text-center text-4xl font-bold tracking-tight md:text-5xl">
        Coming Soon
      </h1>

      <p className="mx-auto mt-4 max-w-md text-center text-gray-400">
        EuroPay is launching soon. Alternative in-app payments for EU iOS
        developers.
      </p>

      {status === "success" ? (
        <div className="mt-8 flex items-center gap-2 text-teal-400">
          <Check className="h-5 w-5" />
          <span className="text-sm font-medium">You&apos;re on the list!</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 w-full max-w-sm space-y-2">
          <div className="flex gap-2">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="flex-1 rounded-md border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="shrink-0 rounded-md bg-teal-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-400 transition-colors disabled:opacity-50"
            >
              {status === "loading" ? "Joining..." : "Notify Me"}
            </button>
          </div>
          {status === "error" && (
            <p className="text-sm text-red-400">{errorMsg}</p>
          )}
        </form>
      )}
    </div>
  )
}
