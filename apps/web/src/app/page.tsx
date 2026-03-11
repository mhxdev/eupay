import Link from "next/link"
import {
  Shield,
  FileText,
  Receipt,
  CreditCard,
  UserCheck,
  Zap,
  ArrowRight,
  Check,
  Package,
  LayoutDashboard,
  BadgeCheck,
} from "lucide-react"
import { SignedIn, SignedOut } from "@clerk/nextjs"
import { RevenueCalculator } from "@/components/RevenueCalculator"

function Nav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-[#0a0f1e]/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center px-6">
        {/* Left: Logo */}
        <div className="flex-1">
          <Link href="/" className="text-lg font-bold text-white">
            EuroPay
          </Link>
        </div>

        {/* Center: Navigation (desktop) */}
        <div className="hidden items-center gap-6 text-sm md:flex">
          <div className="group relative">
            <button className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors">
              Documentation
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className="pointer-events-none absolute left-1/2 top-full pt-2 -translate-x-1/2 opacity-0 transition-all group-hover:pointer-events-auto group-hover:opacity-100">
              <div className="w-52 rounded-lg border border-white/10 bg-[#0f1629] p-1.5 shadow-xl">
                <Link
                  href="/docs/getting-started"
                  className="block rounded-md px-3 py-2.5 transition-colors hover:bg-white/5"
                >
                  <span className="text-sm font-medium text-white">Guides</span>
                  <span className="mt-0.5 block text-xs text-gray-500">Get started here</span>
                </Link>
                <Link
                  href="/docs/api-reference"
                  className="block rounded-md px-3 py-2.5 transition-colors hover:bg-white/5"
                >
                  <span className="text-sm font-medium text-white">API</span>
                  <span className="mt-0.5 block text-xs text-gray-500">Full technical reference</span>
                </Link>
              </div>
            </div>
          </div>
          <Link href="/pricing" className="text-gray-400 hover:text-white transition-colors">
            Pricing
          </Link>
        </div>

        {/* Right: Auth-aware button */}
        <div className="flex flex-1 justify-end">
          <SignedOut>
            <Link
              href="/sign-up"
              className="rounded-full border border-teal-500 px-4 py-1.5 text-sm font-medium text-teal-400 transition-colors hover:bg-teal-500/10"
            >
              Get Started
            </Link>
          </SignedOut>
          <SignedIn>
            <Link
              href="/dashboard"
              className="rounded-full border border-teal-500 px-4 py-1.5 text-sm font-medium text-teal-400 transition-colors hover:bg-teal-500/10"
            >
              Dashboard
            </Link>
          </SignedIn>
        </div>
      </div>
    </nav>
  )
}

