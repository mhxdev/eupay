> Also read LESSONS.md in this directory for battle-tested patterns and known pitfalls.

> **Self-maintenance rule:** When a mistake is made and corrected during a session, automatically add an entry to LESSONS.md with the three fields (what happened, correct pattern, rule). When architecture or models change, update the relevant sections in CLAUDE.md. If unsure whether something qualifies, ask: "Should I log this in LESSONS.md?"

# EuroPay — Project Memory

> **Self-maintenance rule:** When a mistake is made and corrected during a session, automatically add an entry to LESSONS.md with the three fields (what happened, correct pattern, rule). When architecture or models change, update the relevant sections in CLAUDE.md. If unsure whether something qualifies, ask: "Should I log this in LESSONS.md?"


> This file is read by Claude Code at the start of every session. It captures critical context, architectural rules, and patterns. Do not delete or rename this file.

---

## 1. Project Identity

EuroPay is a **technical payment infrastructure platform** enabling iOS developers to process EU in-app purchases via Stripe instead of Apple IAP, under the EU Digital Markets Act (Regulation (EU) 2022/1925, Article 5(7)).

- **Domain:** europay.dev (live on Vercel, currently in maintenance mode — `MAINTENANCE_MODE=true`)
- **Model:** BYOS (Bring Your Own Stripe) — developers connect their own Stripe account via Stripe Connect OAuth
- **Revenue:** 1.5% application fee per transaction via Stripe Connect `application_fee_amount` / `application_fee_percent`
- **Operator:** Solo-operated by a single founder/admin
- **Stage:** Pre-launch. Waiting on Apple External Purchase Link Entitlement approval.
- **Repos:** github.com/mhxdev/eupay (main), github.com/mhxdev/EuroPayKit (iOS SDK), github.com/mhxdev/EuroPayExample (example app)
- **Brand:** EuroPay (capital E, capital P, lowercase rest). SDK: EuroPayKit.

### What EuroPay is NOT
- NOT a Merchant of Record — money never flows through EuroPay
- NOT a payment institution — no PSD2 license. Stripe handles all regulated payment services.
- Managed/MoR plan code exists in the codebase but is **hidden from all public pages**. Do not expose or suggest it.

---

## 2. Tech Stack

| Service | Details |
|---------|---------|
| **Framework** | Next.js 16.1.6 (App Router, Turbopack), TypeScript, React 19 |
| **Styling** | Tailwind CSS 4, shadcn/ui, lucide-react icons |
| **Database** | Supabase PostgreSQL via **Session Pooler ONLY** at `aws-1-eu-west-1.pooler.supabase.com:5432` |
| **ORM** | Prisma 5.22.0 |
| **Auth** | Clerk (@clerk/nextjs) — Clerk = auth only, Supabase = data only. Never mix. |
| **Payments** | Stripe 20.4.0 via Stripe Connect (Standard accounts, OAuth flow) |
| **Email** | Resend + React Email templates |
| **Hosting** | Vercel |
| **Rate Limiting** | Upstash Redis (@upstash/ratelimit, sliding window) |
| **Error Monitoring** | Sentry (@sentry/nextjs) |
| **Charts** | recharts |
| **Validation** | zod |
| **Apple JWT** | jsonwebtoken (ES256 for Apple External Purchase Server API) |
| **Webhook Verification** | svix (for Clerk webhooks) |

### ⚠️ Supabase Connection — CRITICAL
- **ALWAYS** use Session Pooler: `aws-1-eu-west-1.pooler.supabase.com:5432`
- **NEVER** `aws-0` — this caused connection issues previously
- **NEVER** use the direct connection string — only the pooler
- Free tier has a small connection pool (~15-20). Batch queries (max 5-8 concurrent) to avoid `MaxClientsInSessionMode` errors.

---

## 3. Critical Architectural Rules (NON-NEGOTIABLE)

### Stripe Connect
```typescript
// EVERY Stripe API call MUST pass the connected account
await stripe.checkout.sessions.create(params, { stripeAccount: app.stripeConnectId })
await stripe.subscriptions.update(subId, params, { stripeAccount: app.stripeConnectId })
// Without this, calls go to EuroPay's platform account — NOT the developer's
```

