# EuroPay — Lessons Learned

> Running log of mistakes, corrections, and rules extracted from real Claude Code sessions. Read this at the start of every session alongside CLAUDE.md. Add new entries as they occur.

---

## Session Log

### 2026-03-04 — Fee was wrong across the codebase
**What happened:** Platform fee was set to 0.5% in multiple files when it should have been 1.5%.
**Correct pattern:** Fee is 1.5%, enforced via `platformFeePercent` on the App model (default 1.5). Never hardcode — read from the model.
**Rule:** Never hardcode the fee percentage. Always read `app.platformFeePercent`. If displaying the fee in UI, reference the model, not a literal.

### 2026-03-04 — Missing application_fee_amount on checkout
**What happened:** Stripe Checkout session was created without `application_fee_amount` or `application_fee_percent`. EuroPay collected 0% revenue. This was a critical bug present since initial build.
**Correct pattern:** One-time payments use `payment_intent_data.application_fee_amount`. Subscriptions use `subscription_data.application_fee_percent`. Both are set in `lib/checkout.ts`.
**Rule:** Every checkout session MUST include the platform fee. After any checkout-related change, verify the fee is still applied.

### 2026-03-04 — Apple transaction reporting not automated
**What happened:** `reportToApple()` was only wired to manual dashboard buttons, not to the webhook handler. Transactions were never automatically reported to Apple.
**Correct pattern:** `reportToApple()` is called from `handleCheckoutSessionCompleted`, `handleInvoicePaymentSucceeded`, and `handleChargeRefunded` in the webhook processor. Fire-and-forget with try/catch.
**Rule:** Any new transaction-creating flow must call `reportToApple()`. Check webhook handler after changes.

### 2026-03-04 — .europayCheckout in code snippets
**What happened:** Landing page and docs showed `.europayCheckout(productId:)` as the SDK API. This modifier doesn't exist. The actual API is `purchase(product:userId:presenting:)`.
**Correct pattern:** SDK methods are: `configure()`, `initialize(userId:)`, `purchase(product:presenting:)`, `hasAccess(to:)`, `manageSubscription()`.
**Rule:** Before showing SDK code in any UI (landing page, onboarding, docs), verify it matches the actual EuroPayKit API.

### 2026-03-07 — Supabase connection pool exhaustion
**What happened:** Admin dashboard fired 20+ parallel Prisma queries via `Promise.all`, exceeding Supabase's session pool limit (~15-20 connections). Page crashed with `MaxClientsInSessionMode`.
**Correct pattern:** Batch queries into groups of 5-8 max. Await each batch before starting the next.
**Rule:** Never fire more than 8 parallel Prisma queries. For pages with many queries (admin, analytics), batch into sequential groups. Always test admin pages after adding queries.

### 2026-03-07 — prisma db push said "already in sync" but wasn't
**What happened:** After adding new models (FeeChangeLog, AdminNote, appliedFeeCents on Transaction), `prisma db push` reported "already in sync" but the models didn't exist in the database. The admin page then crashed on `feeChangeLog.findMany()`.
**Correct pattern:** If `db push` says "in sync" but models are missing, run `prisma db push --force-reset` (destroys all data — only safe pre-launch).
**Rule:** After adding new Prisma models, always verify they exist by testing the page that uses them. Don't trust "already in sync" if models were just added.

### 2026-03-07 — .env file had broken ADMIN_CLERK_USER_ID
**What happened:** The `.env` line was `echo "ADMIN_CLERK_USER_ID=user_user_3AME..."` — a shell command pasted as a value. Also had double `user_` prefix.
**Correct pattern:** Env vars are plain `KEY=value`. No quotes, no `echo`, no shell syntax. Clerk user IDs start with `user_` (once, not `user_user_`).
**Rule:** When editing `.env`, always verify the value is a plain string. No shell commands, no quotes around values.

### 2026-03-08 — Managed/MoR plan shown in onboarding
**What happened:** The onboarding flow showed a "Plan" step with Managed (MoR, 11.5%) and BYOS options. The Managed plan cannot be offered without a payment institution license.
**Correct pattern:** BYOS only at launch. Onboarding is a single step: app name + bundle ID → dashboard.
**Rule:** Never expose Managed/MoR plan options in any user-facing UI. The plan is hardcoded to "byos".

### 2026-03-08 — Onboarding validated revenueTier and plan as required
**What happened:** The onboarding API route required `appName, bundleId, revenueTier, and plan`. After removing the plan step from the UI, the form submission failed with a 400 error.
**Correct pattern:** Only `appName` and `bundleId` are required. `revenueTier` is optional. `plan` is hardcoded to "byos".
**Rule:** When removing UI fields, always check the corresponding API route/server action validation. Frontend and backend must stay in sync.

### 2026-03-09 — API key shown in plain text during onboarding
**What happened:** The onboarding API key step showed the raw API key in plain text with no hide/show toggle.
**Correct pattern:** Keys are hidden by default (`europay_••••••••`). Show/Hide toggle with Eye/EyeOff icon. Copy button works whether visible or hidden.
**Rule:** API keys and secrets are always masked by default in the UI. User must explicitly click to reveal.

### 2026-03-09 — Generated API keys lost when toggling checklist
**What happened:** Expanding the "Get API Keys" section in the dashboard, generating keys, collapsing, then re-expanding lost the keys because React state was destroyed on unmount.
**Correct pattern:** Lift state that must persist across toggles to the parent component. The toggle controls visibility, not mount/unmount.
**Rule:** Any state that represents one-time-show data (API keys, generated secrets) must be stored at a level that survives UI toggle interactions.

