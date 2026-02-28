# Deployment Guide

Deploy EUPay to Vercel with PostgreSQL, Stripe, Clerk, and Resend.

---

## Prerequisites

Before deploying, you need accounts with:

| Service | Purpose | Sign up |
|---------|---------|---------|
| **Vercel** | Hosting (Next.js) | [vercel.com](https://vercel.com) |
| **PostgreSQL provider** | Database (Supabase, Neon, or Railway) | [supabase.com](https://supabase.com) / [neon.tech](https://neon.tech) |
| **Stripe** | Payments | [dashboard.stripe.com](https://dashboard.stripe.com) |
| **Clerk** | Dashboard authentication | [dashboard.clerk.com](https://dashboard.clerk.com) |
| **Resend** | Transactional emails | [resend.com](https://resend.com) |

---

## Step 1: Connect Vercel to the GitHub Repo

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **Import Git Repository**
3. Select the `eupay` repository
4. **Configure the project:**
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** Click **Edit** and set to `apps/web`
   - **Build Command:** `prisma generate && next build` (already set in `vercel.json`)
   - **Output Directory:** `.next` (default)
   - **Install Command:** `npm install` (default)
5. **Do NOT deploy yet** — add environment variables first (Step 2)

> **Why `apps/web`?** This is a monorepo. The Next.js app lives in `apps/web/`, not the repo root. Vercel's "Root Directory" setting tells it where to find `package.json` and run the build.

---

## Step 2: Add Environment Variables in Vercel

Go to your Vercel project **Settings > Environment Variables** and add each variable below.

Set all variables for the **Production**, **Preview**, and **Development** environments unless noted otherwise.

### Database

| Variable | Value | Notes |
|----------|-------|-------|
| `DATABASE_URL` | `postgresql://...` | Your production PostgreSQL connection string. Use SSL (`?sslmode=require`). If using Supabase, use the "Connection string" from Settings > Database. |

### Stripe

| Variable | Value | Notes |
|----------|-------|-------|
| `STRIPE_SECRET_KEY` | `sk_live_...` | From [Stripe Dashboard > API keys](https://dashboard.stripe.com/apikeys). Use `sk_test_...` for Preview environment. |
| `STRIPE_PUBLISHABLE_KEY` | `pk_live_...` | From same page. Use `pk_test_...` for Preview. |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | From the webhook endpoint you create in Step 3. |

### Clerk

| Variable | Value | Notes |
|----------|-------|-------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_live_...` | From [Clerk Dashboard > API Keys](https://dashboard.clerk.com). Use your production instance. |
| `CLERK_SECRET_KEY` | `sk_live_...` | From same page. |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` | |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` | |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | `/dashboard` | |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | `/dashboard` | |

### Resend

| Variable | Value | Notes |
|----------|-------|-------|
| `RESEND_API_KEY` | `re_...` | From [Resend > API Keys](https://resend.com/api-keys). |
| `RESEND_FROM_EMAIL` | `receipts@eupay.io` | Must match a [verified domain](https://resend.com/domains) in Resend. |

### Application

| Variable | Value | Notes |
|----------|-------|-------|
| `NEXT_PUBLIC_APP_URL` | `https://eupay.io` | Your production domain. For Preview, use `https://eupay-git-{branch}.vercel.app` or leave as production URL. |
| `APP_SECRET` | *(random string)* | Generate with: `openssl rand -base64 32` |

After adding all variables, click **Deploy** (or trigger a redeploy).

---

## Step 3: Register the Stripe Webhook Endpoint

After your first deploy succeeds and you have a live URL:

1. Go to [Stripe Dashboard > Developers > Webhooks](https://dashboard.stripe.com/webhooks)
2. Click **Add endpoint**
3. Set the **Endpoint URL** to:
   ```
   https://your-domain.com/api/v1/webhooks/stripe
   ```
   Replace `your-domain.com` with your Vercel domain (e.g., `eupay.io` or `eupay.vercel.app`).

4. Under **Events to send**, select these 7 events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `charge.refunded`
   - `charge.dispute.created`

5. Click **Add endpoint**

6. On the endpoint detail page, click **Reveal** under **Signing secret** to see the `whsec_...` value

7. Copy that value and update `STRIPE_WEBHOOK_SECRET` in Vercel:
   - Go to Vercel project **Settings > Environment Variables**
   - Edit `STRIPE_WEBHOOK_SECRET` and paste the new value
   - Redeploy for the change to take effect

### Test the Webhook

From the Stripe webhook endpoint page, click **Send test webhook** and choose `checkout.session.completed`. You should see a `200` response in Stripe and a new entry in the webhook log on your dashboard.

---

## Step 4: Run Database Migrations

After your first deploy, the database needs to be migrated. You have two options:

### Option A: From your local machine

```bash
cd apps/web
DATABASE_URL="postgresql://your-production-connection-string" npx prisma migrate deploy
```

### Option B: Via Vercel CLI

```bash
npx vercel env pull apps/web/.env.local --environment=production
cd apps/web
npx prisma migrate deploy
```

> **Important:** Use `prisma migrate deploy` (not `prisma migrate dev`) in production. It applies pending migrations without prompting.

---

## Step 5: Switch from Stripe Test Keys to Live Keys

When you're ready to accept real payments:

### Pre-flight Checklist

- [ ] All webhook events process correctly in test mode
- [ ] Checkout flow completes end-to-end in test mode
- [ ] Entitlements are granted after webhook processing
- [ ] Cancellation/refund flows work in test mode
- [ ] Transactional emails are being sent and received
- [ ] Clerk production instance is configured with your domain

### Switch Steps

1. **Activate your Stripe account** at [dashboard.stripe.com/account/onboarding](https://dashboard.stripe.com/account/onboarding) (complete identity verification, add bank account)

2. **Get live API keys** from [Stripe Dashboard > API keys](https://dashboard.stripe.com/apikeys) (toggle off "Test mode" at the top)

3. **Create a live webhook endpoint** — repeat Step 3 above but while in live mode. You'll get a new `whsec_...` signing secret.

4. **Update Vercel environment variables** for Production:

   | Variable | Old (test) | New (live) |
   |----------|-----------|------------|
   | `STRIPE_SECRET_KEY` | `sk_test_...` | `sk_live_...` |
   | `STRIPE_PUBLISHABLE_KEY` | `pk_test_...` | `pk_live_...` |
   | `STRIPE_WEBHOOK_SECRET` | `whsec_...` (test) | `whsec_...` (live) |

5. **Keep test keys for Preview environment** — in Vercel, you can set different values per environment. Set the Production environment to live keys and keep Preview/Development on test keys.

6. **Recreate your products in live mode** — Stripe test mode and live mode have separate product catalogs. Create your products again in live mode, then update your EUPay dashboard product records.

7. **Redeploy** to pick up the new environment variables.

### Post-Switch Verification

- [ ] Make a real purchase with a real card (refund it after)
- [ ] Verify the webhook fires and entitlement is granted
- [ ] Check that the confirmation email arrives
- [ ] Verify the transaction appears in your Stripe Dashboard (live mode)
- [ ] Test the Customer Portal link

---

## Step 6: Configure Custom Domain (Optional)

1. In Vercel project **Settings > Domains**, add your custom domain (e.g., `eupay.io`)
2. Follow Vercel's DNS instructions to point your domain
3. Update these after the domain is active:
   - `NEXT_PUBLIC_APP_URL` → `https://eupay.io`
   - Stripe webhook endpoint URL → `https://eupay.io/api/v1/webhooks/stripe`
   - Clerk production domain → add `eupay.io` in Clerk Dashboard

---

## Local Development

```bash
# 1. Clone the repo
git clone https://github.com/markholtmeier/eupay.git
cd eupay

# 2. Set up environment
cp .env.example apps/web/.env.local
# Edit apps/web/.env.local with your test credentials

# 3. Install dependencies
cd apps/web
npm install

# 4. Set up the database
npx prisma migrate dev

# 5. Start the dev server
npm run dev
```

### Local Stripe Webhooks

Use the [Stripe CLI](https://docs.stripe.com/stripe-cli) to forward webhooks to your local server:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local
stripe listen --forward-to localhost:3000/api/v1/webhooks/stripe

# Copy the whsec_... output and set STRIPE_WEBHOOK_SECRET in .env.local
```

---

## Troubleshooting

### Build fails with "prisma generate" error

The `vercel.json` at the repo root sets `buildCommand` to `prisma generate && next build`. If this fails, ensure `prisma` is in `dependencies` (not just `devDependencies`) in `apps/web/package.json`.

### Webhook returns 400/500

- Verify `STRIPE_WEBHOOK_SECRET` matches the endpoint's signing secret
- Check Vercel function logs: **Vercel Dashboard > Deployments > Functions**
- Ensure the webhook URL includes `/api/v1/webhooks/stripe` (not just `/webhooks`)

### "Missing required environment variable" at runtime

All env vars are validated at module import time. If one is missing, the build may succeed but the route will fail. Check Vercel project Settings > Environment Variables and redeploy.

### Clerk redirects not working

Ensure `NEXT_PUBLIC_CLERK_SIGN_IN_URL` and related vars are set. In Clerk Dashboard, add your Vercel domain to the list of allowed redirect URLs.

### Emails not sending

- Check that `RESEND_API_KEY` is valid
- Ensure the sender domain is verified in Resend
- Email failures are non-blocking — check Vercel function logs for error details
