# Payment Provider Abstraction

EuroPay uses a payment provider abstraction layer so that API routes don't call Stripe (or any provider) directly. This makes it possible to add alternative providers (e.g. Rootline) without rewriting route logic.

## Architecture

```
Route  →  getPaymentProvider(app.paymentProvider)  →  PaymentProvider interface
                                                         ├── StripeProvider   (implemented)
                                                         └── RootlineProvider (planned)
```

- **`types.ts`** — Provider-agnostic interface (`PaymentProvider`) and all param/return types. Return types are plain objects; no Stripe SDK types leak through.
- **`stripe-provider.ts`** — Stripe implementation. Wraps the existing `@/lib/stripe` client. Maps between agnostic types and Stripe SDK types.
- **`index.ts`** — Factory (`getPaymentProvider`) and re-exports.

## How to migrate a route

1. Import the factory and types:
   ```ts
   import { getPaymentProvider, ProviderType } from '@/lib/payment'
   ```

2. Resolve the provider from the app record:
   ```ts
   const provider = getPaymentProvider(auth.app.paymentProvider as ProviderType)
   ```

3. Build a `MerchantContext` from the app's connected account ID:
   ```ts
   const merchantCtx = { providerId: auth.app.stripeConnectId! }
   ```

4. Replace direct `stripe.*` calls with `provider.*` calls using the agnostic param types.

5. Add the migration comment at the top of the file:
   ```ts
   // MIGRATED to payment provider abstraction — see src/lib/payment/
   ```

## How to add a new provider

1. Create `src/lib/payment/<provider>-provider.ts` implementing the `PaymentProvider` interface.
2. Add the provider to the `ProviderType` enum in `types.ts`.
3. Add a case to the `getPaymentProvider` factory in `index.ts`.
4. Add the corresponding enum value to the Prisma `PaymentProvider` enum and add any provider-specific fields to the `App` model.
5. Run `npx prisma generate` and `npx prisma migrate dev`.

## Migration status

| Route | Status | Notes |
|-------|--------|-------|
| `POST /api/v1/portal` | Migrated | Reference implementation |
| `POST /api/v1/checkout/create` | Direct Stripe | |
| `GET /api/v1/checkout/success` | Direct Stripe | |
| `POST /api/v1/subscriptions/pause` | Direct Stripe | |
| `POST /api/v1/subscriptions/resume` | Direct Stripe | |
| `POST /api/v1/subscriptions/cancel` | Direct Stripe | |
| `POST /api/v1/webhooks/stripe` | Direct Stripe | Complex — migrate last |
| `DELETE /api/v1/gdpr/delete` | Direct Stripe | |
