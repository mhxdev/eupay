"use server"

import { auth, clerkClient } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import Stripe from "stripe"
import { prisma } from "./prisma"
import { stripe } from "./stripe"
import { generateApiKey } from "./auth"
import { sendDeveloperWelcome } from "./email"
import { trackMilestone } from "./milestones"
import { createAlert } from "./alerts"

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

  // Check if this is the user's first app (before creating)
  const existingAppCount = await prisma.app.count({
    where: { clerkUserId: userId },
  })

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

  // Track milestones
  await trackMilestone({ clerkUserId: userId, appId: app.id, milestone: "app_created", details: { appName: name, bundleId } })
  await trackMilestone({ clerkUserId: userId, appId: app.id, milestone: "api_key_generated" })

  // Send welcome email on first app creation
  if (existingAppCount === 0) {
    try {
      const clerk = await clerkClient()
      const user = await clerk.users.getUser(userId)
      const email = user.emailAddresses[0]?.emailAddress
      if (email) {
        await sendDeveloperWelcome({
          to: email,
          name: user.firstName ?? "",
        })
        await createAlert({
          severity: "INFO",
          category: "developer_health",
          title: "New developer signed up",
          description: `${email} created their first app "${name}".`,
          appId: app.id,
          developerUserId: userId,
        })
      }
    } catch (emailErr) {
      console.error("[Actions] Welcome email failed:", emailErr)
    }
  }

  revalidatePath("/dashboard/apps")

  return { appId: app.id, apiKey: raw }
}

export async function deleteApp(appId: string) {
  const userId = await requireUser()
  const app = await prisma.app.findUnique({ where: { id: appId } })
  if (!app || app.clerkUserId !== userId) throw new Error("Not found")

  await trackMilestone({ clerkUserId: userId, appId, milestone: "account_deleted", details: { appName: app.name } })

  await prisma.app.delete({ where: { id: appId } })
  revalidatePath("/dashboard/apps")
}

// ─── App Settings Actions ─────────────────────────────────────

export async function updateSendCustomerEmails(appId: string, enabled: boolean) {
  const userId = await requireUser()
  const app = await prisma.app.findUnique({ where: { id: appId } })
  if (!app || app.clerkUserId !== userId) throw new Error("Not found")

  await prisma.app.update({
    where: { id: appId },
    data: { sendCustomerEmails: enabled },
  })

  revalidatePath(`/dashboard/apps/${appId}`)
  return { success: true }
}

// ─── Admin Actions ───────────────────────────────────────────

export async function updatePlatformFee(appId: string, feePercent: number, note?: string) {
  const userId = await requireUser()
  if (userId !== process.env.ADMIN_CLERK_USER_ID) {
    throw new Error("Unauthorized")
  }
  if (typeof feePercent !== "number" || isNaN(feePercent) || feePercent < 0 || feePercent > 15) {
    throw new Error("Fee must be between 0% and 15%")
  }

  // Read current fee for audit log
  const app = await prisma.app.findUnique({ where: { id: appId }, select: { platformFeePercent: true } })
  if (!app) throw new Error("App not found")

  const previousPercent = app.platformFeePercent

  // Create audit log entry
  await prisma.feeChangeLog.create({
    data: {
      appId,
      changedBy: userId,
      previousPercent,
      newPercent: feePercent,
      note: note || null,
    },
  })

  await prisma.app.update({
    where: { id: appId },
    data: {
      platformFeePercent: feePercent,
      platformFeeUpdatedAt: new Date(),
    },
  })

  revalidatePath("/admin")
  return { success: true }
}

// ─── Admin Note Actions ──────────────────────────────────────

export async function addAdminNote(developerUserId: string, content: string) {
  const userId = await requireUser()
  if (userId !== process.env.ADMIN_CLERK_USER_ID) {
    throw new Error("Unauthorized")
  }
  if (!content.trim()) throw new Error("Note content required")

  await prisma.adminNote.create({
    data: {
      developerUserId,
      content: content.trim(),
      createdBy: userId,
    },
  })

  revalidatePath(`/admin/developers/${developerUserId}`)
  return { success: true }
}

