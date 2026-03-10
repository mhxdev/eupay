import { auth } from "@clerk/nextjs/server"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DmaChecklist, type DmaStepDef } from "@/components/dashboard/DmaChecklist"
import { CollapsibleSection } from "@/components/dashboard/CollapsibleSection"
import type { DmaChecklistState } from "@/lib/actions"
import { ArrowLeft, ExternalLink, CheckCircle2, Info } from "lucide-react"

function buildSteps(appId: string): DmaStepDef[] {
  return [
    {
      key: "dma_membership",
      title: "Verify your Apple Developer Program membership",
      description:
        "You need an active membership ($99/year). The Account Holder on your team must complete the agreement steps below.",
      href: "https://developer.apple.com/account",
      hrefLabel: "Check membership",
      external: true,
    },
    {
      key: "dma_addendum_agreed",
      title: "Agree to the StoreKit External Purchase Link Entitlement (EU) Addendum",
      description:
        "This is the agreement between you and Apple that allows external purchases. The Account Holder must agree \u2014 other team roles can\u2019t do this. After agreeing, Apple assigns the External Purchase Link Entitlement to your developer account.",
      href: "https://developer.apple.com/contact/request/storekit-external-purchase-link-entitlement-eu/",
      hrefLabel: "Agree to addendum",
      external: true,
    },
    {
      key: "dma_tier_chosen",
      title: "Choose Store Services Tier 1",
      description:
        "Tier 1 (5% store services fee) is recommended. It covers basic App Store distribution and trust & safety. Tier 2 (13%) adds discovery, search, reviews, and auto-updates \u2014 features you likely don\u2019t need since you\u2019re driving purchases through EuroPay. You can switch tiers once per quarter.",
      href: "https://developer.apple.com/contact/request/store-services-tiers/",
      hrefLabel: "Submit tier selection",
      external: true,
    },
    {
      key: "dma_iap_removed",
      title: "Remove In-App Purchase from EU storefronts",
      description:
        "Apple doesn\u2019t allow both IAP and external purchase links in the same app on the same EU storefront. If your app currently uses IAP, remove it from all 27 EU storefronts. Keep IAP for non-EU markets \u2014 EuroPayKit\u2019s region detection ensures EU users see EuroPay checkout and non-EU users see your standard IAP paywall.",
      href: "https://appstoreconnect.apple.com",
      hrefLabel: "App Store Connect",
      external: true,
    },
    {
      key: "dma_xcode_entitlement",
      title: "Enable the entitlement in Xcode",
      description:
        "In your Xcode project: (1) Enable the \u2018StoreKit External Purchase Link\u2019 capability in the Signing & Capabilities tab. (2) In your entitlements file, set com.apple.developer.storekit.external-purchase-link to true. (3) In your Info.plist, add SKExternalPurchaseCustomLinkRegions as an array of strings with the EU country codes where you offer external purchases (e.g., \u2018de\u2019, \u2018fr\u2019, \u2018it\u2019, \u2018es\u2019, \u2018nl\u2019 \u2014 all 27 EU countries).",
    },
    {
      key: "dma_credentials_uploaded",
      title: "Upload Apple API credentials to EuroPay",
      description:
        "EuroPay reports every external transaction to Apple automatically \u2014 this is required within 24 hours. Go to App Store Connect \u2192 Users and Access \u2192 Integrations \u2192 Generate API Key (Admin role). Download the .p8 file, then enter the Key ID, Issuer ID, and paste the private key contents in your EuroPay app settings.",
      autoDetected: true,
      href: "https://appstoreconnect.apple.com/access/integrations/api",
      hrefLabel: "App Store Connect API Keys",
      external: true,
      href2: `/dashboard/apps/${appId}`,
      href2Label: "Upload to EuroPay",
    },
    {
      key: "dma_sdk_integrated",
      title: "Integrate EuroPayKit",
      description:
        "Add EuroPayKit to your Xcode project via Swift Package Manager. The SDK handles the DMA disclosure sheet, region detection, checkout flow, and entitlement checking automatically. You don\u2019t need to write any Apple DMA compliance code \u2014 the SDK does it all.",
      href: "/docs/getting-started",
      hrefLabel: "Integration guide",
    },
    {
      key: "dma_tested",
      title: "Test the complete flow",
      description:
        "Before submitting to App Review, test the entire purchase flow in sandbox mode: (1) The disclosure sheet appears before checkout. (2) Stripe checkout opens and payment succeeds. (3) Entitlement is granted. (4) Transaction is reported to Apple (check your EuroPay dashboard). (5) Customer email is sent.",
      autoDetected: true,
    },
    {
      key: "dma_submitted",
      title: "Submit your app for review",
      description:
        "When submitting to App Review, include in your review notes: (1) The name of your payment service provider: \u2018Stripe, via EuroPay (europay.dev)\u2019. (2) That your PSP is PCI Level 1 compliant. (3) That customers can access support, manage subscriptions, and request refunds. Apple may take longer to review apps with external purchase entitlements.",
      href: "https://appstoreconnect.apple.com",
      hrefLabel: "App Store Connect",
      external: true,
    },
    {
      key: "dma_live",
      title: "Go live",
      description:
        "Once Apple approves your app, switch your EuroPay app to live mode and ensure your Stripe account is verified for live payments. Monitor the EuroPay dashboard for Apple reporting status \u2014 all transactions should show \u2018Reported\u2019 within 24 hours.",
      autoDetected: true,
    },
  ]
}

