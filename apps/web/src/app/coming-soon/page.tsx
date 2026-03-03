export default function ComingSoonPage() {
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

      <div className="mt-8 flex w-full max-w-sm gap-2">
        <input
          type="email"
          placeholder="you@example.com"
          className="flex-1 rounded-md border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
        />
        <a
          href="mailto:hello@europay.dev?subject=Notify%20me%20when%20EuroPay%20launches"
          className="shrink-0 rounded-md bg-teal-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-400 transition-colors"
        >
          Notify Me
        </a>
      </div>
    </div>
  )
}
