import Link from "next/link"
import { PublicFooter } from "@/components/PublicFooter"

export default function ImpressumPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#0a0f1e] text-white">
      <nav className="border-b border-white/10 px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <Link href="/" className="text-xl font-bold">
            EuroPay
          </Link>
          <span className="text-white/20">/</span>
          <span className="text-sm text-gray-400">Impressum</span>
        </div>
      </nav>

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12 md:py-16">
        <h1 className="text-4xl font-bold tracking-tight">Impressum</h1>

        <section className="mt-10">
          <h2 className="text-2xl font-semibold">
            Angaben gem&auml;&szlig; &sect;5 TMG / Information pursuant to &sect;5 TMG
          </h2>
          <div className="mt-4 space-y-1 text-base leading-relaxed text-gray-300">
            <p>[TODO: Full legal name]</p>
            <p>[TODO: Street address, not a PO Box]</p>
            <p>[TODO: Postal code and city], Germany</p>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-semibold">Contact</h2>
          <div className="mt-4 space-y-1 text-base leading-relaxed text-gray-300">
            <p>Email: [TODO: contact email, e.g. legal@europay.dev]</p>
            <p>Phone: [TODO: phone number — required by law]</p>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-semibold">
            VAT Identification Number (&sect;27a UStG)
          </h2>
          <p className="mt-4 text-base leading-relaxed text-gray-300">
            [TODO: USt-IdNr. e.g. DE123456789 — if registered]
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-semibold">
            Responsible for content (&sect;18 Abs. 2 MStV)
          </h2>
          <div className="mt-4 space-y-1 text-base leading-relaxed text-gray-300">
            <p>[TODO: Full name of responsible person]</p>
            <p>[TODO: Address — same as above if sole proprietor]</p>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-semibold">EU Dispute Resolution</h2>
          <div className="mt-4 space-y-3 text-base leading-relaxed text-gray-300">
            <p>
              The European Commission provides a platform for online dispute
              resolution (OS):{" "}
              <a
                href="https://ec.europa.eu/consumers/odr/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-400 underline underline-offset-2 hover:text-teal-300"
              >
                https://ec.europa.eu/consumers/odr/
              </a>
            </p>
            <p>
              We are not obligated and not willing to participate in dispute
              resolution proceedings before a consumer arbitration board.
            </p>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-semibold">Liability for Content</h2>
          <p className="mt-4 text-base leading-relaxed text-gray-300">
            As a service provider, we are responsible for our own content on
            these pages under general laws per &sect;7(1) TMG. Per &sect;&sect;8-10
            TMG, we are not obligated to monitor transmitted or stored
            third-party information or to investigate circumstances indicating
            illegal activity. Obligations to remove or block the use of
            information under general laws remain unaffected.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-semibold">Liability for Links</h2>
          <p className="mt-4 text-base leading-relaxed text-gray-300">
            Our site contains links to external third-party websites over whose
            content we have no control. We therefore cannot accept any liability
            for such external content. The respective provider or operator of the
            linked pages is always responsible for the content of the linked
            pages.
          </p>
        </section>
      </main>

      <PublicFooter />
    </div>
  )
}