### API Key Format
- Prefix: `europay_test_` (sandbox) or `europay_live_` (production)
- Stored as SHA-256 hash — raw key shown once at creation, never recoverable
- Auth: `Authorization: Bearer europay_test_xxx` or `x-api-key` header

### Platform Fee
- Default: **1.5%** per transaction. Do not change without explicit instruction.
- Per-developer custom fees supported (0-15% range, admin-managed)
- One-time payments: `application_fee_amount` (calculated in cents)
- Subscriptions: `application_fee_percent`

### Auth Patterns
```typescript
// Server pages (dashboard, admin)
import { auth } from "@clerk/nextjs/server"
const { userId } = await auth()
if (!userId) redirect("/sign-in")

// API routes (dashboard endpoints)
import { auth } from "@clerk/nextjs/server"
const { userId } = await auth()
if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

// SDK-facing API routes (v1/v2) — use API key auth, NOT Clerk
// Resolved via authenticateV2() in lib/auth-v2.ts
```

### Admin Access
- Single admin user controlled by `ADMIN_CLERK_USER_ID` env var
- Admin pages return `notFound()` for non-admins (hides route existence)

---

## 4. File & Folder Structure

```
~/eupay/apps/web/
├── prisma/
│   └── schema.prisma          # 30+ models, 16+ enums — the data layer
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── v1/            # V1 API (legacy, still active)
│   │   │   │   ├── checkout/  # create, preload, validate, success
│   │   │   │   ├── webhooks/stripe/  # Stripe webhook handler
│   │   │   │   ├── entitlements/
│   │   │   │   ├── products/
│   │   │   │   ├── subscriptions/  # cancel, pause, resume
│   │   │   │   ├── portal/
│   │   │   │   ├── campaigns/     # active, event
│   │   │   │   ├── experiments/   # config, event
│   │   │   │   ├── retention/     # token, accept, cancel
│   │   │   │   ├── telemetry/
│   │   │   │   ├── gdpr/         # export, delete
│   │   │   │   └── apple/        # report
│   │   │   ├── v2/            # V2 API (new, recommended)
│   │   │   │   ├── init/         # Single app-launch call
│   │   │   │   ├── checkout/     # Unified checkout
│   │   │   │   ├── entitlements/ # Access check with awaitPending
│   │   │   │   ├── subscriptions/manage/  # Unified sub management
│   │   │   │   ├── events/       # Unified event tracking
│   │   │   │   ├── webhooks/stripe/
│   │   │   │   └── server/gdpr/
│   │   │   ├── admin/         # Admin CSV exports
│   │   │   ├── clerk/webhook/ # Clerk user.created webhook
│   │   │   ├── cron/          # Daily stats aggregation
│   │   │   ├── stripe/        # Connect OAuth (connect, callback, disconnect)
│   │   │   ├── health/
│   │   │   ├── waitlist/
│   │   │   └── onboarding/
│   │   ├── admin/             # Platform admin pages
│   │   │   ├── page.tsx       # Overview (health, revenue, developers, funnel)
│   │   │   ├── analytics/     # Platform analytics (checkout funnel, SDK, geo)
│   │   │   ├── alerts/        # Operational alerts
│   │   │   └── developers/[userId]/  # Per-developer detail
│   │   ├── dashboard/         # Developer dashboard
│   │   │   ├── page.tsx       # Overview with onboarding checklist
│   │   │   ├── apps/[appId]/  # App detail, products, webhooks, reports
│   │   │   │   ├── products/
│   │   │   │   ├── promotions/
│   │   │   │   ├── campaigns/
│   │   │   │   ├── experiments/
│   │   │   │   ├── retention/
│   │   │   │   ├── webhooks/
│   │   │   │   ├── reports/
│   │   │   │   ├── apple-reporting/
│   │   │   │   ├── dma/
│   │   │   │   └── dma-checklist/
│   │   │   ├── settings/
│   │   │   ├── gdpr/
│   │   │   └── regulatory/
│   │   ├── cancel/[token]/    # Public cancel/retention flow page
│   │   ├── checkout/return/   # Post-checkout return page
│   │   ├── docs/              # Documentation pages
│   │   ├── impressum/         # Legal pages
│   │   ├── privacy/
│   │   ├── terms/
│   │   └── dpa/
│   ├── components/
│   │   ├── dashboard/         # Dashboard-specific components
│   │   ├── admin/             # Admin-specific components
│   │   ├── onboarding/        # ApiKeyReveal, etc.
│   │   └── ui/                # shadcn/ui components
│   ├── emails/                # React Email templates (9 total)
│   │   ├── PurchaseConfirmation.tsx
│   │   ├── WiderrufsrechtWaiver.tsx
│   │   ├── CancellationConfirmation.tsx
│   │   ├── RefundConfirmation.tsx
│   │   ├── RenewalReceipt.tsx
│   │   ├── PaymentFailed.tsx
│   │   ├── WebhookFailureAlert.tsx
│   │   ├── DisputeAlert.tsx
│   │   └── DeveloperWelcome.tsx
│   └── lib/
│       ├── prisma.ts          # Prisma client singleton
│       ├── stripe.ts          # Stripe client singleton
│       ├── auth.ts            # V1 API key authentication
│       ├── auth-v2.ts         # V2 API key auth with requestId, key type validation
│       ├── response-v2.ts     # V2 response envelope helpers
│       ├── checkout.ts        # Shared checkout session creation logic
│       ├── webhook-processor.ts  # Shared webhook handlers (v1 + v2)
│       ├── email.ts           # All email sending functions with audit logging
│       ├── audit.ts           # Fire-and-forget audit event logging
│       ├── milestones.ts      # Developer lifecycle milestone tracking
│       ├── alerts.ts          # Platform alert creation (deduped)
│       ├── apple-reporting.ts # Apple JWT generation + transaction reporting
│       ├── rate-limit.ts      # Upstash Redis rate limiters (5 tiers)
│       ├── currencies.ts      # Supported currencies (EUR only at launch)
│       ├── actions.ts         # Server actions (product CRUD, promotions, campaigns, etc.)
│       ├── admin-exports.ts   # CSV export functions for admin
│       └── payment/           # Payment provider abstraction (partially implemented)
│           ├── types.ts       # PaymentProvider interface
│           ├── stripe-provider.ts
│           ├── index.ts       # Factory
│           └── README.md
├── middleware.ts              # Clerk auth + API rate limiting
└── .env                       # Environment variables (never commit)
```