export async function deleteAdminNote(noteId: string) {
  const userId = await requireUser()
  if (userId !== process.env.ADMIN_CLERK_USER_ID) {
    throw new Error("Unauthorized")
  }

  const note = await prisma.adminNote.findUnique({ where: { id: noteId } })
  if (!note) throw new Error("Note not found")

  await prisma.adminNote.delete({ where: { id: noteId } })

  revalidatePath(`/admin/developers/${note.developerUserId}`)
  return { success: true }
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

  if (!app.stripeConnectId) {
    throw new Error("No Stripe account connected. Connect your Stripe account in the app settings before creating products.")
  }

  const connectOpts = { stripeAccount: app.stripeConnectId }

  // Create Stripe product
  const stripeProduct = await stripe.products.create({
    name,
    description,
    tax_code: "txcd_10103001", // SaaS
    metadata: { appId, eupay: "true" },
  }, connectOpts)

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

  const stripePrice = await stripe.prices.create(priceParams, connectOpts)

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

  await trackMilestone({ clerkUserId: userId, appId, milestone: "product_created", details: { productName: name, productType } })

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

  await trackMilestone({ clerkUserId: userId, appId, milestone: "api_key_generated" })

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
  const couponId = `europay_save_20pct_3mo_${entitlement.customer.appId}`
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

// ─── Apple Reporting & Compliance Stubs ──────────────────────

export async function exportAuditTrail(appId: string, startDate: string, endDate: string) {
  await requireUser()
  void appId; void startDate; void endDate
  return [] as Record<string, string | number | null>[]
}

export async function getRegulatoryUpdates() {
  await requireUser()
  return [] as { id: string; title: string; description: string; actionRequired: string | null; publishedAt: string; isRead: boolean; readAt: string | null }[]
}

export async function markRegulatoryUpdateRead(id: string) {
  await requireUser()
  void id
  return { success: true as const }
}

export async function markAllRegulatoryUpdatesRead() {
  await requireUser()
  return { success: true as const }
}

export async function updateAppleCredentials(formData: FormData) {
  await requireUser()
  void formData
  return { success: true as const }
}

export async function removeAppleCredentials(appId: string) {
  await requireUser()
  void appId
  return { success: true as const }
}

export async function retryAppleReportAction(reportId: string) {
  await requireUser()
  void reportId
}

export async function updateSetupChecklist(appId: string, stepKey: string, completed: boolean) {
  await requireUser()
  void appId; void stepKey; void completed
}

// ─── Promotion Actions ───────────────────────────────────────

export async function createPromotion(formData: FormData) {
  const userId = await requireUser()
  const appId = formData.get("appId") as string
  const name = formData.get("name") as string
  const code = (formData.get("code") as string) || null
  const type = formData.get("type") as "PERCENT_OFF" | "AMOUNT_OFF" | "TRIAL_EXTENSION"
  const duration = formData.get("duration") as "ONCE" | "REPEATING" | "FOREVER"
  const percentOff = formData.get("percentOff") ? parseFloat(formData.get("percentOff") as string) : null
  const amountOffCents = formData.get("amountOffCents") ? parseInt(formData.get("amountOffCents") as string, 10) : null
  const currency = (formData.get("currency") as string) || "eur"
  const durationInMonths = formData.get("durationInMonths") ? parseInt(formData.get("durationInMonths") as string, 10) : null
  const trialDays = formData.get("trialDays") ? parseInt(formData.get("trialDays") as string, 10) : null
  const productId = (formData.get("productId") as string) || null
  const maxRedemptions = formData.get("maxRedemptions") ? parseInt(formData.get("maxRedemptions") as string, 10) : null
  const expiresAt = formData.get("expiresAt") ? new Date(formData.get("expiresAt") as string) : null

  const app = await prisma.app.findUnique({ where: { id: appId } })
  if (!app || app.clerkUserId !== userId) throw new Error("Not found")
  if (!app.stripeConnectId) throw new Error("No Stripe account connected")

  const connectOpts = { stripeAccount: app.stripeConnectId }

  // Create Stripe Coupon on the connected account (skip for TRIAL_EXTENSION)
  let stripeCouponId: string | undefined
  let stripePromoCodeId: string | undefined

  if (type !== "TRIAL_EXTENSION") {
    const couponParams: Stripe.CouponCreateParams = {
      name,
      duration: duration.toLowerCase() as Stripe.CouponCreateParams["duration"],
      metadata: { appId, europay: "true" },
    }
    if (type === "PERCENT_OFF" && percentOff) {
      couponParams.percent_off = percentOff
    } else if (type === "AMOUNT_OFF" && amountOffCents) {
      couponParams.amount_off = amountOffCents
      couponParams.currency = currency
    }
    if (duration === "REPEATING" && durationInMonths) {
      couponParams.duration_in_months = durationInMonths
    }
    if (maxRedemptions) {
      couponParams.max_redemptions = maxRedemptions
    }
    if (expiresAt) {
      couponParams.redeem_by = Math.floor(expiresAt.getTime() / 1000)
    }
    // Apply to specific product if set
    if (productId) {
      const product = await prisma.product.findUnique({ where: { id: productId } })
      if (product?.stripeProductId) {
        couponParams.applies_to = { products: [product.stripeProductId] }
      }
    }

    const stripeCoupon = await stripe.coupons.create(
      couponParams,
      connectOpts
    )
    stripeCouponId = stripeCoupon.id

    // If there's a public code, create a Stripe Promotion Code
    if (code) {
      const promoCode = await stripe.promotionCodes.create({
        promotion: { type: "coupon", coupon: stripeCoupon.id },
        code: code.toUpperCase(),
        max_redemptions: maxRedemptions ?? undefined,
        expires_at: expiresAt ? Math.floor(expiresAt.getTime() / 1000) : undefined,
        metadata: { appId },
      }, connectOpts)
      stripePromoCodeId = promoCode.id
    }
  }

  await prisma.promotion.create({
    data: {
      appId,
      name,
      code: code?.toUpperCase() ?? null,
      type,
      duration,
      percentOff,
      amountOffCents,
      currency,
      durationInMonths,
      trialDays,
      productId,
      maxRedemptions,
      expiresAt,
      stripeCouponId,
      stripePromoCodeId,
      status: "ACTIVE",
    },
  })

  revalidatePath(`/dashboard/apps/${appId}/promotions`)
}

export async function togglePromotionStatus(promotionId: string, active: boolean) {
  const userId = await requireUser()
  const promotion = await prisma.promotion.findUnique({
    where: { id: promotionId },
    include: { app: true },
  })
  if (!promotion || promotion.app.clerkUserId !== userId) throw new Error("Not found")

  await prisma.promotion.update({
    where: { id: promotionId },
    data: { status: active ? "ACTIVE" : "PAUSED" },
  })

  revalidatePath(`/dashboard/apps/${promotion.appId}/promotions`)
  return { success: true }
}

export async function deletePromotion(promotionId: string) {
  const userId = await requireUser()
  const promotion = await prisma.promotion.findUnique({
    where: { id: promotionId },
    include: { app: true },
  })
  if (!promotion || promotion.app.clerkUserId !== userId) throw new Error("Not found")

  // Delete from Stripe (best effort)
  if (promotion.stripeCouponId && promotion.app.stripeConnectId) {
    try {
      await stripe.coupons.del(promotion.stripeCouponId, {
        stripeAccount: promotion.app.stripeConnectId,
      })
    } catch {
      // Coupon may already be deleted
    }
  }

  await prisma.promotion.delete({ where: { id: promotionId } })

  revalidatePath(`/dashboard/apps/${promotion.appId}/promotions`)
  return { success: true }
}

// ─── Campaign Actions ─────────────────────────────────────────

export async function createCampaign(formData: FormData) {
  const userId = await requireUser()
  const appId = formData.get("appId") as string
  const name = formData.get("name") as string
  const title = (formData.get("title") as string) || "Switch & Save"
  const subtitle = (formData.get("subtitle") as string) || "Same features, lower price"
  const ctaText = (formData.get("ctaText") as string) || "Switch & Save"
  const discountPercent = formData.get("discountPercent")
    ? parseFloat(formData.get("discountPercent") as string)
    : null
  const promotionId = (formData.get("promotionId") as string) || null
  const audienceType = (formData.get("audienceType") as string) || "ALL_SUBSCRIBERS"
  const rolloutPercent = formData.get("rolloutPercent")
    ? parseInt(formData.get("rolloutPercent") as string, 10)
    : 100
  const startDate = formData.get("startDate")
    ? new Date(formData.get("startDate") as string)
    : null
  const endDate = formData.get("endDate")
    ? new Date(formData.get("endDate") as string)
    : null

  // Parse product mappings from JSON
  const mappingsJson = formData.get("mappings") as string
  const mappings: Array<{
    appleProductId: string
    appleProductName: string
    applePriceCents: number
    appleCurrency: string
    euroPayProductId: string
  }> = mappingsJson ? JSON.parse(mappingsJson) : []

  const app = await prisma.app.findUnique({ where: { id: appId } })
  if (!app || app.clerkUserId !== userId) throw new Error("Not found")

  if (!name) throw new Error("Campaign name is required")

  // Validate all euroPayProductIds belong to this app
  if (mappings.length > 0) {
    const productIds = mappings.map((m) => m.euroPayProductId)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, appId },
    })
    if (products.length !== productIds.length) {
      throw new Error("One or more EuroPay products not found")
    }
  }

  await prisma.migrationCampaign.create({
    data: {
      appId,
      name,
      title,
      subtitle,
      ctaText,
      discountPercent,
      promotionId,
      audienceType: audienceType as "ALL_SUBSCRIBERS" | "NEW_SESSIONS_ONLY" | "AFTER_N_DAYS",
      rolloutPercent,
      startDate,
      endDate,
      productMappings: {
        create: mappings.map((m) => ({
          appleProductId: m.appleProductId,
          appleProductName: m.appleProductName,
          applePriceCents: m.applePriceCents,
          appleCurrency: m.appleCurrency || "EUR",
          euroPayProductId: m.euroPayProductId,
        })),
      },
    },
  })

  revalidatePath(`/dashboard/apps/${appId}/campaigns`)
}

