"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { EndpointCard, type EndpointDef } from "./EndpointCard"
import { Search } from "lucide-react"

const ENDPOINTS: EndpointDef[] = [
  {
    id: "list-products",
    method: "GET",
    path: "/api/v1/products/{appId}",
    description: "List products for an app",
    category: "Products",
    params: [
      {
        name: "appId",
        type: "string",
        required: true,
        description: "App ID",
        location: "path",
      },
    ],
    exampleBody: null,
    exampleResponse: {
      products: [
        {
          id: "prod_abc123",
          name: "Pro Monthly",
          description: "Full access subscription",
          productType: "SUBSCRIPTION",
          appStoreProductId: "com.app.pro_monthly",
          amountCents: 999,
          currency: "eur",
          interval: "month",
          intervalCount: 1,
          trialDays: 7,
        },
      ],
    },
  },
  {
    id: "create-checkout",
    method: "POST",
    path: "/api/v1/checkout/create",
    description: "Create a checkout session",
    category: "Checkout",
    params: [
      {
        name: "productId",
        type: "string",
        required: true,
        description: "Product ID to purchase",
        location: "body",
      },
      {
        name: "userId",
        type: "string",
        required: true,
        description: "Your app's user ID",
        location: "body",
      },
      {
        name: "userEmail",
        type: "string",
        required: false,
        description: "User's email address",
        location: "body",
      },
      {
        name: "successUrl",
        type: "string",
        required: true,
        description: "Redirect URL on success",
        location: "body",
      },
      {
        name: "cancelUrl",
        type: "string",
        required: true,
        description: "Redirect URL on cancel",
        location: "body",
      },
      {
        name: "locale",
        type: "string",
        required: false,
        description: "2-char locale (default: de)",
        location: "body",
      },
    ],
    exampleBody: {
      productId: "prod_abc123",
      userId: "user_12345",
      userEmail: "user@example.com",
      successUrl: "https://yourapp.com/success",
      cancelUrl: "https://yourapp.com/cancel",
    },
    exampleResponse: {
      sessionId: "cs_abc123",
      checkoutUrl: "https://checkout.stripe.com/c/pay/cs_abc123",
      expiresAt: "2026-03-01T12:00:00.000Z",
    },
  },
  {
    id: "get-entitlements",
    method: "GET",
    path: "/api/v1/entitlements/{userId}",
    description: "Get user entitlements",
    category: "Entitlements",
    params: [
      {
        name: "userId",
        type: "string",
        required: true,
        description: "Your app's user ID",
        location: "path",
      },
      {
        name: "includeExpired",
        type: "string",
        required: false,
        description: "Include expired (true/false)",
        location: "query",
      },
    ],
    exampleBody: null,
    exampleResponse: {
      userId: "user_12345",
      entitlements: [
        {
          id: "ent_abc123",
          productId: "prod_abc123",
          appStoreProductId: "com.app.pro_monthly",
          status: "ACTIVE",
          currentPeriodEnd: "2026-04-01T00:00:00.000Z",
          cancelAtPeriodEnd: false,
        },
      ],
    },
  },
  {
    id: "cancel-subscription",
    method: "POST",
    path: "/api/v1/subscriptions/cancel",
    description: "Cancel a subscription",
    category: "Subscriptions",
    params: [
      {
        name: "userId",
        type: "string",
        required: true,
        description: "Your app's user ID",
        location: "body",
      },
      {
        name: "entitlementId",
        type: "string",
        required: true,
        description: "Entitlement ID to cancel",
        location: "body",
      },
      {
        name: "acceptSaveOffer",
        type: "boolean",
        required: false,
        description: "Accept 20% off save offer",
        location: "body",
      },
    ],
    exampleBody: {
      userId: "user_12345",
      entitlementId: "ent_abc123",
      acceptSaveOffer: false,
    },
    exampleResponse: {
      success: true,
      cancelAtPeriodEnd: true,
    },
  },
  {
    id: "pause-subscription",
    method: "POST",
    path: "/api/v1/subscriptions/pause",
    description: "Pause a subscription",
    category: "Subscriptions",
    params: [
      {
        name: "userId",
        type: "string",
        required: true,
        description: "Your app's user ID",
        location: "body",
      },
      {
        name: "entitlementId",
        type: "string",
        required: true,
        description: "Entitlement ID to pause",
        location: "body",
      },
    ],
    exampleBody: {
      userId: "user_12345",
      entitlementId: "ent_abc123",
    },
    exampleResponse: {
      success: true,
      status: "PAUSED",
    },
  },
  {
    id: "resume-subscription",
    method: "POST",
    path: "/api/v1/subscriptions/resume",
    description: "Resume a subscription",
    category: "Subscriptions",
    params: [
      {
        name: "userId",
        type: "string",
        required: true,
        description: "Your app's user ID",
        location: "body",
      },
      {
        name: "entitlementId",
        type: "string",
        required: true,
        description: "Entitlement ID to resume",
        location: "body",
      },
    ],
    exampleBody: {
      userId: "user_12345",
      entitlementId: "ent_abc123",
    },
    exampleResponse: {
      success: true,
      status: "ACTIVE",
    },
  },
  {
    id: "gdpr-export",
    method: "GET",
    path: "/api/v1/gdpr/export",
    description: "Export customer data (GDPR)",
    category: "GDPR",
    params: [
      {
        name: "userId",
        type: "string",
        required: true,
        description: "Your app's user ID",
        location: "query",
      },
    ],
    exampleBody: null,
    exampleResponse: {
      customer: {
        externalUserId: "user_12345",
        email: "user@example.com",
        name: "Max Mustermann",
        countryCode: "DE",
        gdprConsentAt: "2026-01-15T10:00:00.000Z",
        createdAt: "2026-01-15T10:00:00.000Z",
      },
      entitlements: [
        {
          productName: "Pro Monthly",
          status: "ACTIVE",
          source: "WEB_CHECKOUT",
          currentPeriodEnd: "2026-04-01T00:00:00.000Z",
          cancelAtPeriodEnd: false,
          createdAt: "2026-01-15T10:00:00.000Z",
        },
      ],
      transactions: [
        {
          amountTotal: 999,
          amountSubtotal: 840,
          amountTax: 159,
          vatRate: 0.19,
          vatCountry: "DE",
          currency: "eur",
          status: "SUCCEEDED",
          createdAt: "2026-01-15T10:00:00.000Z",
        },
      ],
    },
  },
]

