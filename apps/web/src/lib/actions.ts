"use server"

import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { prisma } from "./prisma"
import { stripe } from "./stripe"
import { generateApiKey } from "./auth"

async function requireUser() {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")
  return userId
}

// ─── App Actions ──────────────────────────────────────────────

export async function createApp(formData: FormData) {
  const userId = await requireUser()
  const name = formData.get("name") as string
  const bundleId = formData.get("bundleId") as string

  if (!name || !bundleId) throw new Error("Name and bundle ID are required")

  const { raw, hash, prefix } = generateApiKey()

  const app = await prisma.app.create({
    data: {
      name,
      bundleId,
      clerkUserId: userId,
    },
  })

  await prisma.apiKey.create({
    data: {
      appId: app.id,
      keyHash: hash,
      keyPrefix: prefix,
      name: "Default",
    },
  })

  revalidatePath("/dashboard/apps")

  return { appId: app.id, apiKey: raw }
}

export async function deleteApp(appId: string) {
  const userId = await requireUser()
  const app = await prisma.app.findUnique({ where: { id: appId } })
  if (!app || app.clerkUserId !== userId) throw new Error("Not found")

  await prisma.app.delete({ where: { id: appId } })
  revalidatePath("/dashboard/apps")
}

// ─── Product Actions ──────────────────────────────────────────

export async function createProduct(formData: FormData) {
  const userId = await requireUser()
  const appId = formData.get("appId") as string
  const name = formData.get("name") as string
  const description = (formData.get("description") as string) || undefined
  const productType = formData.get("productType") as "ONE_TIME" | "SUBSCRIPTION"
  const amountCents = parseInt(formData.get("amountCents") as string, 10)
  const currency = (formData.get("currency") as string) || "eur"
  const interval = (formData.get("interval") as string) || undefined
  const intervalCount = formData.get("intervalCount")
    ? parseInt(formData.get("intervalCount") as string, 10)
    : 1
  const trialDays = formData.get("trialDays")
    ? parseInt(formData.get("trialDays") as string, 10)
    : 0
  const appStoreProductId = (formData.get("appStoreProductId") as string) || undefined

  const app = await prisma.app.findUnique({ where: { id: appId } })
  if (!app || app.clerkUserId !== userId) throw new Error("Not found")

  // Create Stripe product
  const stripeProduct = await stripe.products.create({
    name,
    description,
    tax_code: "txcd_10103001", // SaaS
    metadata: { appId, eupay: "true" },
  })

  // Create Stripe price
  const priceParams: Parameters<typeof stripe.prices.create>[0] = {
    product: stripeProduct.id,
    unit_amount: amountCents,
    currency,
    metadata: { appId },
  }

  if (productType === "SUBSCRIPTION" && interval) {
    priceParams.recurring = {
      interval: interval as "month" | "year",
      interval_count: intervalCount,
    }
  }

  const stripePrice = await stripe.prices.create(priceParams)

  await prisma.product.create({
    data: {
      appId,
      name,
      description,
      productType,
      appStoreProductId,
      stripePriceId: stripePrice.id,
      stripeProductId: stripeProduct.id,
      amountCents,
      currency,
      interval: productType === "SUBSCRIPTION" ? interval : null,
      intervalCount: productType === "SUBSCRIPTION" ? intervalCount : null,
      trialDays: productType === "SUBSCRIPTION" ? trialDays : null,
    },
  })

  revalidatePath(`/dashboard/apps/${appId}/products`)
}

export async function toggleProduct(productId: string, isActive: boolean) {
  const userId = await requireUser()
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { app: true },
  })
  if (!product || product.app.clerkUserId !== userId) throw new Error("Not found")

  await prisma.product.update({
    where: { id: productId },
    data: { isActive },
  })

  revalidatePath(`/dashboard/apps/${product.appId}/products`)
}

// ─── API Key Actions ──────────────────────────────────────────

export async function createApiKeyForApp(appId: string, keyName: string) {
  const userId = await requireUser()
  const app = await prisma.app.findUnique({ where: { id: appId } })
  if (!app || app.clerkUserId !== userId) throw new Error("Not found")

  const { raw, hash, prefix } = generateApiKey()

  await prisma.apiKey.create({
    data: {
      appId,
      keyHash: hash,
      keyPrefix: prefix,
      name: keyName || "API Key",
    },
  })

  revalidatePath("/dashboard/apps")
  return { apiKey: raw }
}

export async function revokeApiKey(keyId: string) {
  const userId = await requireUser()
  const key = await prisma.apiKey.findUnique({
    where: { id: keyId },
    include: { app: true },
  })
  if (!key || key.app.clerkUserId !== userId) throw new Error("Not found")

  await prisma.apiKey.update({
    where: { id: keyId },
    data: { isActive: false },
  })

  revalidatePath("/dashboard/apps")
}

// ─── Subscription Management Actions ─────────────────────────