export async function updateCampaignStatus(
  campaignId: string,
  status: "ACTIVE" | "PAUSED" | "ENDED"
) {
  const userId = await requireUser()
  const campaign = await prisma.migrationCampaign.findUnique({
    where: { id: campaignId },
    include: { app: true, _count: { select: { productMappings: true } } },
  })
  if (!campaign || campaign.app.clerkUserId !== userId) throw new Error("Not found")

  // Activation requires at least one product mapping
  if (status === "ACTIVE" && campaign._count.productMappings === 0) {
    throw new Error("Cannot activate a campaign with no product mappings")
  }

  await prisma.migrationCampaign.update({
    where: { id: campaignId },
    data: { status },
  })

  revalidatePath(`/dashboard/apps/${campaign.appId}/campaigns`)
  return { success: true }
}

export async function deleteCampaign(campaignId: string) {
  const userId = await requireUser()
  const campaign = await prisma.migrationCampaign.findUnique({
    where: { id: campaignId },
    include: { app: true },
  })
  if (!campaign || campaign.app.clerkUserId !== userId) throw new Error("Not found")

  if (campaign.status === "ACTIVE") {
    throw new Error("Cannot delete an active campaign. End it first.")
  }

  // Delete migration events first (no onDelete: Cascade on MigrationEvent)
  await prisma.migrationEvent.deleteMany({ where: { campaignId } })
  await prisma.migrationCampaign.delete({ where: { id: campaignId } })

  revalidatePath(`/dashboard/apps/${campaign.appId}/campaigns`)
  return { success: true }
}

