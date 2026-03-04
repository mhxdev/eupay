import { DocsHeader } from "./DocsHeader"
import { DocsSidebar } from "./DocsSidebar"

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white">
      <DocsHeader />
      <DocsSidebar />

      {/* Main content */}
      <main className="pt-14 md:pl-64">
        <div className="max-w-[800px] px-8 py-12 md:py-16">
          {children}
        </div>
      </main>
    </div>
  )
}