export async function openCustomerPortal(stripeCustomerId: string) {
  const userId = await requireUser()

  const customer = await prisma.customer.findUnique({
    where: { stripeCustomerId },
    include: { app: true },
  })
  if (!customer || customer.app.clerkUserId !== userId) {
    throw new Error("Not found")
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/apps/${customer.appId}/subscribers`,
  })

  return { url: session.url }
}

export async function cancelSubscriptionFromDashboard(entitlementId: string) {
  const userId = await requireUser()

  const entitlement = await prisma.entitlement.findUnique({
    where: { id: entitlementId },
    include: { customer: { include: { app: true } } },
  })
  if (!entitlement || entitlement.customer.app.clerkUserId !== userId) {
    throw new Error("Not found")
  }
  if (!entitlement.stripeSubscriptionId) {
    throw new Error("No subscription found")
  }

  await stripe.subscriptions.update(entitlement.stripeSubscriptionId, {
    cancel_at_period_end: true,
  })

  await prisma.entitlement.update({
    where: { id: entitlement.id },
    data: { cancelAtPeriodEnd: true },
  })

  revalidatePath(
    `/dashboard/apps/${entitlement.customer.appId}/subscribers`
  )
  return { success: true }
}

export async function applySaveOffer(entitlementId: string) {
  const userId = await requireUser()

  const entitlement = await prisma.entitlement.findUnique({
    where: { id: entitlementId },
    include: { customer: { include: { app: true } }, product: true },
  })
  if (!entitlement || entitlement.customer.app.clerkUserId !== userId) {
    throw new Error("Not found")
  }
  if (!entitlement.stripeSubscriptionId) {
    throw new Error("No subscription found")
  }

  // Create or retrieve the save offer coupon (deterministic ID per app)
  const couponId = `eupay_save_20pct_3mo_${entitlement.customer.appId}`
  try {
    await stripe.coupons.retrieve(couponId)
  } catch {
    await stripe.coupons.create({
      id: couponId,
      percent_off: 20,
      duration: "repeating",
      duration_in_months: 3,
      name: "20% off for 3 months (save offer)",
      metadata: {
        appId: entitlement.customer.appId,
        type: "save_offer",
      },
    })
  }

  // Apply discount and undo any pending cancellation
  await stripe.subscriptions.update(entitlement.stripeSubscriptionId, {
    discounts: [{ coupon: couponId }],
    cancel_at_period_end: false,
  })

  await prisma.entitlement.update({
    where: { id: entitlement.id },
    data: { cancelAtPeriodEnd: false },
  })

  revalidatePath(
    `/dashboard/apps/${entitlement.customer.appId}/subscribers`
  )
  return { success: true }
}

// ─── GDPR Actions ─────────────────────────────────────────────

export type GdprCustomerResult = {
  id: string
  email: string | null
  externalUserId: string
  appName: string
  createdAt: Date
  deletedAt: Date | null
}

export async function searchCustomersForGdpr(query: string) {
  const userId = await requireUser()
  if (!query || query.trim().length === 0) return []

  const apps = await prisma.app.findMany({
    where: { clerkUserId: userId },
    select: { id: true, name: true },
  })
  const appMap = new Map(apps.map((a) => [a.id, a.name]))
  const appIds = apps.map((a) => a.id)

  const customers = await prisma.customer.findMany({
    where: {
      appId: { in: appIds },
      OR: [
        { email: { contains: query, mode: "insensitive" } },
        { externalUserId: { contains: query, mode: "insensitive" } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  return customers.map((c): GdprCustomerResult => ({
    id: c.id,
    email: c.email,
    externalUserId: c.externalUserId,
    appName: appMap.get(c.appId) ?? "Unknown",
    createdAt: c.createdAt,
    deletedAt: c.deletedAt,
  }))
}

export type GdprExportData = {
  customer: {
    externalUserId: string
    email: string | null
    name: string | null
    countryCode: string | null
    gdprConsentAt: Date | null
    createdAt: Date
  }
  entitlements: {
    productName: string
    status: string
    source: string
    currentPeriodEnd: Date | null
    cancelAtPeriodEnd: boolean
    createdAt: Date
  }[]
  transactions: {
    amountTotal: number
    amountSubtotal: number
    amountTax: number
    vatRate: number | null
    vatCountry: string | null
    currency: string
    status: string
    createdAt: Date
  }[]
}

export async function exportCustomerData(customerId: string): Promise<GdprExportData> {
  const userId = await requireUser()

  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      app: { select: { clerkUserId: true } },
      entitlements: { include: { product: { select: { name: true } } } },
      transactions: true,
    },
  })

  if (!customer || customer.app.clerkUserId !== userId) {
    throw new Error("Not found")
  }

  return {
    customer: {
      externalUserId: customer.externalUserId,
      email: customer.email,
      name: customer.name,
      countryCode: customer.countryCode,
      gdprConsentAt: customer.gdprConsentAt,
      createdAt: customer.createdAt,
    },
    entitlements: customer.entitlements.map((e) => ({
      productName: e.product.name,
      status: e.status,
      source: e.source,
      currentPeriodEnd: e.currentPeriodEnd,
      cancelAtPeriodEnd: e.cancelAtPeriodEnd,
      createdAt: e.createdAt,
    })),
    transactions: customer.transactions.map((t) => ({
      amountTotal: t.amountTotal,
      amountSubtotal: t.amountSubtotal,
      amountTax: t.amountTax,
      vatRate: t.vatRate,
      vatCountry: t.vatCountry,
      currency: t.currency,
      status: t.status,
      createdAt: t.createdAt,
    })),
  }
}

export async function deleteCustomerData(customerId: string) {
  const userId = await requireUser()

  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: { app: { select: { clerkUserId: true } } },
  })

  if (!customer || customer.app.clerkUserId !== userId) {
    throw new Error("Not found")
  }

  if (customer.deletedAt) {
    throw new Error("Customer data already deleted")
  }

  // Delete from Stripe (best effort)
  try {
    await stripe.customers.del(customer.stripeCustomerId)
  } catch {
    // Stripe deletion may fail if already deleted — continue
  }

  // Anonymise in our DB — retain financial records for tax compliance (GoBD)
  await prisma.customer.update({
    where: { id: customer.id },
    data: {
      email: null,
      name: null,
      stripeCustomerId: `deleted_${customer.id}`,
      deletedAt: new Date(),
    },
  })

  revalidatePath("/dashboard/gdpr")
  return { success: true, deletedAt: new Date().toISOString() }
}
