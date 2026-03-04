"use client"

import { useState } from "react"

const EUROPAY_RATE = 0.015
const STRIPE_RATE = 0.015
const STRIPE_FIXED = 0.25
const APPLE_CTF_RATE = 0.05
const AVG_TRANSACTION = 10

function fmt(n: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n)
}

export function RevenueCalculator() {
  const [revenue, setRevenue] = useState(5000)
  const [appleTier, setAppleTier] = useState<0.3 | 0.15>(0.3)

  const transactions = Math.round(revenue / AVG_TRANSACTION)

  // Apple IAP
  const appleFee = revenue * appleTier
  const appleKeeps = revenue - appleFee

  // EuroPay
  const europayFee = revenue * EUROPAY_RATE
  const stripeFee = revenue * STRIPE_RATE + transactions * STRIPE_FIXED
  const appleCTF = revenue * APPLE_CTF_RATE
  const europayTotal = europayFee + stripeFee + appleCTF
  const europayKeeps = revenue - europayTotal

  const savings = europayKeeps - appleKeeps
  const annualSavings = savings * 12

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 md:p-8">
      <h3 className="text-lg font-semibold text-white">Revenue Calculator</h3>
      <p className="mt-1 text-sm text-gray-400">
        See how much more you keep with EuroPay.
      </p>

      {/* Inputs */}
      <div className="mt-6 space-y-4">
        <div>
          <label className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Monthly app revenue</span>
            <span className="font-medium text-white">{fmt(revenue)}</span>
          </label>
          <input
            type="range"
            min={100}
            max={100000}
            step={100}
            value={revenue}
            onChange={(e) => setRevenue(Number(e.target.value))}
            className="mt-2 w-full accent-teal-500"
          />
          <div className="mt-1 flex justify-between text-xs text-gray-500">
            <span>{fmt(100)}</span>
            <span>{fmt(100000)}</span>
          </div>
        </div>

        <div>
          <span className="text-sm text-gray-400">Apple IAP tier</span>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              onClick={() => setAppleTier(0.3)}
              className={`rounded-md border px-3 py-2 text-sm transition-colors ${
                appleTier === 0.3
                  ? "border-white/30 bg-white/10 text-white"
                  : "border-white/10 text-gray-400 hover:border-white/20"
              }`}
            >
              Standard (30%)
            </button>
            <button
              onClick={() => setAppleTier(0.15)}
              className={`rounded-md border px-3 py-2 text-sm transition-colors ${
                appleTier === 0.15
                  ? "border-white/30 bg-white/10 text-white"
                  : "border-white/10 text-gray-400 hover:border-white/20"
              }`}
            >
              Small Business (15%)
            </button>
          </div>
        </div>
      </div>

      {/* Comparison columns */}
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {/* Apple IAP */}
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <p className="text-sm font-medium text-gray-400">Apple IAP</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li className="flex justify-between">
              <span className="text-gray-500">Apple fee ({Math.round(appleTier * 100)}%)</span>
              <span className="text-gray-300">{fmt(appleFee)}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-gray-500">Processing</span>
              <span className="text-gray-500">Included</span>
            </li>
            <li className="mt-2 flex justify-between border-t border-white/5 pt-2">
              <span className="font-medium text-gray-400">You keep</span>
              <span className="font-semibold text-white">{fmt(appleKeeps)}</span>
            </li>
          </ul>
        </div>

        {/* EuroPay */}
        <div className="rounded-lg border border-teal-500/30 bg-teal-500/5 p-4">
          <p className="text-sm font-medium text-teal-400">EuroPay</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li className="flex justify-between">
              <span className="text-gray-500">EuroPay fee (1.5%)</span>
              <span className="text-gray-300">{fmt(europayFee)}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-gray-500">Stripe (~1.5% + &euro;0.25)</span>
              <span className="text-gray-300">{fmt(stripeFee)}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-gray-500">Apple CTF (5%)</span>
              <span className="text-gray-300">{fmt(appleCTF)}</span>
            </li>
            <li className="mt-2 flex justify-between border-t border-teal-500/10 pt-2">
              <span className="font-medium text-gray-400">You keep</span>
              <span className="font-semibold text-white">{fmt(europayKeeps)}</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Savings highlight */}
      {savings > 0 && (
        <div className="mt-6 text-center">
          <p className="text-3xl font-bold text-teal-400">{fmt(savings)}</p>
          <p className="mt-1 text-sm text-gray-400">
            more per month with EuroPay
          </p>
          <p className="mt-2 text-sm text-teal-400/80">
            That&apos;s <span className="font-semibold text-teal-400">{fmt(annualSavings)}</span> more per year
          </p>
        </div>
      )}

      <p className="mt-4 text-center text-xs text-gray-600">
        Based on avg. &euro;{AVG_TRANSACTION} transaction. Stripe EU card rate 1.5% + &euro;0.25.
      </p>
    </div>
  )
}
