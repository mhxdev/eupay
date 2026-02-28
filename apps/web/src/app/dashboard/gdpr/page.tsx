import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { GdprCustomerSearch } from "@/components/dashboard/GdprCustomerSearch"
import { ShieldCheck } from "lucide-react"

export default function GdprPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">GDPR Tools</h1>
        <p className="text-muted-foreground">
          Export and delete customer data in compliance with EU data protection regulations.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-primary mt-0.5" />
          <div className="space-y-1">
            <CardTitle className="text-base">GDPR Compliance</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            <strong>Art. 15 — Right of Access:</strong> Use the Export button to download
            all data held for a customer as a JSON file.
          </p>
          <Separator />
          <p>
            <strong>Art. 17 — Right to Erasure:</strong> Use the Delete button to
            anonymise a customer&apos;s personal data. Email, name, and Stripe references
            are removed.
          </p>
          <Separator />
          <p>
            <strong>Art. 20 — Data Portability:</strong> The exported JSON is
            machine-readable and includes all customer, entitlement, and transaction
            records.
          </p>
          <Separator />
          <p>
            <strong>GoBD Retention:</strong> Financial transaction records are retained
            for 10-year tax compliance even after personal data deletion.
          </p>
        </CardContent>
      </Card>

      <GdprCustomerSearch />
    </div>
  )
}