### 2026-03-09 — Product price input in cents
**What happened:** The Create Product form had a "Price (cents)" field expecting integer cents (999 for €9.99). Developers think in euros, not cents.
**Correct pattern:** Show price in euros with € symbol. Accept decimal input (9.99). Convert to cents on submission: `Math.round(parseFloat(value) * 100)`.
**Rule:** All user-facing price inputs are in the user's currency unit (euros), not cents. Conversion happens at form submission time, not in the developer's head.

### 2026-03-09 — Number input spinners on price field
**What happened:** The price field used `type="number"` which shows browser up/down arrow spinners. Nobody clicks arrows 999 times to set a price.
**Correct pattern:** Use `type="text" inputMode="decimal" pattern="[0-9]*[.,]?[0-9]*"` for price inputs. Use `inputMode="numeric"` for integer inputs (trial days). No CSS hacks to hide spinners.
**Rule:** Never use `type="number"` for price or quantity inputs. Use `type="text"` with the appropriate `inputMode` attribute. Simpler, no tech debt.

### 2026-03-09 — Product creation blocked without Stripe
**What happened:** Creating a product threw an error if Stripe wasn't connected yet. But developers coming from Apple IAP are setting up Stripe for the first time — verification can take days.
**Correct pattern:** Products can be created without Stripe (stored in DB with `syncedToStripe: false`). When Stripe connects, products auto-sync. Manual "Sync to Stripe" button as fallback.
**Rule:** Don't block developer setup on external dependencies. Let them configure everything, sync when ready. Show clear status of what's pending.

### 2026-03-09 — syncedToStripe field not in database
**What happened:** Added `syncedToStripe Boolean` to Prisma schema and ran `prisma generate`, but forgot `prisma db push`. Product creation crashed with "Unknown argument syncedToStripe".
**Correct pattern:** Schema changes require BOTH `prisma generate` (updates the client) AND `prisma db push` (updates the database). Always run both.
**Rule:** After any Prisma schema change: (1) `npx prisma generate`, (2) kill dev server, (3) `npx prisma db push`, (4) restart dev server.

### 2026-03-09 — Currency as free text input
**What happened:** Currency was a plain text field where developers could type anything. Should be a constrained dropdown.
**Correct pattern:** EUR only at launch. Currency defined in `lib/currencies.ts` as a constant array. Show as read-only label with € symbol. Infrastructure ready for multi-currency (commented-out options).
**Rule:** Don't use free text inputs for constrained values. Use dropdowns or read-only labels. If there's only one option, show it as a label, not a single-option dropdown.

### 2026-03-09 — DMA entitlement link pointed to outdated PDF
**What happened:** Dashboard linked to `developer.apple.com/contact/request/download/external_purchase.pdf` which is outdated. Apple consolidated all DMA info under a new page.
**Correct pattern:** Current URL: `https://developer.apple.com/support/communication-and-promotion-of-offers-on-the-app-store-in-the-eu/`
**Rule:** Apple changes their developer URLs frequently. When referencing Apple links, search for the current URL. Don't assume old links still work.

### 2026-03-10 — Standard OAuth disabled for Stripe Connect
**What happened:** Clicking "Connect Stripe" returned an error: "Standard OAuth is disabled for this Stripe Connect integration."
**Correct pattern:** In Stripe Dashboard → Connect → Settings → OAuth tab: (1) Enable OAuth, (2) Add redirect URI `http://localhost:3000/api/stripe/callback`.
**Rule:** Stripe Connect OAuth must be explicitly enabled in the Stripe Dashboard. This is a manual setup step, not a code issue. Document in CLAUDE.md and onboarding checklist.

### 2026-03-10 — Dev server must be killed before prisma db push
**What happened:** `prisma db push` failed with `MaxClientsInSessionMode` because the dev server was holding connections.
**Correct pattern:** Always: (1) `pkill -f "next dev"`, (2) `sleep 3`, (3) `npx prisma db push`, (4) `npm run dev`.
**Rule:** Before any Prisma database operation (`db push`, `--force-reset`, `studio`), kill the dev server first. Always restart it afterwards. Never leave the developer without a running dev server.

---

## Recurring Rules (extracted from above)

These are standing instructions — apply on every session:

1. **Prisma schema changes:** Generate → Kill dev server → DB push → Restart. Always all four steps.
2. **Query batching:** Max 5-8 parallel Prisma queries. Batch into sequential groups for admin/analytics pages.
3. **Stripe Connect:** Every Stripe call needs `{ stripeAccount: app.stripeConnectId }`. No exceptions.
4. **Platform fee:** Read from `app.platformFeePercent`, never hardcode 1.5%.
5. **API keys:** Masked by default. Show/hide toggle. Copy works when hidden.
6. **Price inputs:** Euros in UI, cents in backend. Convert at submission. Use `type="text" inputMode="decimal"`.
7. **No MoR:** Never expose Managed plan. BYOS only. Hardcode plan to "byos".
8. **Frontend ↔ Backend sync:** When changing UI fields, always update the corresponding validation.
9. **Apple URLs:** Verify current URLs before using. Apple changes them.
10. **SDK code in UI:** Verify against actual EuroPayKit API before displaying.
11. **Don't block on externals:** Let developers set up products, config, etc. without Stripe connected. Sync later.
12. **Fire-and-forget side effects:** Audit logs, milestones, alerts, emails — always try/catch, never break main flow.
13. **Dev server lifecycle:** Kill before DB operations, always restart after. Never forget the restart.
14. **Env vars:** Plain `KEY=value`. No quotes, no shell commands, no double prefixes.