function Hero() {
  return (
    <section className="relative pt-32 pb-20 px-6 md:pt-40 md:pb-28">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-12 md:grid-cols-2 md:items-center">
          <div>
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-white md:text-5xl lg:text-6xl">
              Pay{" "}
              <span className="text-teal-400">~8%</span>{" "}
              instead of 30%
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-gray-400 md:text-xl">
              EuroPay routes EU in-app purchases through Stripe instead of Apple.
              DMA-compliant, drop-in SDK, 15-minute integration.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/sign-up"
                className="inline-flex items-center gap-2 rounded-md bg-teal-500 px-6 py-3 text-sm font-medium text-white hover:bg-teal-400 transition-colors"
              >
                Start for free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/docs"
                className="inline-flex items-center gap-2 rounded-md border border-white/20 px-6 py-3 text-sm font-medium text-gray-300 hover:border-white/40 hover:text-white transition-colors"
              >
                Read the docs
              </Link>
            </div>
          </div>
          <div className="relative">
            <div className="rounded-lg border border-white/10 bg-white/5 p-1">
              <div className="flex items-center gap-2 px-4 py-2 border-b border-white/10">
                <div className="h-3 w-3 rounded-full bg-white/20" />
                <div className="h-3 w-3 rounded-full bg-white/20" />
                <div className="h-3 w-3 rounded-full bg-white/20" />
                <span className="ml-2 text-xs text-gray-500 font-mono">ContentView.swift</span>
              </div>
              <pre className="overflow-x-auto p-5 text-sm leading-relaxed font-mono">
                <code>
                  <span className="text-purple-400">struct</span>{" "}
                  <span className="text-teal-300">ContentView</span>
                  <span className="text-gray-400">:</span>{" "}
                  <span className="text-teal-300">View</span>{" "}
                  <span className="text-gray-400">{"{"}</span>
                  {"\n"}
                  {"  "}
                  <span className="text-purple-400">var</span>{" "}
                  <span className="text-white">body</span>
                  <span className="text-gray-400">:</span>{" "}
                  <span className="text-purple-400">some</span>{" "}
                  <span className="text-teal-300">View</span>{" "}
                  <span className="text-gray-400">{"{"}</span>
                  {"\n"}
                  {"    "}
                  <span className="text-gray-500">// Check region and purchase</span>
                  {"\n"}
                  {"    "}
                  <span className="text-purple-400">let</span>{" "}
                  <span className="text-white">region</span>{" "}
                  <span className="text-gray-400">=</span>{" "}
                  <span className="text-purple-400">try await</span>{" "}
                  <span className="text-teal-300">europay</span>
                  <span className="text-gray-400">.</span>
                  <span className="text-yellow-300">checkRegion</span>
                  <span className="text-gray-400">()</span>
                  {"\n"}
                  {"    "}
                  <span className="text-purple-400">let</span>{" "}
                  <span className="text-white">products</span>{" "}
                  <span className="text-gray-400">=</span>{" "}
                  <span className="text-purple-400">try await</span>{" "}
                  <span className="text-teal-300">europay</span>
                  <span className="text-gray-400">.</span>
                  <span className="text-yellow-300">fetchProducts</span>
                  <span className="text-gray-400">()</span>
                  {"\n"}
                  {"    "}
                  <span className="text-purple-400">try await</span>{" "}
                  <span className="text-teal-300">europay</span>
                  <span className="text-gray-400">.</span>
                  <span className="text-yellow-300">purchase</span>
                  <span className="text-gray-400">(</span>
                  <span className="text-white">product</span>
                  <span className="text-gray-400">:</span>{" "}
                  <span className="text-white">products</span>
                  <span className="text-gray-400">[</span>
                  <span className="text-orange-300">0</span>
                  <span className="text-gray-400">])</span>
                  {"\n"}
                  {"  "}
                  <span className="text-gray-400">{"}"}</span>
                  {"\n"}
                  <span className="text-gray-400">{"}"}</span>
                </code>
              </pre>
            </div>
            <p className="mt-3 text-center text-xs text-gray-500">
              That&apos;s it. One modifier. Full EU payment flow.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

function SocialProof() {
  const stats = [
    { value: "~8%", label: "total fees" },
    { value: "15-min", label: "integration" },
    { value: "EU DMA", label: "compliant" },
  ]

  return (
    <section className="border-y border-white/10 bg-white/[0.02] py-10 px-6">
      <div className="mx-auto grid max-w-4xl grid-cols-3 gap-4 text-center">
        {stats.map((stat) => (
          <div key={stat.label}>
            <p className="text-2xl font-bold text-teal-400 md:text-3xl">
              {stat.value}
            </p>
            <p className="mt-1 text-sm text-gray-400">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function FeeComparison() {
  return (
    <section className="py-20 px-6 md:py-28">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-3xl font-bold text-white md:text-4xl">
          Stop leaving money on the table
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-gray-400">
          Compare your total cost per transaction across payment options.
        </p>
        <div className="mt-12 grid gap-6 md:grid-cols-2 max-w-3xl mx-auto">
          {/* Apple IAP */}
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
            <h3 className="text-lg font-semibold text-white">Apple IAP</h3>
            <p className="mt-4">
              <span className="text-4xl font-bold text-white">30%</span>
              <span className="ml-1 text-sm text-gray-400">fee</span>
            </p>
            <p className="mt-1 text-sm text-gray-500">
              15% for small developers under $1M/year
            </p>
            <ul className="mt-6 space-y-3 text-sm text-gray-400">
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />
                Apple handles everything
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 h-4 w-4 shrink-0 text-center text-gray-500">&minus;</span>
                No alternative payment methods
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 h-4 w-4 shrink-0 text-center text-gray-500">&minus;</span>
                No developer control
              </li>
            </ul>
          </div>
          {/* EuroPay */}
          <div className="relative rounded-xl border border-teal-500/50 bg-teal-500/5 ring-1 ring-teal-500/20 p-6">
            <span className="absolute -top-3 left-6 rounded-full bg-teal-500 px-3 py-0.5 text-xs font-medium text-white">
              Recommended
            </span>
            <h3 className="text-lg font-semibold text-white">EuroPay</h3>
            <p className="mt-4">
              <span className="text-4xl font-bold text-white">~8%</span>
              <span className="ml-1 text-sm text-gray-400">total</span>
            </p>
            <ul className="mt-4 space-y-1 text-sm">
              <li className="flex items-center justify-between">
                <span className="text-gray-400">EuroPay fee</span>
                <span className="font-medium text-white">1.5%</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-gray-400">Stripe fee</span>
                <span className="font-medium text-white">~1.5% + &euro;0.25</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-gray-400">Apple Core Technology Fee</span>
                <span className="font-medium text-white">~5%</span>
              </li>
            </ul>
            <ul className="mt-6 space-y-3 text-sm text-gray-400">
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal-400" />
                Full developer control
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal-400" />
                Apple Pay, Google Pay, SEPA included
              </li>
            </ul>
          </div>
        </div>
        <p className="mt-10 text-center text-sm font-medium text-teal-400">
          Save up to 22 percentage points vs Apple IAP
        </p>

        {/* Interactive calculator */}
        <div className="mt-12 max-w-3xl mx-auto">
          <RevenueCalculator />
        </div>
      </div>
    </section>
  )
}

function HowItWorks() {
  const steps = [
    {
      number: "1",
      icon: Package,
      title: "Install EuroPayKit via SPM",
      description:
        "Add the Swift package to your Xcode project. Zero external dependencies, iOS 16+.",
      code: "https://github.com/mhxdev/EuroPayKit",
    },
    {
      number: "2",
      icon: LayoutDashboard,
      title: "Create products in the dashboard",
      description:
        "Register your app, set up products with pricing, and get your API key. Takes 2 minutes.",
      code: null,
    },
    {
      number: "3",
      icon: BadgeCheck,
      title: "Request Apple entitlement and go live",
      description:
        "Apply for the External Purchase Link Entitlement in App Store Connect. EuroPay handles the rest.",
      code: null,
    },
  ]

  return (
    <section className="border-t border-white/10 bg-white/[0.02] py-20 px-6 md:py-28">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-3xl font-bold text-white md:text-4xl">
          How it works
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-gray-400">
          Three steps from zero to accepting EU payments outside the App Store.
        </p>
        <div className="mt-14 grid gap-10 md:grid-cols-3">
          {steps.map((step) => (
            <div key={step.number} className="relative">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-teal-500/10 text-teal-400 font-bold text-sm border border-teal-500/20">
                {step.number}
              </div>
              <h3 className="text-lg font-semibold text-white">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-400">
                {step.description}
              </p>
              {step.code && (
                <div className="mt-3 overflow-x-auto rounded-md border border-white/10 bg-white/5 px-4 py-2.5">
                  <code className="text-xs text-teal-300 font-mono">
                    {step.code}
                  </code>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Features() {
  const features = [
    {
      icon: Shield,
      title: "EU DMA compliant",
      description:
        "Full compliance with the Digital Markets Act. ExternalPurchaseCustomLink integration handled by the SDK.",
    },
    {
      icon: FileText,
      title: "Apple CTC reporting",
      description:
        "Transaction reporting to Apple's External Purchase Server API — automated, including nil reports.",
    },
    {
      icon: Receipt,
      title: "VAT & tax managed",
      description:
        "EU VAT calculated and collected automatically via Stripe Tax. One-Stop Shop remittance included.",
    },
    {
      icon: CreditCard,
      title: "Stripe-powered payments",
      description:
        "PCI Level 1 payment processing. Cards, SEPA, Apple Pay — all through Stripe's infrastructure.",
    },
    {
      icon: UserCheck,
      title: "GDPR tools included",
      description:
        "Data export, erasure, and portability built into the dashboard. GoBD-compliant record retention.",
    },
    {
      icon: Zap,
      title: "15-minute integration",
      description:
        "One Swift Package, one view modifier, one API key. Get from zero to checkout in a single sitting.",
    },
  ]

  return (
    <section className="py-20 px-6 md:py-28">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-3xl font-bold text-white md:text-4xl">
          Everything you need to sell in the EU
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-gray-400">
          EuroPay handles the hard parts so you can focus on building your app.
        </p>
        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
              <feature.icon className="h-5 w-5 text-teal-400" />
              <h3 className="mt-4 text-base font-semibold text-white">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CtaSection() {
  return (
    <section className="border-t border-white/10 bg-white/[0.02] py-20 px-6 md:py-28">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold text-white md:text-4xl">
          Ready to pay ~8% instead of 30%?
        </h2>
        <p className="mt-4 text-gray-400">
          Create your account in 30 seconds. No credit card required.
        </p>
        <Link
          href="/sign-up"
          className="mt-8 inline-flex items-center gap-2 rounded-md bg-teal-500 px-8 py-3 text-sm font-medium text-white hover:bg-teal-400 transition-colors"
        >
          Start for free — no credit card
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-white/10 py-6 px-6">
      <div className="mx-auto flex max-w-6xl items-center justify-center gap-6 text-sm text-gray-500">
        <p>
          &copy; 2026{" "}
          <Link href="/" className="hover:text-gray-300 transition-colors">
            EuroPay
          </Link>
        </p>
        <Link href="/impressum" className="hover:text-gray-300 transition-colors">
          Impressum
        </Link>
        <Link href="/privacy" className="hover:text-gray-300 transition-colors">
          Privacy
        </Link>
        <Link href="/terms" className="hover:text-gray-300 transition-colors">
          Terms
        </Link>
      </div>
    </footer>
  )
}

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white">
      <Nav />
      <Hero />
      <SocialProof />
      <FeeComparison />
      <HowItWorks />
      <Features />
      <CtaSection />
      <Footer />
    </div>
  )
}
