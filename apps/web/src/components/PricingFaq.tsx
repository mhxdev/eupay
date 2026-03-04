"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"

const FAQS = [
  {
    question: "How does EuroPay work with Stripe?",
    answer:
      "You connect your own Stripe account to EuroPay via a one-click OAuth flow. All payments go directly to your Stripe account \u2014 EuroPay never holds your money. Our 1.5% fee is deducted automatically from each transaction via Stripe Connect.",
  },
  {
    question: "I don\u2019t have a Stripe account yet. How do I get started?",
    answer:
      "Create a Stripe account at stripe.com \u2014 it takes about 10 minutes. You\u2019ll need your business details (company name, address, registration number), a bank account for payouts, and a photo ID for verification. Stripe typically approves accounts within 1\u20132 business days. Once approved, connecting to EuroPay is a single click from your dashboard.",
  },
  {
    question: "What is the Apple Core Technology Fee?",
    answer:
      "Apple charges a Core Technology Fee for apps using alternative payment providers under the DMA. The exact amount depends on your app\u2019s install volume and business structure \u2014 see Apple\u2019s DMA terms for the details that apply to your situation.",
  },
  {
    question: "When do I get paid?",
    answer:
      "Stripe pays out directly to your bank account on their standard schedule, typically 2 business days after a transaction. You receive the full charge amount minus Stripe\u2019s processing fee and EuroPay\u2019s 1.5%, which are both deducted automatically.",
  },
  {
    question: "What happens if Apple rejects my entitlement request?",
    answer:
      "EuroPayKit automatically falls back to StoreKit if the External Purchase Link entitlement is not available. Your users still get the purchase flow \u2014 it just goes through Apple IAP instead. No revenue lost.",
  },
  {
    question: "Is my data safe?",
    answer:
      "Fully GDPR compliant. All data is stored in EU data centers (PostgreSQL on AWS Frankfurt). We provide data export, erasure, and portability tools in the dashboard. Payment data is handled by Stripe (PCI Level 1).",
  },
]

export function PricingFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="space-y-2">
      {FAQS.map((faq, i) => {
        const isOpen = openIndex === i
        return (
          <div key={i} className="rounded-lg border border-white/10 bg-white/[0.02]">
            <button
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="flex w-full items-center justify-between px-5 py-4 text-left"
            >
              <span className="text-sm font-medium text-white pr-4">
                {faq.question}
              </span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
              />
            </button>
            {isOpen && (
              <div className="px-5 pb-4">
                <p className="text-sm leading-relaxed text-gray-400">
                  {faq.answer}
                </p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
