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

function Nav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-[#0a0f1e]/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="text-lg font-bold text-white">
          EUPay
        </Link>
        <div className="hidden items-center gap-6 text-sm md:flex">
          <Link href="/docs" className="text-gray-400 hover:text-white transition-colors">
            Docs
          </Link>
          <Link href="/pricing" className="text-gray-400 hover:text-white transition-colors">
            Pricing
          </Link>
          <a
            href="https://github.com/mhxdev/EUPayKit"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-white transition-colors"
          >
            GitHub
          </a>
          <Link
            href="/sign-up"
            className="rounded-md bg-teal-500 px-4 py-2 text-sm font-medium text-white hover:bg-teal-400 transition-colors"
          >
            Get Started
          </Link>
        </div>
        <Link
          href="/sign-up"
          className="rounded-md bg-teal-500 px-3 py-1.5 text-sm font-medium text-white md:hidden"
        >
          Get Started
        </Link>
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
              Cut your EU app store fees by{" "}
              <span className="text-teal-400">65%</span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-gray-400 md:text-xl">
              EUPay routes EU in-app purchases through Stripe instead of Apple.
              Pay 7% instead of 20% — DMA-compliant, fully managed, 15-minute
              integration.
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
                  <span className="text-teal-300">Button</span>
                  <span className="text-gray-400">(</span>
                  <span className="text-orange-300">&quot;Subscribe&quot;</span>
                  <span className="text-gray-400">)</span>{" "}
                  <span className="text-gray-400">{"{"}</span>{" "}
                  <span className="text-gray-400">{"}"}</span>
                  {"\n"}
                  {"      "}
                  <span className="text-yellow-300">.eupayCheckout</span>
                  <span className="text-gray-400">(</span>
                  <span className="text-white">productId</span>
                  <span className="text-gray-400">:</span>{" "}
                  <span className="text-orange-300">&quot;pro_monthly&quot;</span>
                  <span className="text-gray-400">)</span>
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
    { value: "65%", label: "lower fees" },
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
  const plans = [
    {
      name: "Apple IAP",
      total: "20%",
      fees: [
        { label: "Apple commission", value: "15–30%" },
      ],
      note: "Reduced rate for Small Developer Program",
      highlighted: false,
    },
    {
      name: "EUPay Managed",
      total: "11.5%",
      fees: [
        { label: "EUPay fee", value: "5%" },
        { label: "Apple CTC", value: "5%" },
        { label: "Stripe", value: "~1.5%" },
      ],
      note: "We handle everything — MoR, VAT, refunds",
      highlighted: false,
    },
    {
      name: "EUPay BYOS",
      total: "7%",
      fees: [
        { label: "EUPay fee", value: "0.5%" },
        { label: "Apple CTC", value: "5%" },
        { label: "Stripe", value: "~1.5%" },
      ],
      note: "Bring your own Stripe account",
      highlighted: true,
    },
  ]

  return (
    <section className="py-20 px-6 md:py-28">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-3xl font-bold text-white md:text-4xl">
          Stop leaving money on the table
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-gray-400">
          Compare your total cost per transaction across payment options.
        </p>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-xl border p-6 ${
                plan.highlighted
                  ? "border-teal-500/50 bg-teal-500/5 ring-1 ring-teal-500/20"
                  : "border-white/10 bg-white/[0.02]"
              }`}
            >
              {plan.highlighted && (
                <span className="absolute -top-3 left-6 rounded-full bg-teal-500 px-3 py-0.5 text-xs font-medium text-white">
                  Recommended
                </span>
              )}
              <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
              <p className="mt-4">
                <span className="text-4xl font-bold text-white">
                  {plan.total}
                </span>
                <span className="ml-1 text-sm text-gray-400">total</span>
              </p>
              <ul className="mt-6 space-y-2">
                {plan.fees.map((fee) => (
                  <li
                    key={fee.label}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-gray-400">{fee.label}</span>
                    <span className="font-medium text-white">{fee.value}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-xs text-gray-500">{plan.note}</p>
            </div>
          ))}
        </div>
        <p className="mt-10 text-center text-sm text-gray-400">
          A{" "}
          <span className="font-medium text-white">
            &euro;10,000/month
          </span>{" "}
          app saves{" "}
          <span className="font-medium text-teal-400">
            &euro;15,600/year
          </span>{" "}
          on BYOS vs Apple IAP.
        </p>
      </div>
    </section>
  )
}

function HowItWorks() {
  const steps = [
    {
      number: "1",
      icon: Package,
      title: "Install EUPayKit via SPM",
      description:
        "Add the Swift package to your Xcode project. Zero external dependencies, iOS 16+.",
      code: "https://github.com/mhxdev/EUPayKit",
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
        "Apply for the External Purchase Link Entitlement in App Store Connect. EUPay handles the rest.",
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
          EUPay handles the hard parts so you can focus on building your app.
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
          Ready to cut your fees by 65%?
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
    <footer className="border-t border-white/10 py-12 px-6">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 md:flex-row">
        <div className="flex items-center gap-6 text-sm text-gray-500">
          <Link href="/docs" className="hover:text-gray-300 transition-colors">
            Docs
          </Link>
          <a
            href="https://github.com/mhxdev/EUPayKit"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-300 transition-colors"
          >
            GitHub
          </a>
          <Link href="/pricing" className="hover:text-gray-300 transition-colors">
            Pricing
          </Link>
          <Link href="/dashboard" className="hover:text-gray-300 transition-colors">
            Dashboard
          </Link>
          <Link href="/privacy" className="hover:text-gray-300 transition-colors">
            Privacy Policy
          </Link>
          <Link href="/impressum" className="hover:text-gray-300 transition-colors">
            Impressum
          </Link>
          <Link href="/changelog" className="hover:text-gray-300 transition-colors">
            Changelog
          </Link>
          <Link href="/status" className="hover:text-gray-300 transition-colors">
            Status
          </Link>
        </div>
        <p className="text-xs text-gray-600">
          &copy; 2026 EUPay. All rights reserved.
        </p>
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
