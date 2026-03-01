import { AlertTriangle } from "lucide-react"

export function SandboxBanner() {
  return (
    <div className="rounded-md border border-amber-300/40 bg-amber-50 px-4 py-2.5 flex items-center gap-2">
      <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
      <p className="text-sm text-amber-800">
        <span className="font-medium">Sandbox mode</span> — transactions are
        simulated and no real payments are processed.
      </p>
    </div>
  )
}