---

## 5. Key Patterns

### API Route Structure (V2)
```typescript
import { authenticateV2, V2AuthError } from "@/lib/auth-v2"
import { v2Success, v2Error } from "@/lib/response-v2"
import { z } from "zod"

export async function POST(req: NextRequest) {
  const authResult = await authenticateV2(req)
  if ("error" in authResult) {
    return NextResponse.json(authResult, { status: authResult.status })
  }
  const { app, requestId } = authResult

  // Validate
  const schema = z.object({ ... })
  const body = schema.safeParse(await req.json())
  if (!body.success) return v2Error("validation_error", "...", requestId, 400)

  // Business logic...

  return v2Success(data, requestId)
}
```

### V2 Response Envelope
```json
// Success
{ "data": { ... }, "meta": { "requestId": "req_abc123", "timestamp": "..." } }
// Error
{ "error": { "code": "...", "message": "..." }, "meta": { "requestId": "req_abc123", "timestamp": "..." } }
```

### Fire-and-Forget Pattern (audit, milestones, alerts, emails)
```typescript
// These MUST be wrapped in try/catch and NEVER break the main flow
await logAuditEvent({ ... }).catch(err => console.error("[Audit] Failed:", err))
await trackMilestone({ ... })  // try/catch is inside the helper
await createAlert({ ... })      // try/catch is inside the helper
```