// ─── Retention Actions ───────────────────────────────────────

export async function saveRetentionConfig(formData: FormData) {
  const userId = await requireUser()
  const appId = formData.get("appId") as string
  const enabled = formData.get("enabled") === "true"
  const surveyQuestions = formData.get("surveyQuestions") as string
  const retentionOffers = formData.get("retentionOffers") as string

  const app = await prisma.app.findUnique({ where: { id: appId } })
  if (!app || app.clerkUserId !== userId) throw new Error("Not found")

  await prisma.retentionConfig.upsert({
    where: { appId },
    create: {
      appId,
      enabled,
      surveyQuestions: JSON.parse(surveyQuestions || "[]"),
      retentionOffers: JSON.parse(retentionOffers || "[]"),
    },
    update: {
      enabled,
      surveyQuestions: JSON.parse(surveyQuestions || "[]"),
      retentionOffers: JSON.parse(retentionOffers || "[]"),
    },
  })

  revalidatePath(`/dashboard/apps/${appId}/retention`)
  return { success: true }
}

// ─── Experiment Actions ──────────────────────────────────────

export async function createExperiment(formData: FormData) {
  const userId = await requireUser()
  const appId = formData.get("appId") as string
  const name = formData.get("name") as string
  const placement = formData.get("placement") as string
  const targetNewUsersOnly = formData.get("targetNewUsersOnly") === "true"
  const startDate = formData.get("startDate")
    ? new Date(formData.get("startDate") as string)
    : null
  const endDate = formData.get("endDate")
    ? new Date(formData.get("endDate") as string)
    : null
  const variantsJson = formData.get("variants") as string

  const app = await prisma.app.findUnique({ where: { id: appId } })
  if (!app || app.clerkUserId !== userId) throw new Error("Not found")
  if (!name) throw new Error("Experiment name is required")
  if (!placement) throw new Error("Placement is required")

  const variants: Array<{
    name: string
    allocationPercent: number
    config: Record<string, unknown>
  }> = variantsJson ? JSON.parse(variantsJson) : []

  if (variants.length < 2) throw new Error("At least 2 variants required")

  const totalAllocation = variants.reduce((s, v) => s + v.allocationPercent, 0)
  if (totalAllocation !== 100) throw new Error("Allocation percentages must sum to 100%")

  await prisma.experiment.create({
    data: {
      appId,
      name,
      placement,
      targetNewUsersOnly,
      startDate,
      endDate,
      variants: {
        create: variants.map((v) => ({
          name: v.name,
          allocationPercent: v.allocationPercent,
          config: v.config as object,
        })),
      },
    },
  })

  revalidatePath(`/dashboard/apps/${appId}/experiments`)
}

