import Link from "next/link"
import { PublicFooter } from "@/components/PublicFooter"

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#0a0f1e] text-white">
      <nav className="border-b border-white/10 px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <Link href="/" className="text-xl font-bold">
            EuroPay
          </Link>
          <span className="text-white/20">/</span>
          <span className="text-sm text-gray-400">Privacy Policy</span>
        </div>
      </nav>

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12 md:py-16">
        <h1 className="text-4xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="mt-4 text-base leading-relaxed text-gray-300">
          Effective date: [TODO: insert date before launch]
        </p>

        <p className="mt-6 text-base leading-relaxed text-gray-300">
          This Privacy Policy explains how [TODO: Full legal name],
          [TODO: Address], Germany (&quot;EuroPay&quot;, &quot;we&quot;,
          &quot;us&quot;, &quot;our&quot;) collects, uses, stores, and protects
          personal data in connection with the EuroPay platform, including the
          EuroPayKit iOS SDK, the EuroPay API, and the EuroPay dashboard
          (collectively, the &quot;Service&quot;). This policy applies to
          developers who use the Service (&quot;Developers&quot;) and to end
          customers who make purchases through EuroPay-powered checkouts
          (&quot;End Customers&quot;). We process personal data in accordance
          with the EU General Data Protection Regulation (Regulation (EU)
          2016/679, &quot;GDPR&quot;) and applicable German data protection law
          (Bundesdatenschutzgesetz, &quot;BDSG&quot;).
        </p>

        {/* Section 1 */}
        <section className="mt-10">
          <h2 className="text-2xl font-semibold">
            1. Data Controller and Contact
          </h2>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            1.1. The data controller for Developer personal data is EuroPay:
            [TODO: Full legal name], [TODO: Address], Germany. Email:
            [TODO: privacy@europay.dev].
          </p>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            1.2. For End Customer personal data, the Developer is the data
            controller. EuroPay acts as a data processor on behalf of the
            Developer under Article 28 GDPR, governed by the Data Processing
            Agreement (DPA) available in the Developer&apos;s dashboard
            settings.
          </p>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            1.3. If you have questions about data processing, contact us at
            [TODO: privacy@europay.dev].
          </p>
        </section>

        {/* Section 2 */}
        <section className="mt-10">
          <h2 className="text-2xl font-semibold">
            2. Personal Data We Collect
          </h2>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            2.1. Developer data: name, email address, company name (if
            applicable), Stripe account identifier, Apple API credentials (Key
            ID, Issuer ID, Private Key, Bundle ID), IP address, and usage data
            (dashboard access logs, API call logs).
          </p>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            2.2. End Customer data (processed on behalf of Developers): email
            address, transaction records (product purchased, amount, currency,
            date, payment status), Stripe checkout session identifiers, Stripe
            payment intent identifiers, withdrawal waiver confirmation,
            IP-based region detection result (EU/non-EU), and Apple external
            purchase token (where applicable).
          </p>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            2.3. Technical data collected automatically: IP address, browser
            type and version, device information, pages visited, and
            timestamps. This data is collected via server logs and is not linked
            to user profiles.
          </p>
        </section>

        {/* Section 3 */}
        <section className="mt-10">
          <h2 className="text-2xl font-semibold">
            3. Purposes and Legal Basis for Processing
          </h2>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            3.1. Developer data:
          </p>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            (a) Account creation and management — Legal basis: performance of
            our contract with you (Art. 6(1)(b) GDPR).
          </p>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            (b) Providing the Service (API access, dashboard, SDK licensing) —
            Legal basis: performance of our contract with you (Art. 6(1)(b)
            GDPR).
          </p>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            (c) Communicating with you about the Service (updates, security
            alerts, billing) — Legal basis: performance of our contract with
            you (Art. 6(1)(b) GDPR) and our legitimate interest in maintaining
            the Service (Art. 6(1)(f) GDPR).
          </p>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            (d) Compliance with legal obligations (tax records, anti-fraud) —
            Legal basis: legal obligation (Art. 6(1)(c) GDPR).
          </p>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            3.2. End Customer data (processed on behalf of Developers):
          </p>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            (a) Processing transactions and managing entitlements — Legal basis:
            performance of the contract between the Developer and their End
            Customer (Art. 6(1)(b) GDPR), as instructed by the Developer.
          </p>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            (b) Sending transactional emails (purchase confirmations, withdrawal
            waiver confirmations, cancellation and refund notifications) on
            behalf of the Developer — Legal basis: legal obligation under EU
            consumer law (Art. 6(1)(c) GDPR), specifically the Consumer Rights
            Directive 2011/83/EU and German BGB &sect;&sect;312d, 356.
          </p>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            (c) Reporting transactions to Apple&apos;s External Purchase Server
            API as required under the Digital Markets Act — Legal basis: legal
            obligation (Art. 6(1)(c) GDPR).
          </p>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            (d) IP-based region detection to determine EU residency — Legal
            basis: legitimate interest in regulatory compliance (Art. 6(1)(f)
            GDPR). This processing is limited to determining whether the user
            is in an EU member state and does not involve profiling or automated
            decision-making that produces legal effects.
          </p>
        </section>

        {/* Section 4 */}
        <section className="mt-10">
          <h2 className="text-2xl font-semibold">
            4. Data Sharing and Sub-Processors
          </h2>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            4.1. We share personal data with the following categories of
            recipients, solely for the purposes described above:
          </p>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            (a) Stripe Technology Europe, Limited (Ireland) — Payment
            processing. Stripe acts as an independent data controller for
            payment data under its own privacy policy. Stripe is authorised as
            an electronic money institution by the Central Bank of Ireland
            (ref. C187865).
          </p>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            (b) Clerk, Inc. (United States) — Authentication and identity
            management for Developer accounts. Data transferred under the EU-US
            Data Privacy Framework.
          </p>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            (c) Supabase, Inc. (United States) — Database hosting. All EuroPay
            data is stored in Supabase-managed PostgreSQL databases. Data
            transferred under Standard Contractual Clauses (SCCs).
          </p>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            (d) Resend, Inc. (United States) — Transactional email delivery for
            both Developer and End Customer communications. Data transferred
            under Standard Contractual Clauses (SCCs).
          </p>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            (e) Vercel, Inc. (United States) — Application hosting and edge
            network. Data transferred under Standard Contractual Clauses
            (SCCs).
          </p>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            (f) Apple Inc. (United States) — Transaction reporting to
            Apple&apos;s External Purchase Server API as required by the Digital
            Markets Act. Limited to transaction identifiers and purchase tokens.
            Data transferred under Apple&apos;s standard data processing terms.
          </p>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            4.2. We do not sell personal data. We do not share personal data
            with third parties for advertising or marketing purposes.
          </p>
        </section>

        {/* Section 5 */}
        <section className="mt-10">
          <h2 className="text-2xl font-semibold">
            5. International Data Transfers
          </h2>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            5.1. Some of our sub-processors are located in the United States. We
            ensure an adequate level of data protection for international
            transfers through: (a) the EU-US Data Privacy Framework (where the
            recipient is certified); (b) Standard Contractual Clauses adopted
            by the European Commission (Decision 2021/914); (c) other
            appropriate safeguards under Article 46 GDPR.
          </p>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            5.2. You may request a copy of the applicable transfer safeguards by
            contacting [TODO: privacy@europay.dev].
          </p>
        </section>

        {/* Section 6 */}
        <section className="mt-10">
          <h2 className="text-2xl font-semibold">6. Data Retention</h2>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            6.1. Developer account data: retained for the duration of the
            account and 30 days after account deletion to allow for reactivation
            or data export requests.
          </p>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            6.2. Transaction records: retained for 10 years after the
            transaction date, as required by German commercial law (&sect;257
            Handelsgesetzbuch, &sect;147 Abgabenordnung). This retention period
            applies regardless of account deletion.
          </p>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            6.3. End Customer email addresses: retained for as long as the
            transaction records they relate to are retained, solely for the
            purpose of fulfilling legal obligations (e.g., responding to refund
            requests, regulatory inquiries).
          </p>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            6.4. Server logs and technical data: retained for 90 days, then
            automatically deleted.
          </p>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            6.5. Apple API credentials (Developer data): deleted immediately
            upon account termination or when the Developer removes them from the
            dashboard.
          </p>
        </section>

        {/* Section 7 */}
        <section className="mt-10">
          <h2 className="text-2xl font-semibold">
            7. Your Rights Under GDPR
          </h2>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            7.1. If you are a Developer (data subject where EuroPay is the
            controller), you have the following rights:
          </p>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            (a) Right of access (Art. 15 GDPR) — You may request a copy of the
            personal data we hold about you.
          </p>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            (b) Right to rectification (Art. 16 GDPR) — You may request
            correction of inaccurate or incomplete personal data.
          </p>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            (c) Right to erasure (Art. 17 GDPR) — You may request deletion of
            your personal data, subject to our legal retention obligations.
          </p>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            (d) Right to restriction of processing (Art. 18 GDPR) — You may
            request that we restrict processing of your personal data in
            certain circumstances.
          </p>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            (e) Right to data portability (Art. 20 GDPR) — You may request your
            data in a structured, commonly used, machine-readable format
            (JSON). This is available via the GDPR export endpoint in the
            dashboard or by contacting us.
          </p>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            (f) Right to object (Art. 21 GDPR) — You may object to processing
            based on legitimate interests. We will cease processing unless we
            demonstrate compelling legitimate grounds.
          </p>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            7.2. If you are an End Customer, your Developer is the data
            controller. Please contact the Developer (the app or service
            through which you made your purchase) to exercise your data subject
            rights. If you are unable to reach the Developer, you may contact
            us at [TODO: privacy@europay.dev] and we will forward your request.
          </p>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            7.3. To exercise your rights, contact us at
            [TODO: privacy@europay.dev]. We will respond within 30 days. We may
            request proof of identity before fulfilling your request.
          </p>
        </section>

        {/* Section 8 */}
        <section className="mt-10">
          <h2 className="text-2xl font-semibold">8. Data Security</h2>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            8.1. We implement appropriate technical and organisational measures
            to protect personal data against unauthorised access, alteration,
            disclosure, or destruction. These measures include: encryption of
            data in transit (TLS 1.2+) and at rest, access controls and
            authentication (via Clerk), regular security reviews, and
            monitoring of API access patterns.
          </p>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            8.2. Apple API credentials stored in the dashboard are encrypted at
            rest.
          </p>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            8.3. Despite our efforts, no method of transmission or storage is
            completely secure. If we become aware of a data breach that affects
            your personal data, we will notify you and the relevant supervisory
            authority in accordance with Articles 33 and 34 GDPR.
          </p>
        </section>

        {/* Section 9 */}
        <section className="mt-10">
          <h2 className="text-2xl font-semibold">9. Cookies and Tracking</h2>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            9.1. The EuroPay website and dashboard use only strictly necessary
            cookies for authentication and session management (provided by
            Clerk). We do not use analytics cookies, advertising cookies, or
            third-party tracking.
          </p>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            9.2. No consent banner is required for strictly necessary cookies
            under Article 5(3) of the ePrivacy Directive (2002/58/EC) and
            &sect;25 TDDDG (German Telecommunications Digital Services Data
            Protection Act).
          </p>
        </section>

        {/* Section 10 */}
        <section className="mt-10">
          <h2 className="text-2xl font-semibold">
            10. Automated Decision-Making
          </h2>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            10.1. EuroPay performs IP-based region detection to determine
            whether an End Customer is located in an EU member state. This is a
            technical check used for regulatory compliance (determining whether
            the DMA alternative payment flow applies) and does not constitute
            automated decision-making or profiling that produces legal effects
            or similarly significant effects on the End Customer under Article
            22 GDPR. The End Customer can still complete their purchase
            regardless of the region detection result (via Apple IAP for non-EU
            users).
          </p>
        </section>

        {/* Section 11 */}
        <section className="mt-10">
          <h2 className="text-2xl font-semibold">
            11. Children&apos;s Data
          </h2>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            11.1. The Service is not directed at children under the age of 16.
            We do not knowingly collect personal data from children. If we
            become aware that we have collected personal data from a child under
            16, we will take steps to delete that data.
          </p>
        </section>

        {/* Section 12 */}
        <section className="mt-10">
          <h2 className="text-2xl font-semibold">12. Supervisory Authority</h2>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            12.1. If you believe that our processing of your personal data
            violates the GDPR, you have the right to lodge a complaint with a
            supervisory authority. The competent supervisory authority for
            EuroPay is:
          </p>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            Berliner Beauftragte f&uuml;r Datenschutz und
            Informationsfreiheit
            <br />
            Alt-Moabit 59-61
            <br />
            10555 Berlin
            <br />
            Germany
            <br />
            <Link
              href="https://www.datenschutz-berlin.de"
              className="text-teal-400 underline underline-offset-2 hover:text-teal-300"
              target="_blank"
              rel="noopener noreferrer"
            >
              https://www.datenschutz-berlin.de
            </Link>
          </p>
        </section>

        {/* Section 13 */}
        <section className="mt-10">
          <h2 className="text-2xl font-semibold">
            13. Changes to This Policy
          </h2>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            13.1. We may update this Privacy Policy from time to time. Material
            changes will be communicated to Developers via email. The updated
            policy will be posted on this page with a revised effective date.
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