### Webhook Handler Pattern
- All handlers live in `lib/webhook-processor.ts`
- Both v1 and v2 routes import the same handlers
- `handleStripeEvent()` is the router function
- `notifyDeveloperV1()` sends Stripe event types, `notifyDeveloperV2()` sends clean EuroPay events
- App's `webhookVersion` field ("v1" or "v2") determines which notification format is used
- Non-critical side effects (emails, audit, milestones, experiments) use try/catch — never break the webhook

### Prisma Queries — Connection Pool Awareness
```typescript
// BAD: 20 parallel queries
const [a, b, c, d, e, f, g, ...] = await Promise.all([...])

// GOOD: Batched, max 5-8 concurrent
const [a, b, c, d] = await Promise.all([...])  // batch 1
const [e, f, g, h] = await Promise.all([...])  // batch 2
```

### Email Sending
```typescript
// All emails go through lib/email.ts
// Every send is audited via logAuditEvent
// Critical emails (Widerrufsrecht, purchase confirmation) create alerts on failure
// Widerrufsrecht has ONE retry after 30 seconds
// From address: "{appName} <noreply@europay.dev>" for end-customer emails
```

### Rate Limiting (5 tiers)
| Tier | Limit | Key | Routes |
|------|-------|-----|--------|
| apiRateLimit | 60/60s | API key | General API routes |
| checkoutRateLimit | 10/60s | API key | Checkout creation |
| webhookRateLimit | 200/60s | IP | Stripe webhooks |
| publicRateLimit | 30/60s | IP | Public/unauthenticated |
| telemetryRateLimit | 100/60s | App ID | SDK telemetry |

---

## 6. What NOT To Do

- ❌ **Do not expose or suggest the Managed/MoR plan** — requires a payment institution license (PSD2)
- ❌ **Do not change the 1.5% fee** without explicit instruction
- ❌ **Do not use the direct Supabase connection** — only the Session Pooler URL
- ❌ **Do not make Stripe API calls without `{ stripeAccount: app.stripeConnectId }`**
- ❌ **Do not break maintenance mode** — `MAINTENANCE_MODE=true` hides the site from public
- ❌ **Do not run `prisma migrate`** — use `prisma db push` for schema changes, `prisma generate` for client
- ❌ **Do not fire more than 5-8 parallel Prisma queries** — Supabase pool will exhaust
- ❌ **Do not store raw API keys** — only SHA-256 hashes. Keys are shown once.
- ❌ **Do not send raw Stripe event data in v2 webhooks** — v2 uses clean EuroPay-native payloads only
- ❌ **Do not let audit/milestone/alert failures break business logic** — always fire-and-forget with try/catch

---

## 7. Current Blockers (Pre-Launch Context)

These are context, not tasks. Do not attempt to resolve them in code.

### Waiting On
- **Apple External Purchase Link Entitlement** — submitted, awaiting approval
- **Stripe business verification** — not yet started, required for live Connect payments
- **Legal review** — ToS, Privacy Policy, DPA, Impressum all written but unreviewed by a lawyer
- **Widerrufsrecht translations** — 23 EU languages via machine translation, need legal translator review

### Credentials to Rotate Before Launch
All current values are test/dev keys:
- Stripe live secret + publishable keys
- Stripe live webhook secret
- Stripe Connect client ID (production)
- Clerk production keys
- Resend API key + production sender domain
- APP_SECRET, CRON_SECRET (generate new random values)
- ADMIN_CLERK_USER_ID (production Clerk user ID)
- Update all in both `.env` and Vercel environment variables

### Infrastructure Not Yet Production-Ready
- Clerk: dev instance (settled-quagga-73) — need production instance
- Resend: using onboarding@resend.dev — need verified europay.dev domain
- Email forwarding: contact@, privacy@, support@ set up in IONOS
- DNS: europay.dev points to Vercel (216.198.79.1) ✓

---

## 8. V1 vs V2 API

V1 endpoints (22 total) remain active for backward compatibility. V2 (7 endpoints) is the recommended API for new integrations.