export async function updateExperimentStatus(
  experimentId: string,
  status: "RUNNING" | "PAUSED" | "COMPLETED"
) {
  const userId = await requireUser()
  const experiment = await prisma.experiment.findUnique({
    where: { id: experimentId },
    include: { app: true, _count: { select: { variants: true } } },
  })
  if (!experiment || experiment.app.clerkUserId !== userId) throw new Error("Not found")

  // Validate transitions
  const current = experiment.status
  const valid =
    (current === "DRAFT" && status === "RUNNING") ||
    (current === "RUNNING" && (status === "PAUSED" || status === "COMPLETED")) ||
    (current === "PAUSED" && (status === "RUNNING" || status === "COMPLETED"))

  if (!valid) throw new Error(`Cannot transition from ${current} to ${status}`)

  if (status === "RUNNING" && experiment._count.variants < 2) {
    throw new Error("Experiment requires at least 2 variants to run")
  }

  await prisma.experiment.update({
    where: { id: experimentId },
    data: { status },
  })

  revalidatePath(`/dashboard/apps/${experiment.appId}/experiments`)
  return { success: true }
}

export async function deleteExperiment(experimentId: string) {
  const userId = await requireUser()
  const experiment = await prisma.experiment.findUnique({
    where: { id: experimentId },
    include: { app: true },
  })
  if (!experiment || experiment.app.clerkUserId !== userId) throw new Error("Not found")

  if (experiment.status !== "DRAFT") {
    throw new Error("Can only delete DRAFT experiments")
  }

  await prisma.experiment.delete({ where: { id: experimentId } })

  revalidatePath(`/dashboard/apps/${experiment.appId}/experiments`)
  return { success: true }
}

// ─── GDPR Actions (continued) ────────────────────────────────

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

// ── Admin: Acknowledge alert ──────────────────────────────────
export async function acknowledgeAlert(alertId: string) {
  "use server"
  const { userId } = await auth()
  if (userId !== process.env.ADMIN_CLERK_USER_ID) throw new Error("Forbidden")

  await prisma.platformAlert.update({
    where: { id: alertId },
    data: { status: "ACKNOWLEDGED" },
  })

  revalidatePath("/admin/alerts")
  revalidatePath("/admin")
  return { success: true }
}

// ── Admin: Resolve alert ──────────────────────────────────────
export async function resolveAlert(alertId: string, note?: string) {
  "use server"
  const { userId } = await auth()
  if (userId !== process.env.ADMIN_CLERK_USER_ID) throw new Error("Forbidden")

  await prisma.platformAlert.update({
    where: { id: alertId },
    data: {
      status: "RESOLVED",
      resolvedAt: new Date(),
      resolvedBy: userId,
      resolvedNote: note ?? null,
    },
  })

  revalidatePath("/admin/alerts")
  revalidatePath("/admin")
  return { success: true }
}
