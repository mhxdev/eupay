"use client"

import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"

export function ApiKeyReveal({ apiKey, label }: { apiKey: string; label?: string }) {
  const [visible, setVisible] = useState(false)
  const [copied, setCopied] = useState(false)

  const maskedKey = apiKey.slice(0, 8) + "\u2022".repeat(24)

  function handleCopy() {
    navigator.clipboard.writeText(apiKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-1.5">
          {label}
        </label>
      )}
      <div className="flex items-center gap-2">
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
  )
}