### V2 Endpoints
| Method | Route | Purpose |
|--------|-------|---------|
| GET | /v2/init | Single app-launch call — products, entitlements, experiments, campaigns |
| POST | /v2/checkout | Create checkout session (supports preload) |
| GET | /v2/entitlements | Check access (supports awaitPending) |
| POST | /v2/subscriptions/manage | Unified cancel/pause/resume/portal with retention |
| POST | /v2/events | Unified event tracking (campaigns, experiments, telemetry) |
| POST | /v2/webhooks/stripe | Stripe webhook handler (shared processor) |
| POST | /v2/server/gdpr | Server-to-server GDPR export/delete |

### Key V2 Improvements
- API key identifies the app — no appId parameter needed
- Test keys (`europay_test_`) only work in sandbox, live keys (`europay_live_`) only in production
- Every response includes `requestId` in meta for support tracing
- Consistent response envelope: `{ data, meta }` or `{ error, meta }`
- Clean webhook payloads — no Stripe internals exposed

---

## 9. Prisma Schema Overview (30+ models)

### Core Business
- `App` — developer's iOS app (central entity, everything hangs off this)
- `ApiKey` — SDK authentication keys (SHA-256 hashed, test/live types)
- `Product` — purchasable items (synced to developer's Stripe account)
- `Customer` — end-user records (keyed by appId + externalUserId)
- `Entitlement` — access grants (ACTIVE/PAUSED/EXPIRED/CANCELLED)
- `Transaction` — payment records with VAT, Widerrufsrecht, Apple reporting status, applied fees

### Revenue Features
- `Promotion` / `PromotionRedemption` — discounts, trials, promo codes
- `MigrationCampaign` / `ProductMapping` / `MigrationEvent` — Switch & Save
- `RetentionConfig` / `CancelEvent` — Save the Sale
- `Experiment` / `ExperimentVariant` / `ExperimentAssignment` / `ExperimentEvent` — A/B testing

### Platform Operations
- `WebhookEvent` — Stripe webhook log with idempotency
- `AuditEvent` — comprehensive audit trail (emails, webhooks, entitlements, Stripe, Apple)
- `CheckoutSession` — funnel analytics (created → completed/expired)
- `SdkEvent` — SDK telemetry
- `PlatformDailyStats` — pre-aggregated daily stats
- `DeveloperMilestone` — lifecycle tracking (signup → first transaction → live)
- `PlatformAlert` — operational alerts (CRITICAL/WARNING/INFO)
- `FeeChangeLog` — fee change audit trail
- `AdminNote` — admin notes about developers
- `ApiRequest` — request tracking for v2

### Legal/Compliance
- `GdprAuditLog` — GDPR action trail
- `RegulatoryUpdate` / `RegulatoryUpdateRead` — DMA updates feed

### Other
- `WaitlistEntry` — coming-soon page signups

---

## 10. Local Development Setup

### Starting the dev server
```bash
cd ~/eupay/apps/web && npm run dev
```
- Runs on port 3000 by default
- If port is busy: `kill <PID> && npm run dev`
- Never run Prisma Studio simultaneously (connection pool exhaustion)

### Stripe webhook testing (local)
```bash
# Terminal 1: dev server
cd ~/eupay/apps/web && npm run dev

# Terminal 2: Stripe CLI (MUST use both flags for Connect)
stripe listen --forward-to localhost:3000/api/v2/webhooks/stripe --forward-connect-to localhost:3000/api/v2/webhooks/stripe

# Terminal 3: test commands
curl -s "http://localhost:3000/api/v2/init?userId=test_user_1" \
  -H "Authorization: Bearer europay_test_<key>"
```

**Important:** Stripe CLI generates its own webhook secret. Update `STRIPE_WEBHOOK_SECRET` in `.env` to match. **Revert before deploying to production.**

### Test connected account
- Account: `acct_1T9W9OLfQ6pnDNjv` (Standard, sandbox)
- Business name: "Test Acc sandbox"
- Standard Connect accounts manage their own settings — platform cannot modify

### Test API key (sandbox)
- Prefix: `europay_test_a42e...`
- App ID: `cmmjm409e0000swc0b8um401m`
- Product ID: `cmmjpdgru0001or2g8ypaxsl7` (rehab, €9/month)

### Test card
- Number: `4242 4242 4242 4242`
- Expiry: any future date
- CVC: any 3 digits
