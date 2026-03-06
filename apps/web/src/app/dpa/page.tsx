import Link from "next/link"
import { PublicFooter } from "@/components/PublicFooter"

export default function DpaPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#0a0f1e] text-white">
      <nav className="border-b border-white/10 px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <Link href="/" className="text-xl font-bold">
            EuroPay
          </Link>
          <span className="text-white/20">/</span>
          <span className="text-sm text-gray-400">
            Data Processing Agreement
          </span>
        </div>
      </nav>

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12 md:py-16">
        <h1 className="text-4xl font-bold tracking-tight">
          Data Processing Agreement
        </h1>
        <p className="mt-2 text-lg text-gray-400">
          Pursuant to Article 28 of the EU General Data Protection Regulation
          (GDPR)
        </p>
        <p className="mt-4 text-base leading-relaxed text-gray-300">
          Effective date: [TODO: insert date before launch]
        </p>

        <p className="mt-6 text-base leading-relaxed text-gray-300">
          This Data Processing Agreement (&quot;DPA&quot;) forms part of the{" "}
          <Link
            href="/terms"
            className="text-teal-400 underline underline-offset-2 hover:text-teal-300"
          >
            Terms of Service
          </Link>{" "}
          between [TODO: Full legal name], [TODO: Address], Germany
          (&quot;Processor&quot;, &quot;EuroPay&quot;) and the Developer who has
          accepted the Terms of Service (&quot;Controller&quot;,
          &quot;you&quot;). This DPA governs the processing of personal data by
          EuroPay on behalf of the Developer in connection with the EuroPay
          platform. Terms not defined in this DPA have the meanings given in the
          Terms of Service.
        </p>

        {/* Section 1 */}
        <section className="mt-10">
          <h2 className="text-2xl font-semibold">1. Scope and Purpose</h2>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            1.1. The Controller uses the EuroPay platform to facilitate in-app
            purchases from End Customers in EU member states. In the course of
            providing this Service, the Processor processes personal data of the
            Controller&apos;s End Customers on behalf of the Controller.
          </p>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            1.2. This DPA applies to all processing of End Customer personal
            data by the Processor in connection with the Service. It does not
            apply to Developer personal data, for which EuroPay is an
            independent data controller as described in the{" "}
            <Link
              href="/privacy"
              className="text-teal-400 underline underline-offset-2 hover:text-teal-300"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </section>

        {/* Section 2 */}
        <section className="mt-10">
          <h2 className="text-2xl font-semibold">2. Details of Processing</h2>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            2.1. Subject matter: Processing of End Customer personal data in
            connection with payment processing, entitlement management,
            transactional email delivery, and regulatory reporting.
          </p>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            2.2. Duration: For the duration of the Terms of Service, plus any
            applicable retention period specified in Section 9.
          </p>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            2.3. Nature and purpose of processing: Collection, storage,
            retrieval, transmission, and deletion of End Customer personal data
            for the purpose of: (a) creating and managing Stripe checkout
            sessions; (b) recording and managing transaction records; (c)
            granting and revoking entitlements; (d) sending transactional emails
            on behalf of the Controller; (e) reporting transactions to
            Apple&apos;s External Purchase Server API; (f) facilitating GDPR
            data subject requests.
          </p>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            2.4. Categories of data subjects: End Customers of the
            Controller&apos;s iOS applications who make purchases through
            EuroPay-powered checkouts.
          </p>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            2.5. Types of personal data processed: email address, transaction
            records (product, amount, currency, date, status), Stripe checkout
            session and payment intent identifiers, withdrawal waiver
            confirmation, IP-based region detection result, and Apple external
            purchase token.
          </p>
        </section>

        {/* Section 3 */}
        <section className="mt-10">
          <h2 className="text-2xl font-semibold">
            3. Obligations of the Processor
          </h2>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            3.1. The Processor shall process personal data only on documented
            instructions from the Controller, including with regard to
            transfers of personal data to a third country, unless required to
            do so by EU or Member State law to which the Processor is subject
            — in such a case, the Processor shall inform the Controller of
            that legal requirement before processing, unless that law prohibits
            such information on important grounds of public interest.
          </p>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            3.2. The Processor shall ensure that persons authorised to process
            the personal data have committed themselves to confidentiality or
            are under an appropriate statutory obligation of confidentiality.
          </p>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            3.3. The Processor shall implement appropriate technical and
            organisational measures to ensure a level of security appropriate to
            the risk, as required by Article 32 GDPR, including: (a) encryption
            of personal data in transit (TLS 1.2+) and at rest; (b) access
            controls and role-based authentication; (c) regular testing and
            evaluation of security measures; (d) the ability to restore the
            availability and access to personal data in a timely manner in the
            event of a physical or technical incident.
          </p>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            3.4. The Processor shall assist the Controller in fulfilling the
            Controller&apos;s obligations to respond to data subject requests
            under Articles 15–22 GDPR. The Processor provides GDPR endpoints
            (data export and data deletion) accessible via the API and the
            dashboard.
          </p>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            3.5. The Processor shall assist the Controller in ensuring
            compliance with the obligations pursuant to Articles 32–36 GDPR
            (security, breach notification, data protection impact assessments,
            prior consultation), taking into account the nature of processing
            and the information available to the Processor.
          </p>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            3.6. At the choice of the Controller, the Processor shall delete or
            return all personal data to the Controller after the end of the
            provision of services relating to processing, and shall delete
            existing copies unless EU or Member State law requires storage of
            the personal data. Transaction records are retained for 10 years as
            required by German commercial law (&sect;257 HGB, &sect;147 AO).
          </p>
        </section>

        {/* Section 4 */}
        <section className="mt-10">
          <h2 className="text-2xl font-semibold">4. Sub-Processors</h2>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            4.1. The Controller grants general authorisation for the Processor
            to engage sub-processors. The current list of sub-processors is:
          </p>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="py-3 pr-4 text-left font-medium text-gray-400">
                    Sub-Processor
                  </th>
                  <th className="py-3 pr-4 text-left font-medium text-gray-400">
                    Purpose
                  </th>
                  <th className="py-3 pr-4 text-left font-medium text-gray-400">
                    Location
                  </th>
                  <th className="py-3 text-left font-medium text-gray-400">
                    Transfer Mechanism
                  </th>
                </tr>
              </thead>
              <tbody className="text-gray-300">
                <tr className="border-b border-white/10">
                  <td className="py-3 pr-4">
                    Stripe Technology Europe, Ltd.
                  </td>
                  <td className="py-3 pr-4">Payment processing</td>
                  <td className="py-3 pr-4">Ireland (EU)</td>
                  <td className="py-3">N/A (EU)</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="py-3 pr-4">Clerk, Inc.</td>
                  <td className="py-3 pr-4">Authentication</td>
                  <td className="py-3 pr-4">United States</td>
                  <td className="py-3">EU-US Data Privacy Framework</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="py-3 pr-4">Supabase, Inc.</td>
                  <td className="py-3 pr-4">Database hosting</td>
                  <td className="py-3 pr-4">
                    United States (EU region: eu-west-1)
                  </td>
                  <td className="py-3">Standard Contractual Clauses</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="py-3 pr-4">Resend, Inc.</td>
                  <td className="py-3 pr-4">Email delivery</td>
                  <td className="py-3 pr-4">United States</td>
                  <td className="py-3">Standard Contractual Clauses</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="py-3 pr-4">Vercel, Inc.</td>
                  <td className="py-3 pr-4">Application hosting</td>
                  <td className="py-3 pr-4">
                    United States (edge: EU)
                  </td>
                  <td className="py-3">Standard Contractual Clauses</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="py-3 pr-4">Apple Inc.</td>
                  <td className="py-3 pr-4">
                    Transaction reporting (DMA)
                  </td>
                  <td className="py-3 pr-4">United States</td>
                  <td className="py-3">Apple Data Processing Terms</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            4.2. The Processor shall inform the Controller of any intended
            changes concerning the addition or replacement of sub-processors,
            giving the Controller the opportunity to object to such changes. The
            Processor shall notify the Controller via email at least 14 days
            before engaging a new sub-processor.
          </p>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            4.3. If the Controller objects to a new sub-processor within 14 days
            of notification, the parties shall discuss the Controller&apos;s
            concerns in good faith. If the parties cannot resolve the objection,
            the Controller may terminate the Terms of Service.
          </p>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            4.4. The Processor shall impose the same data protection obligations
            as set out in this DPA on any sub-processor by way of a contract,
            ensuring that processing by the sub-processor complies with GDPR
            requirements.
          </p>
        </section>

        {/* Section 5 */}
        <section className="mt-10">
          <h2 className="text-2xl font-semibold">
            5. Data Breach Notification
          </h2>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            5.1. The Processor shall notify the Controller without undue delay
            after becoming aware of a personal data breach affecting the
            Controller&apos;s End Customer data. The notification shall: (a)
            describe the nature of the breach including, where possible, the
            categories and approximate number of data subjects and personal data
            records concerned; (b) communicate the name and contact details of
            the Processor&apos;s contact point; (c) describe the likely
            consequences of the breach; (d) describe the measures taken or
            proposed to address the breach.
          </p>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            5.2. The Processor shall provide the notification to the Controller
            via email to the address associated with the Controller&apos;s
            account. The Processor shall make reasonable efforts to provide the
            initial notification within 48 hours of becoming aware of the
            breach.
          </p>
        </section>

        {/* Section 6 */}
        <section className="mt-10">
          <h2 className="text-2xl font-semibold">
            6. Audits and Inspections
          </h2>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            6.1. The Processor shall make available to the Controller all
            information necessary to demonstrate compliance with the obligations
            laid down in Article 28 GDPR and this DPA.
          </p>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            6.2. The Processor shall allow for and contribute to audits,
            including inspections, conducted by the Controller or another
            auditor mandated by the Controller. Such audits shall be conducted
            with reasonable notice (at least 30 days), during normal business
            hours, and in a manner that does not unreasonably disrupt the
            Processor&apos;s operations.
          </p>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            6.3. The Controller shall bear its own costs in connection with any
            audit. The Processor may charge reasonable fees for time spent
            assisting with audits that exceed 8 hours per calendar year.
          </p>
        </section>

        {/* Section 7 */}
        <section className="mt-10">
          <h2 className="text-2xl font-semibold">
            7. International Transfers
          </h2>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            7.1. The Processor shall not transfer personal data to a country
            outside EU/EEA unless adequate safeguards are in place as required
            by Chapter V GDPR. The transfer mechanisms used are specified in the
            sub-processor table in Section 4.1.
          </p>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            7.2. Where Standard Contractual Clauses (SCCs) are used, the
            parties agree that the SCCs adopted by the European Commission
            (Implementing Decision (EU) 2021/914) are incorporated by reference
            into this DPA for the relevant transfers.
          </p>
        </section>

        {/* Section 8 */}
        <section className="mt-10">
          <h2 className="text-2xl font-semibold">8. Instructions</h2>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            8.1. The Controller&apos;s instructions to the Processor are
            defined by the Terms of Service, this DPA, and the Controller&apos;s
            use and configuration of the Service (including settings in the
            dashboard). The Processor shall not process End Customer personal
            data for any purpose other than as instructed by the Controller.
          </p>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            8.2. If the Processor believes that an instruction from the
            Controller infringes GDPR or other EU or Member State data
            protection provisions, the Processor shall immediately inform the
            Controller.
          </p>
        </section>

        {/* Section 9 */}
        <section className="mt-10">
          <h2 className="text-2xl font-semibold">
            9. Data Retention and Deletion
          </h2>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            9.1. Upon termination of the Terms of Service, the Processor shall:
            (a) cease processing End Customer personal data except as required
            by law; (b) provide the Controller with an export of End Customer
            data in JSON format upon request (via the GDPR export API endpoint),
            within 30 days of termination; (c) delete End Customer personal data
            within 90 days of termination, except for transaction records that
            must be retained under German commercial law.
          </p>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            9.2. Transaction records (amount, date, status, product) are
            retained for 10 years after the transaction date as required by
            &sect;257 HGB and &sect;147 AO. During this retention period,
            access to the data is restricted to compliance and legal purposes
            only.
          </p>
        </section>

        {/* Section 10 */}
        <section className="mt-10">
          <h2 className="text-2xl font-semibold">10. Liability</h2>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            10.1. Each party&apos;s liability under this DPA is subject to the
            limitations set out in Section 8 of the{" "}
            <Link
              href="/terms"
              className="text-teal-400 underline underline-offset-2 hover:text-teal-300"
            >
              Terms of Service
            </Link>
            .
          </p>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            10.2. The Processor shall be liable for damage caused by processing
            only where it has not complied with obligations under GDPR
            specifically directed to processors, or where it has acted outside
            of or contrary to the Controller&apos;s lawful instructions
            (Article 82(2) GDPR).
          </p>
        </section>

        {/* Section 11 */}
        <section className="mt-10">
          <h2 className="text-2xl font-semibold">11. Term and Termination</h2>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            11.1. This DPA shall remain in effect for the duration of the Terms
            of Service and shall automatically terminate upon termination of the
            Terms of Service, subject to the data retention obligations in
            Section 9.
          </p>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            11.2. Sections 5, 6, 9, and 10 shall survive termination of this
            DPA.
          </p>
        </section>

        {/* Section 12 */}
        <section className="mt-10">
          <h2 className="text-2xl font-semibold">12. Governing Law</h2>

          <p className="mt-4 text-base leading-relaxed text-gray-300">
            12.1. This DPA is governed by the laws of the Federal Republic of
            Germany. The exclusive place of jurisdiction is Berlin, Germany,
            unless mandatory law provides otherwise.
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
