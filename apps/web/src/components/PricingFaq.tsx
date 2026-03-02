"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"

const FAQS = [
  {
    question: "What is the Apple Core Technology Fee?",
    answer:
      "Apple charges \u20AC0.50 per first annual install over 1M installs/year. For most apps this works out to roughly 3\u20135% of revenue. Apps under 1M annual installs pay nothing. See Apple\u2019s DMA terms for details.",
  },
  {
    question: "When do I get paid?",
    answer:
      "Stripe pays out directly to your bank account, typically 2 business days after a transaction. You receive 100% of the charge minus Stripe\u2019s processing fee \u2014 EUPay\u2019s 0.5% is deducted separately via monthly invoice.",
  },
  {
    question: "Do I need a registered business?",
    answer:
      "Yes, Stripe requires a registered business entity (sole proprietorship, GmbH, Ltd, etc.) to create a connected account. This is a Stripe requirement, not an EUPay one.",
  },
  {
    question: "What happens if Apple rejects my entitlement request?",
    answer:
      "EUPayKit automatically falls back to StoreKit if the External Purchase Link entitlement is not available. Your users still get the purchase flow \u2014 it just goes through Apple IAP instead. No revenue lost.",
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
