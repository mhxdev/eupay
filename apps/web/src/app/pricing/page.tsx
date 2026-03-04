import Link from "next/link"
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Zap,
  CreditCard,
  Shield,
} from "lucide-react"
import { PricingFaq } from "@/components/PricingFaq"

const FEATURES = [
  "Connect your existing Stripe account",
  "Full API and SDK access",
  "Apple DMA reporting automated",
  "GDPR tools included",
  "Webhook delivery",
  "Developer dashboard",
  "EU VAT handled by you via Stripe Tax",
]

const FEE_BREAKDOWN = [
  {
    icon: Zap,
    name: "EuroPay",
    fee: "1.5%",
    description:
      "SDK, developer dashboard, DMA reporting, webhook delivery, GDPR tools",
  },
  {
    icon: CreditCard,
    name: "Stripe",
    fee: "1.5% + \u20AC0.25",
    description:
      "Payment processing for EU card transactions. Published at stripe.com/pricing",
  },
  {
    icon: Shield,
    name: "Apple CTC",
    fee: "~5%",
    description:
      "Apple\u2019s Core Technology Fee, required for all DMA alternative payment providers",
  },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white">
      {/* Nav */}
      <nav className="border-b border-white/10 px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xl font-bold">
              EuroPay
            </Link>
            <span className="text-white/20">/</span>
            <span className="text-sm text-gray-400">Pricing</span>
          </div>
          <Link
            href="/sign-up"
            className="rounded-md bg-teal-500 px-4 py-2 text-sm font-medium text-white hover:bg-teal-400 transition-colors"
          >
            Get Started
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-4xl px-6 py-12 md:py-20">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Simple, transparent pricing
          </h1>
          <p className="mt-3 text-gray-400 md:text-lg">
            No monthly fees. No setup costs. Pay only when you earn.
          </p>
        </div>

        {/* Pricing card */}
        <div className="mx-auto mt-12 max-w-lg">
          <div className="rounded-xl border border-teal-500/50 bg-teal-500/5 ring-1 ring-teal-500/20 p-6 md:p-8">
            <div>
              <h2 className="text-xl font-semibold">Pay as you go</h2>
              <p className="text-sm text-gray-400">
                Connect your Stripe account
              </p>
            </div>

            <div className="mt-6">
              <span className="text-4xl font-bold">1.5%</span>
              <span className="ml-1 text-sm text-gray-400">
                EuroPay fee per transaction
              </span>
            </div>

            <div className="mt-2 space-y-1 text-sm text-gray-400">
              <p>+ Stripe fees (1.5% + &euro;0.25 per EU card transaction)</p>
              <p>+ Apple Core Technology Fee (~5% for most apps)</p>
            </div>

            <p className="mt-3 text-xs text-gray-500">
              Total: from ~8% depending on transaction size
            </p>

            <ul className="mt-6 space-y-2.5">
              {FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal-400" />
                  <span className="text-sm text-gray-300">{feature}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/sign-up"
              className="mt-8 flex items-center justify-center gap-2 rounded-md bg-teal-500 py-3 text-sm font-medium text-white hover:bg-teal-400 transition-colors"
            >
              Get started free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Comparison note */}
        <div className="mx-auto mt-8 max-w-lg text-center">
          <p className="text-sm text-gray-400">
            Apple IAP charges{" "}
            <span className="font-medium text-white">30%</span> (15% for small
            developers). With EuroPay you pay 1.5% to us + Stripe fees +
            Apple CTF.{" "}
            <Link href="/" className="font-medium text-teal-400 hover:text-teal-300 transition-colors">
              Use our calculator
            </Link>{" "}
            to see your exact savings.
          </p>
        </div>

        {/* Fee breakdown */}
        <div className="mt-20">
          <h2 className="text-center text-2xl font-bold md:text-3xl">
            Fee breakdown
          </h2>
          <p className="mt-3 text-center text-gray-400">
            Exactly what each fee covers — no hidden charges.
          </p>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {FEE_BREAKDOWN.map((item) => (
              <div
                key={item.name}
                className="rounded-xl border border-white/10 bg-white/[0.02] p-6"
              >
                <item.icon className="h-5 w-5 text-teal-400" />
                <h3 className="mt-4 text-base font-semibold">{item.name}</h3>
                <p className="mt-1 text-2xl font-bold text-teal-400">
                  {item.fee}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-gray-400">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-20">
          <h2 className="text-center text-2xl font-bold md:text-3xl">
            Frequently asked questions
          </h2>
          <div className="mt-10 mx-auto max-w-2xl">
            <PricingFaq />
          </div>
        </div>

        {/* CTA */}
        <div className="mt-20 text-center">
          <h2 className="text-2xl font-bold md:text-3xl">
            Ready to cut your fees?
          </h2>
          <p className="mt-3 text-gray-400">
            Create your account in 30 seconds. No credit card required.
          </p>
          <Link
            href="/sign-up"
            className="mt-6 inline-flex items-center gap-2 rounded-md bg-teal-500 px-8 py-3 text-sm font-medium text-white hover:bg-teal-400 transition-colors"
          >
            Start for free
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-6">
        <div className="mx-auto max-w-4xl flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to EuroPay
          </Link>
          <p className="text-xs text-gray-600">
            &copy; 2026 EuroPay. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
