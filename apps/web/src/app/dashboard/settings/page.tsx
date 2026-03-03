import { auth, currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ProfileForm } from "@/components/dashboard/ProfileForm"
import { DangerZone } from "@/components/dashboard/DangerZone"
import {
  FileText,
  Bell,
  BookOpen,
  ExternalLink,
} from "lucide-react"

export default async function SettingsPage() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const user = await currentUser()
  const email = user?.emailAddresses[0]?.emailAddress ?? ""
  const name = user?.firstName ?? ""

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account, notifications, and data processing agreements.
        </p>
      </div>

      {/* 1. Profile */}
      <ProfileForm email={email} initialName={name} />

      {/* 2. Data Processing Agreement */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">Data Processing Agreement (DPA)</CardTitle>
          </div>
          <CardDescription>
            EuroPay acts as a data processor for your end-users&apos; personal data
            under GDPR Art. 28. This agreement covers how we handle payment data,
            entitlements, and customer information on your behalf.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-sm text-muted-foreground">Last updated: March 1, 2026</p>
          <Button variant="outline" size="sm" asChild>
            <Link href="/api/v1/compliance/pdf" target="_blank">
              <FileText className="mr-2 h-4 w-4" />
              Download DPA
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* 3. Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">Notifications</CardTitle>
          </div>
          <CardDescription>
            Email notification preferences — coming soon
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Checkbox id="notif-webhook" disabled defaultChecked />
            <Label htmlFor="notif-webhook" className="text-sm text-muted-foreground">
              Webhook failure alerts
            </Label>
          </div>
          <Separator />
          <div className="flex items-center gap-3">
            <Checkbox id="notif-dispute" disabled defaultChecked />
            <Label htmlFor="notif-dispute" className="text-sm text-muted-foreground">
              Dispute alerts
            </Label>
          </div>
          <Separator />
          <div className="flex items-center gap-3">
            <Checkbox id="notif-regulatory" disabled defaultChecked />
            <Label htmlFor="notif-regulatory" className="text-sm text-muted-foreground">
              Regulatory update emails
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* 4. Developer Resources */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">Developer Resources</CardTitle>
          </div>
          <CardDescription>
            Documentation, SDKs, and tools for integrating EuroPay
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ResourceLink href="/docs/api-reference" label="API Documentation" />
            <ResourceLink href="https://github.com/mhxdev/EuroPayKit" label="iOS SDK (EuroPayKit)" external />
            <ResourceLink href="https://github.com/mhxdev/EuroPayExample" label="Example App" external />
            <ResourceLink href="/status" label="Status Page" />
            <ResourceLink href="/changelog" label="Changelog" />
          </div>
        </CardContent>
      </Card>

      {/* 5. Danger Zone */}
      <DangerZone />
    </div>
  )
}

function ResourceLink({
  href,
  label,
  external = false,
}: {
  href: string
  label: string
  external?: boolean
}) {
  return (
    <Link
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm hover:bg-muted transition-colors"
    >
      {label}
      {external && <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />}
    </Link>
  )
}