const CATEGORIES = ["Products", "Checkout", "Entitlements", "Subscriptions", "GDPR"]

export function ApiExplorer({ apiKey }: { apiKey: string }) {
  const [search, setSearch] = useState("")
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered = search
    ? ENDPOINTS.filter(
        (e) =>
          e.path.toLowerCase().includes(search.toLowerCase()) ||
          e.description.toLowerCase().includes(search.toLowerCase()) ||
          e.category.toLowerCase().includes(search.toLowerCase())
      )
    : ENDPOINTS

  return (
    <div className="flex gap-6">
      {/* Sidebar */}
      <aside className="hidden lg:block w-56 shrink-0">
        <nav className="sticky top-24 space-y-4">
          {CATEGORIES.map((cat) => {
            const catEndpoints = ENDPOINTS.filter((e) => e.category === cat)
            return (
              <div key={cat}>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  {cat}
                </p>
                <ul className="space-y-0.5">
                  {catEndpoints.map((e) => (
                    <li key={e.id}>
                      <button
                        onClick={() => {
                          setExpandedId(e.id)
                          document
                            .getElementById(e.id)
                            ?.scrollIntoView({ behavior: "smooth", block: "start" })
                        }}
                        className={`w-full text-left text-sm px-2 py-1 rounded hover:bg-muted transition-colors ${
                          expandedId === e.id
                            ? "bg-muted font-medium"
                            : "text-muted-foreground"
                        }`}
                      >
                        <span className="font-mono text-[10px] mr-1.5 opacity-60">
                          {e.method}
                        </span>
                        {e.description}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter endpoints..."
            className="pl-9"
          />
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No endpoints match your search.
          </p>
        ) : (
          filtered.map((endpoint) => (
            <EndpointCard
              key={endpoint.id}
              endpoint={endpoint}
              apiKey={apiKey}
              expanded={expandedId === endpoint.id}
              onToggle={() =>
                setExpandedId(expandedId === endpoint.id ? null : endpoint.id)
              }
            />
          ))
        )}
      </div>
    </div>
  )
}