const EUROPAY_HANDLES = [
  "Apple disclosure sheet \u2014 EuroPayKit calls ExternalPurchaseCustomLink.showNotice() automatically before every purchase",
  "Region detection \u2014 EuroPayKit checks if the user is in the EU and only shows external purchase for eligible storefronts",
  "Transaction reporting \u2014 Every purchase, renewal, and refund is reported to Apple\u2019s External Purchase Server API within 24 hours",
  "Customer emails \u2014 Purchase confirmations, withdrawal waiver confirmations, cancellation notices, and refund receipts",
  "Widerrufsrecht compliance \u2014 EU withdrawal right waiver is collected at checkout in the customer\u2019s language (23 EU languages)",
  "PCI compliance \u2014 All payment processing goes through Stripe, which is PCI Level 1 certified",
  "Subscription management \u2014 Cancel, pause, resume, and billing portal \u2014 all accessible from the SDK",
  "GDPR tools \u2014 Customer data export and deletion available from the dashboard and API",
]

export default async function DmaChecklistPage({
  params,
}: {
  params: Promise<{ appId: string }>
}) {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const { appId } = await params

  const app = await prisma.app.findUnique({
    where: { id: appId },
    select: {
      id: true,
      clerkUserId: true,
      name: true,
      appleKeyId: true,
      appleIssuerId: true,
      applePrivateKey: true,
      mode: true,
      setupChecklist: true,
      transactions: {
        where: { status: "SUCCEEDED" },
        take: 1,
        select: { id: true },
      },
    },
  })
  if (!app || app.clerkUserId !== userId) notFound()

  const manual = (app.setupChecklist as DmaChecklistState) ?? {}

  // Auto-detected overrides
  const hasAppleCredentials = !!(app.appleKeyId && app.appleIssuerId && app.applePrivateKey)
  const hasTestTransaction = app.transactions.length > 0
  const isLive = app.mode === "live"

  const state: Record<string, boolean> = {
    ...manual,
    dma_credentials_uploaded: hasAppleCredentials || (manual.dma_credentials_uploaded ?? false),
    dma_tested: hasTestTransaction || (manual.dma_tested ?? false),
    dma_live: isLive || (manual.dma_live ?? false),
  }

  const steps = buildSteps(appId)
  const completedCount = steps.filter((s) => state[s.key]).length
  const totalSteps = steps.length
  const progressPercent = Math.round((completedCount / totalSteps) * 100)
  const progressColor =
    completedCount === totalSteps
      ? "bg-teal-500"
      : completedCount >= 5
        ? "bg-amber-500"
        : "bg-muted-foreground"

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/dashboard/apps/${appId}`}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Apple DMA Compliance</h1>
          <p className="text-muted-foreground">
            Everything you need to legally offer external purchases to EU users through EuroPay
          </p>
        </div>
      </div>

      {/* Callout */}
      <div className="rounded-md border border-teal-500/30 bg-teal-500/5 px-4 py-3">
        <p className="text-sm text-teal-300">
          This guide summarizes Apple&apos;s requirements as of March 2026. Apple&apos;s terms change
          frequently &mdash; always read the official documentation yourself before going live.
        </p>
        <a
          href="https://developer.apple.com/support/communication-and-promotion-of-offers-on-the-app-store-in-the-eu/"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-teal-400 hover:text-teal-300"
        >
          Read Apple&apos;s full page <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">
              Setup Progress: {completedCount} of {totalSteps} complete
            </p>
            {completedCount === totalSteps && (
              <Badge className="bg-teal-500/10 text-teal-400 border-teal-500/20">Complete</Badge>
            )}
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full ${progressColor} transition-all`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Section 1: Guide */}
      <CollapsibleSection title="How External Purchases Work Under the DMA" defaultOpen={false}>
        <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <div>
            <p className="font-medium text-foreground mb-1">What the DMA changed</p>
            <p>
              The EU Digital Markets Act requires Apple to let developers link users to external
              payment methods instead of Apple&apos;s In-App Purchase system. This is what EuroPay
              enables &mdash; your app directs EU users to a Stripe-powered checkout instead of
              Apple IAP.
            </p>
          </div>
          <div>
            <p className="font-medium text-foreground mb-1">The trade-off</p>
            <p>
              Apple still charges fees on external purchases, and you lose some App Store features
              like Family Sharing, Ask to Buy, and App Store subscription management for those
              users. You&apos;re also responsible for handling refunds, customer support, and billing
              issues &mdash; though EuroPay provides the infrastructure for all of this.
            </p>
          </div>
          <div>
            <p className="font-medium text-foreground mb-1">You can&apos;t offer both</p>
            <p>
              Apple does not allow In-App Purchase and external purchase links in the same app on the
              same EU storefront. If you use EuroPay for EU users, you must remove IAP from the EU
              storefronts. Non-EU users can still use Apple IAP &mdash; EuroPayKit&apos;s region
              detection handles this automatically.
            </p>
          </div>
          <div>
            <p className="font-medium text-foreground mb-1">What your users see</p>
            <p>
              Apple adds an &ldquo;External Purchases&rdquo; banner to your App Store listing and
              shows a system disclosure sheet before each purchase. The sheet tells users they&apos;re
              transacting with you, not Apple. Users can choose to skip this disclosure for future
              purchases.
            </p>
          </div>
          <div>
            <p className="font-medium text-foreground mb-1">Which agreement to choose</p>
            <p>
              Apple offers two agreements. For EuroPay developers, we recommend the{" "}
              <strong className="text-foreground">
                StoreKit External Purchase Link Entitlement (EU) Addendum
              </strong>
              . It&apos;s designed specifically for apps that link to external payment &mdash; which is
              exactly what EuroPay does. The alternative (Alternative Terms Addendum for Apps in the
              EU) is broader and includes provisions for alternative app marketplaces and distribution
              &mdash; complexity you don&apos;t need.
            </p>
          </div>
        </div>
      </CollapsibleSection>

      {/* Section 2: Fees */}
      <CollapsibleSection title="What You&apos;ll Pay Apple" defaultOpen={false}>
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Even with external purchases, Apple charges fees. Here&apos;s the breakdown for the
            recommended path (StoreKit External Purchase Link Addendum, Tier 1).
          </p>

          {/* Fee table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-2 pr-4 text-left font-medium">Fee</th>
                  <th className="py-2 px-4 text-right font-medium">Standard</th>
                  <th className="py-2 px-4 text-right font-medium">Small Business*</th>
                  <th className="py-2 pl-4 text-left font-medium">What It Is</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 font-medium text-foreground">Core Technology Commission</td>
                  <td className="py-2 px-4 text-right font-mono">5%</td>
                  <td className="py-2 px-4 text-right font-mono">5%</td>
                  <td className="py-2 pl-4">Apple&apos;s fee for using iOS platform, tools, and technologies</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 font-medium text-foreground">Store Services Fee (Tier 1)</td>
                  <td className="py-2 px-4 text-right font-mono">5%</td>
                  <td className="py-2 px-4 text-right font-mono">5%</td>
                  <td className="py-2 pl-4">App Store distribution, trust & safety, and basic app management</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-medium text-foreground">Initial Acquisition Fee</td>
                  <td className="py-2 px-4 text-right font-mono">2%</td>
                  <td className="py-2 px-4 text-right font-mono">0%</td>
                  <td className="py-2 pl-4">Charged when a user purchases within 6 months of first installing your app</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">
            *Small Business Program: developers earning under $1M/year. Auto-renewing subscriptions
            also get reduced rates after the first year.
          </p>

          {/* Fee comparison */}
          <div>
            <p className="text-sm font-medium mb-3">
              What does this actually cost on a &euro;9.99 sale?
            </p>
            <div className="grid gap-4 md:grid-cols-3">
              {/* EuroPay column */}
              <Card className="border-teal-500/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-teal-400">
                    With EuroPay (Small Business, Tier 1)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-xs font-mono text-muted-foreground">
                  <div className="flex justify-between"><span>Apple CTC (5%)</span><span>&euro;0.50</span></div>
                  <div className="flex justify-between"><span>Apple Store Svc (5%)</span><span>&euro;0.50</span></div>
                  <div className="flex justify-between"><span>Apple Init. Acq. (0%)</span><span>&euro;0.00</span></div>
                  <div className="flex justify-between"><span>EuroPay (1.5%)</span><span>&euro;0.15</span></div>
                  <div className="flex justify-between"><span>Stripe (~1.5% + &euro;0.25)</span><span>&euro;0.40</span></div>
                  <div className="my-1 border-t border-border" />
                  <div className="flex justify-between font-medium text-foreground"><span>Total fees</span><span>&euro;1.55</span></div>
                  <div className="flex justify-between font-medium text-teal-400"><span>You keep</span><span>&euro;8.44 (84.5%)</span></div>
                </CardContent>
              </Card>

              {/* Apple IAP Small Business */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Apple IAP (Small Business, 15%)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-xs font-mono text-muted-foreground">
                  <div className="flex justify-between"><span>Apple commission</span><span>&euro;1.50</span></div>
                  <div className="my-1 border-t border-border" />
                  <div className="flex justify-between font-medium text-foreground"><span>Total fees</span><span>&euro;1.50</span></div>
                  <div className="flex justify-between font-medium"><span>You keep</span><span>&euro;8.49 (85.0%)</span></div>
                </CardContent>
              </Card>

              {/* Apple IAP Standard */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Apple IAP (Standard, 30%)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-xs font-mono text-muted-foreground">
                  <div className="flex justify-between"><span>Apple commission</span><span>&euro;3.00</span></div>
                  <div className="my-1 border-t border-border" />
                  <div className="flex justify-between font-medium text-foreground"><span>Total fees</span><span>&euro;3.00</span></div>
                  <div className="flex justify-between font-medium"><span>You keep</span><span>&euro;6.99 (70.0%)</span></div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Notes */}
          <div className="rounded-md border border-amber-500/30 bg-amber-500/5 px-4 py-3">
            <p className="text-xs text-amber-500">
              For Small Business Program developers (under $1M revenue), the savings from EuroPay vs
              Apple IAP are small at the 15% IAP rate. The real savings come when you&apos;re on the
              standard 30% IAP rate, or when Apple increases fees. EuroPay also gives you ownership
              of the customer relationship, payment data, and flexibility in pricing that Apple IAP
              doesn&apos;t.
            </p>
          </div>

          <div className="rounded-md border border-border bg-muted/30 px-4 py-3">
            <p className="text-xs text-muted-foreground">
              Store Services Tier 2 increases the store services fee to 13% (10% for Small Business).
              Tier 2 includes App Store discovery, reviews, search suggestions, and auto-updates. Most
              EuroPay developers should use Tier 1 &mdash; you&apos;re driving purchases through your
              own payment flow, not through App Store discovery. You can switch tiers once per quarter.
            </p>
          </div>
        </div>
      </CollapsibleSection>

      {/* Section 3: Checklist */}
      <CollapsibleSection title="Setup Guide" defaultOpen>
        <p className="text-sm text-muted-foreground mb-4">
          Follow these steps in order. Check off each one as you complete it.
        </p>
        <DmaChecklist appId={appId} steps={steps} state={state} />
      </CollapsibleSection>

      {/* Section 4: What EuroPay handles */}
      <CollapsibleSection title="What EuroPay Does Automatically" defaultOpen={false}>
        <p className="text-sm text-muted-foreground mb-4">
          You don&apos;t need to build any of this yourself.
        </p>
        <ul className="space-y-2.5">
          {EUROPAY_HANDLES.map((item) => (
            <li key={item} className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-teal-500 mt-0.5" />
              <span className="text-sm text-muted-foreground">{item}</span>
            </li>
          ))}
        </ul>
      </CollapsibleSection>

      {/* Disclaimer */}
      <div className="flex items-start gap-2 text-xs text-muted-foreground px-1">
        <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
        <p>
          This is a technical guide, not legal advice. Consult your legal team for compliance
          questions specific to your business.
        </p>
      </div>
    </div>
  )
}
