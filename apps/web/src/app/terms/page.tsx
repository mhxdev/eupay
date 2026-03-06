import Link from "next/link"
import { PublicFooter } from "@/components/PublicFooter"

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#0a0f1e] text-white">
      <nav className="border-b border-white/10 px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <Link href="/" className="text-xl font-bold">
            EuroPay
          </Link>
          <span className="text-white/20">/</span>
          <span className="text-sm text-gray-400">Terms of Service</span>
        </div>
      </nav>

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12 md:py-16">
        <h1 className="text-4xl font-bold tracking-tight">Terms of Service</h1>
        <p className="mt-4 text-base leading-relaxed text-gray-300">
          Effective date: [TODO: insert date before launch]
        </p>

        <p className="mt-6 text-base leading-relaxed text-gray-300">
          These Terms of Service (&quot;Terms&quot;) govern your access to and use of
          the EuroPay platform, including the EuroPayKit iOS SDK, the EuroPay
          API, the EuroPay dashboard, and all related services (collectively, the
          &quot;Service&quot;), operated by [TODO: Full legal name], [TODO: Address],
          Germany (&quot;EuroPay&quot;, &quot;we&quot;, &quot;us&quot;,
          &quot;our&quot;). By creating an account or using the Service, you
          (&quot;Developer&quot;, &quot;you&quot;, &quot;your&quot;) agree to
          these Terms. If you do not agree, do not use the Service.
        </p>

        {/* Section 1 */}
        <section className="mt-10">
          <h2 className="text-2xl font-semibold">1. Service Description</h2>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            1.1. EuroPay provides a technology platform that enables iOS app
            developers to process in-app purchases from users in EU member states
            through Stripe, as permitted under the EU Digital Markets Act
            (Regulation (EU) 2022/1925). The Service consists of: (a) EuroPayKit,
            an iOS SDK for integrating alternative payment processing; (b) a
            hosted API for checkout session management, entitlement management,
            and Apple transaction reporting; (c) a web dashboard for product
            configuration, analytics, and compliance management.
          </p>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            1.2. All payment processing is performed by Stripe Technology Europe,
            Limited, an electronic money institution authorised by the Central
            Bank of Ireland (reference C187865), via Stripe Connect. EuroPay does
            not at any time receive, hold, control, or process payment funds
            belonging to Developers or their end customers. EuroPay is not a
            payment institution, electronic money institution, or payment service
            provider under Directive (EU) 2015/2366 (PSD2).
          </p>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            1.3. EuroPay acts as a technical service provider. The Developer is
            the merchant of record for all transactions with their end customers.
          </p>
        </section>

        {/* Section 2 */}
        <section className="mt-10">
          <h2 className="text-2xl font-semibold">
            2. Account and Registration
          </h2>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            2.1. To use the Service, you must create an account, provide accurate
            and complete information, and keep your account information current.
          </p>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            2.2. You are responsible for maintaining the confidentiality of your
            account credentials, API keys, and Apple credentials stored in the
            dashboard. You are responsible for all activity that occurs under your
            account.
          </p>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            2.3. You must be at least 18 years old and have the legal capacity to
            enter into these Terms. If you are acting on behalf of a company or
            other legal entity, you represent that you have the authority to bind
            that entity.
          </p>
        </section>

        {/* Section 3 */}
        <section className="mt-10">
          <h2 className="text-2xl font-semibold">3. Developer Obligations</h2>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            3.1. You must maintain a valid Stripe account in good standing and
            keep it connected to the Service via Stripe Connect.
          </p>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            3.2. You must comply with Apple&apos;s requirements for the External
            Purchase Link Entitlement (EU), including acceptance of Apple&apos;s
            StoreKit External Purchase Link Entitlement (EU) Addendum and the
            Alternative Terms Addendum for Apps in the EU. You acknowledge that
            use of the Service may trigger fees from Apple, including but not
            limited to the Core Technology Fee and the commission on alternative
            payment transactions. EuroPay is not responsible for any fees,
            obligations, or consequences arising from Apple&apos;s terms.
          </p>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            3.3. You must provide and maintain current Apple API credentials (Key
            ID, Issuer ID, Private Key, Bundle ID) in the EuroPay dashboard to
            enable automated transaction reporting to Apple as required under the
            Digital Markets Act.
          </p>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            3.4. You are responsible for customer support and dispute resolution
            with your end customers. EuroPay sends transactional emails (purchase
            confirmations, withdrawal waiver confirmations, cancellation and
            refund notifications) on your behalf. You are identified as the
            merchant in all such communications.
          </p>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            3.5. You are responsible for compliance with applicable tax laws in
            your jurisdiction and the jurisdictions of your end customers. EuroPay
            facilitates VAT calculation via Stripe Tax but does not provide tax
            advice and is not responsible for the accuracy of tax calculations or
            your tax obligations.
          </p>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            3.6. You must not use the Service for products or services that
            violate applicable law, Stripe&apos;s Restricted Businesses list, or
            Apple&apos;s App Store Review Guidelines. This includes but is not
            limited to: illegal goods or services, gambling (without appropriate
            licenses), adult content prohibited by platform policies, or products
            subject to sanctions.
          </p>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            3.7. EuroPay&apos;s checkout is designed for digital content and
            services (in-app purchases, subscriptions, premium features). If your
            app sells physical goods, the standard 14-day EU withdrawal right
            applies and cannot be waived through EuroPay&apos;s checkout. You must
            implement your own return and withdrawal process for physical goods.
          </p>
        </section>

        {/* Section 4 */}
        <section className="mt-10">
          <h2 className="text-2xl font-semibold">4. Fees and Payment</h2>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            4.1. EuroPay charges a platform fee of 1.5% per successful
            transaction, collected automatically via Stripe Connect application
            fees. The fee is deducted from the transaction amount before
            settlement to your Stripe account.
          </p>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            4.2. There are no setup fees, monthly minimums, or hidden charges
            from EuroPay. You are separately responsible for Stripe&apos;s payment
            processing fees and any fees charged by Apple under their Alternative
            Terms Addendum.
          </p>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            4.3. EuroPay may change its fee structure with at least 30 days&apos;
            prior written notice via email. Continued use of the Service after the
            notice period constitutes acceptance of the updated fees. If you do
            not agree to the new fees, you may terminate your account before the
            changes take effect.
          </p>
        </section>

        {/* Section 5 */}
        <section className="mt-10">
          <h2 className="text-2xl font-semibold">
            5. Data Processing and Privacy
          </h2>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            5.1. EuroPay processes personal data in accordance with the EU General
            Data Protection Regulation (Regulation (EU) 2016/679,
            &quot;GDPR&quot;) and our Privacy Policy available at{" "}
            <Link
              href="/privacy"
              className="text-teal-400 underline underline-offset-2 hover:text-teal-300"
            >
              europay.dev/privacy
            </Link>
            .
          </p>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            5.2. To the extent that EuroPay processes personal data of your end
            customers on your behalf, EuroPay acts as a data processor under
            Article 28 GDPR. The Data Processing Agreement (DPA), available for
            download in your dashboard settings, forms part of these Terms and
            governs such processing.
          </p>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            5.3. You are the data controller for your end customers&apos; personal
            data. You are responsible for ensuring that you have a lawful basis
            for processing your end customers&apos; data and that your own privacy
            policy accurately reflects your use of EuroPay as a sub-processor.
          </p>
        </section>

        {/* Section 6 */}
        <section className="mt-10">
          <h2 className="text-2xl font-semibold">6. Intellectual Property</h2>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            6.1. EuroPay retains all intellectual property rights in the Service,
            including the EuroPayKit SDK, the API, the dashboard, and all related
            documentation. These Terms grant you a limited, non-exclusive,
            non-transferable, revocable license to use the Service and the SDK in
            accordance with these Terms.
          </p>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            6.2. You retain all intellectual property rights in your app, content,
            and products. Nothing in these Terms transfers any of your
            intellectual property to EuroPay.
          </p>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            6.3. You must not reverse engineer, decompile, modify, or create
            derivative works of the EuroPayKit SDK except as permitted by
            applicable law.
          </p>
        </section>

        {/* Section 7 */}
        <section className="mt-10">
          <h2 className="text-2xl font-semibold">
            7. Availability and Support
          </h2>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            7.1. EuroPay strives to maintain high availability of the Service but
            does not guarantee uninterrupted or error-free operation. The Service
            depends on third-party infrastructure (Stripe, Apple, Vercel,
            Supabase) over which EuroPay has limited control.
          </p>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            7.2. Planned maintenance will be communicated in advance via the
            status page at{" "}
            <Link
              href="/status"
              className="text-teal-400 underline underline-offset-2 hover:text-teal-300"
            >
              europay.dev/status
            </Link>
            . Emergency maintenance may occur without prior notice.
          </p>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            7.3. Support is provided via email at [TODO: support@europay.dev].
            Response times are on a reasonable-efforts basis and are not
            guaranteed.
          </p>
        </section>

        {/* Section 8 */}
        <section className="mt-10">
          <h2 className="text-2xl font-semibold">
            8. Limitation of Liability
          </h2>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            8.1. To the maximum extent permitted by applicable law,
            EuroPay&apos;s total aggregate liability to you for any claims arising
            out of or related to these Terms or the Service shall not exceed the
            total fees paid by you to EuroPay in the twelve (12) months preceding
            the event giving rise to the claim.
          </p>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            8.2. EuroPay shall not be liable for any indirect, incidental,
            special, consequential, or punitive damages, including but not limited
            to loss of profits, loss of revenue, loss of data, or loss of
            business opportunity, regardless of the cause of action or the theory
            of liability.
          </p>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            8.3. EuroPay shall not be liable for: (a) downtime or errors caused
            by Stripe, Apple, or other third-party services; (b) Apple&apos;s
            revocation of your External Purchase Link Entitlement or changes to
            Apple&apos;s terms, fees, or policies; (c) inaccuracies in VAT or tax
            calculations; (d) disputes between you and your end customers; (e)
            your failure to comply with applicable laws, Apple&apos;s terms, or
            Stripe&apos;s terms.
          </p>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            8.4. The limitations in this section do not apply to liability arising
            from wilful misconduct or gross negligence (Vorsatz oder grobe
            Fahrl&auml;ssigkeit), liability for injury to life, body, or health,
            or any liability that cannot be excluded under applicable law.
          </p>
        </section>

        {/* Section 9 */}
        <section className="mt-10">
          <h2 className="text-2xl font-semibold">9. Indemnification</h2>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            9.1. You shall indemnify and hold harmless EuroPay from any claims,
            losses, damages, liabilities, and expenses (including reasonable legal
            fees) arising out of or related to: (a) your use of the Service in
            violation of these Terms; (b) your violation of applicable law; (c)
            disputes between you and your end customers; (d) your products or
            content; (e) your failure to comply with Apple&apos;s or Stripe&apos;s
            terms.
          </p>
        </section>

        {/* Section 10 */}
        <section className="mt-10">
          <h2 className="text-2xl font-semibold">10. Termination</h2>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            10.1. Either party may terminate these Terms with 30 days&apos;
            written notice via email.
          </p>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            10.2. EuroPay may suspend or terminate your account immediately and
            without notice if: (a) you materially breach these Terms; (b) your
            Stripe account is suspended or terminated; (c) we reasonably suspect
            fraudulent activity; (d) required by law or regulation.
          </p>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            10.3. Upon termination: (a) your access to the dashboard and API will
            be deactivated; (b) you must stop using the EuroPayKit SDK and remove
            it from your app; (c) active subscriptions of your end customers will
            continue to be processed until cancelled by the end customer or by you
            via the Stripe dashboard — we will not cut off paying end customers;
            (d) you may request an export of your data under GDPR Article 20
            within 30 days of termination; (e) your data will be deleted after the
            applicable legal retention period (up to 10 years for transaction
            records under German commercial law, &sect;257 HGB / &sect;147 AO).
          </p>
        </section>

        {/* Section 11 */}
        <section className="mt-10">
          <h2 className="text-2xl font-semibold">11. Changes to Terms</h2>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            11.1. EuroPay may modify these Terms at any time. Material changes
            will be communicated via email at least 30 days before taking effect.
            The updated Terms will be posted on this page with a revised effective
            date.
          </p>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            11.2. Your continued use of the Service after the effective date of
            updated Terms constitutes acceptance. If you do not agree to the
            updated Terms, you must terminate your account before they take
            effect.
          </p>
        </section>

        {/* Section 12 */}
        <section className="mt-10">
          <h2 className="text-2xl font-semibold">
            12. Governing Law and Jurisdiction
          </h2>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            12.1. These Terms are governed by the laws of the Federal Republic of
            Germany, excluding its conflict of laws provisions and excluding the
            United Nations Convention on Contracts for the International Sale of
            Goods (CISG).
          </p>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            12.2. The exclusive place of jurisdiction for all disputes arising
            from or in connection with these Terms is Berlin, Germany, unless
            mandatory law provides otherwise.
          </p>
        </section>

        {/* Section 13 */}
        <section className="mt-10">
          <h2 className="text-2xl font-semibold">13. Miscellaneous</h2>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            13.1. If any provision of these Terms is held to be invalid or
            unenforceable, the remaining provisions shall remain in full force and
            effect. The invalid provision shall be replaced by a valid provision
            that achieves the economic purpose of the invalid provision as closely
            as possible.
          </p>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            13.2. EuroPay&apos;s failure to enforce any right or provision of
            these Terms shall not constitute a waiver of such right or provision.
          </p>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            13.3. These Terms, together with the Privacy Policy and the DPA,
            constitute the entire agreement between you and EuroPay regarding the
            Service.
          </p>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            13.4. These Terms are provided in English. In the event of any
            conflict between the English version and any translation, the English
            version shall prevail.
          </p>
        </section>

        <p className="mt-12 text-sm text-gray-500">
          Last updated: [TODO: date]
        </p>
      </main>

      <PublicFooter />
    </div>
  )
}
