// src/lib/email.ts
// Email sending via Resend + React Email templates
import { Resend } from "resend"
import PurchaseConfirmation from "@/emails/PurchaseConfirmation"
import WiderrufsrechtWaiver from "@/emails/WiderrufsrechtWaiver"
import CancellationConfirmation from "@/emails/CancellationConfirmation"
import RefundConfirmation from "@/emails/RefundConfirmation"
import RenewalReceipt from "@/emails/RenewalReceipt"
import PaymentFailed from "@/emails/PaymentFailed"
import WebhookFailureAlert from "@/emails/WebhookFailureAlert"
import DisputeAlert from "@/emails/DisputeAlert"
import DeveloperWelcome from "@/emails/DeveloperWelcome"
import { logAuditEvent } from "./audit"
import { createAlert } from "./alerts"

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "noreply@europay.dev"

/** Merchant context passed to all end-customer emails */
export interface MerchantContext {
  appName: string
  companyName?: string
  supportEmail?: string
}

// ── Audit context for email logging ──────────────────────────────

interface EmailAuditContext {
  appId?: string
  userId?: string
  resourceType?: string
  resourceId?: string
  template: string
  subject: string
  to: string
}

async function logEmailResult(
  result: { data: { id: string } | null; error: { message: string } | null },
  ctx: EmailAuditContext
) {
  await logAuditEvent({
    appId: ctx.appId,
    userId: ctx.userId,
    category: "email",
    action: result.error ? "failed" : "sent",
    resourceType: ctx.resourceType,
    resourceId: ctx.resourceId,
    details: {
      to: ctx.to,
      subject: ctx.subject,
      template: ctx.template,
      resendId: result.data?.id ?? null,
      error: result.error?.message ?? null,
    },
  })
}

// ── Purchase Confirmation ─────────────────────────────────────

export interface PurchaseConfirmationParams extends MerchantContext {
  to: string
  customerName: string
  productName: string
  amountTotal: number // cents, inc. VAT
  amountSubtotal: number // cents, pre-tax
  amountTax: number // cents
  vatRate: number // e.g. 0.19
  vatCountry: string // e.g. "DE"
  currency: string
  transactionId: string
  transactionDate: Date
  portalUrl: string
  isSubscription: boolean
  withdrawalWaived: boolean
  appId?: string
  userId?: string
}

export async function sendPurchaseConfirmation(
  params: PurchaseConfirmationParams
) {
  const subject = `Your receipt from ${params.appName}`
  try {
    const result = await resend.emails.send({
      from: `${params.appName} <${FROM_EMAIL}>`,
      to: params.to,
      subject,
      react: PurchaseConfirmation({
        customerName: params.customerName,
        productName: params.productName,
        amountTotal: params.amountTotal,
        amountSubtotal: params.amountSubtotal,
        amountTax: params.amountTax,
        vatRate: params.vatRate,
        vatCountry: params.vatCountry,
        currency: params.currency,
        transactionId: params.transactionId,
        transactionDate: params.transactionDate,
        portalUrl: params.portalUrl,
        isSubscription: params.isSubscription,
        withdrawalWaived: params.withdrawalWaived,
        appName: params.appName,
        companyName: params.companyName,
        supportEmail: params.supportEmail,
      }),
    })
    await logEmailResult(result, {
      appId: params.appId,
      userId: params.userId,
      resourceType: "transaction",
      resourceId: params.transactionId,
      template: "PurchaseConfirmation",
      subject,
      to: params.to,
    })
  } catch (error) {
    console.error("[Email] Failed to send purchase confirmation:", error)
    await logAuditEvent({
      appId: params.appId,
      userId: params.userId,
      category: "email",
      action: "failed",
      resourceType: "transaction",
      resourceId: params.transactionId,
      details: {
        to: params.to,
        subject,
        template: "PurchaseConfirmation",
        error: error instanceof Error ? error.message : "Unknown error",
      },
    })
    await createAlert({
      severity: "CRITICAL",
      category: "compliance",
      title: "Purchase confirmation email failed",
      description: `Transaction ${params.transactionId} for app "${params.appName}" — customer ${params.to} didn't receive legally required receipt. Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      appId: params.appId,
      developerUserId: params.userId,
      resourceType: "transaction",
      resourceId: params.transactionId,
    })
  }
}

// ── Widerrufsrecht Waiver Confirmation ────────────────────────

export interface WiderrufsrechtWaiverParams extends MerchantContext {
  to: string
  customerName: string
  productName: string
  transactionId: string
  transactionDate: Date
  amountTotal: number // cents
  currency: string
  appId?: string
  userId?: string
}

export async function sendWiderrufsrechtWaiver(
  params: WiderrufsrechtWaiverParams
) {
  const subject = `Withdrawal waiver confirmation — ${params.appName}`
  try {
    const result = await resend.emails.send({
      from: `${params.appName} <${FROM_EMAIL}>`,
      to: params.to,
      subject,
      react: WiderrufsrechtWaiver({
        customerName: params.customerName,
        productName: params.productName,
        transactionId: params.transactionId,
        transactionDate: params.transactionDate,
        amountTotal: params.amountTotal,
        currency: params.currency,
        appName: params.appName,
        companyName: params.companyName,
        supportEmail: params.supportEmail,
      }),
    })
    await logEmailResult(result, {
      appId: params.appId,
      userId: params.userId,
      resourceType: "transaction",
      resourceId: params.transactionId,
      template: "WiderrufsrechtWaiver",
      subject,
      to: params.to,
    })
  } catch (error) {
    console.error("[Email] Failed to send Widerrufsrecht waiver:", error)
    await logAuditEvent({
      appId: params.appId,
      userId: params.userId,
      category: "email",
      action: "failed",
      resourceType: "transaction",
      resourceId: params.transactionId,
      details: {
        to: params.to,
        subject,
        template: "WiderrufsrechtWaiver",
        error: error instanceof Error ? error.message : "Unknown error",
      },
    })
    await createAlert({
      severity: "CRITICAL",
      category: "compliance",
      title: "Widerrufsrecht email failed to send",
      description: `Transaction ${params.transactionId} for app "${params.appName}" — customer ${params.to} didn't receive legally required withdrawal waiver email. Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      appId: params.appId,
      developerUserId: params.userId,
      resourceType: "transaction",
      resourceId: params.transactionId,
    })

    // ONE retry after 30 seconds for legally required email
    setTimeout(async () => {
      try {
        await resend.emails.send({
          from: `${params.appName} <${FROM_EMAIL}>`,
          to: params.to,
          subject,
          react: WiderrufsrechtWaiver({
            customerName: params.customerName,
            productName: params.productName,
            transactionId: params.transactionId,
            transactionDate: params.transactionDate,
            amountTotal: params.amountTotal,
            currency: params.currency,
            appName: params.appName,
            companyName: params.companyName,
            supportEmail: params.supportEmail,
          }),
        })
        await logAuditEvent({
          appId: params.appId,
          userId: params.userId,
          category: "email",
          action: "sent_retry",
          resourceType: "transaction",
          resourceId: params.transactionId,
          details: { to: params.to, subject, template: "WiderrufsrechtWaiver" },
        })
      } catch (retryError) {
        await logAuditEvent({
          appId: params.appId,
          userId: params.userId,
          category: "email",
          action: "retry_failed",
          resourceType: "transaction",
          resourceId: params.transactionId,
          details: { to: params.to, subject, template: "WiderrufsrechtWaiver", error: retryError instanceof Error ? retryError.message : "Unknown" },
        })
      }
    }, 30000)
  }
}

// ── Cancellation Confirmation ─────────────────────────────────

export interface CancellationConfirmationParams extends MerchantContext {
  to: string
  customerName: string
  productName: string
  currentPeriodEnd: Date
  appId?: string
  userId?: string
  entitlementId?: string
}

export async function sendCancellationConfirmation(
  params: CancellationConfirmationParams
) {
  const subject = `Subscription cancelled — ${params.appName}`
  try {
    const result = await resend.emails.send({
      from: `${params.appName} <${FROM_EMAIL}>`,
      to: params.to,
      subject,
      react: CancellationConfirmation({
        customerName: params.customerName,
        productName: params.productName,
        currentPeriodEnd: params.currentPeriodEnd,
        appName: params.appName,
        companyName: params.companyName,
        supportEmail: params.supportEmail,
      }),
    })
    await logEmailResult(result, {
      appId: params.appId,
      userId: params.userId,
      resourceType: "entitlement",
      resourceId: params.entitlementId,
      template: "CancellationConfirmation",
      subject,
      to: params.to,
    })
  } catch (error) {
    console.error("[Email] Failed to send cancellation confirmation:", error)
    await logAuditEvent({
      appId: params.appId,
      userId: params.userId,
      category: "email",
      action: "failed",
      resourceType: "entitlement",
      resourceId: params.entitlementId,
      details: {
        to: params.to,
        subject,
        template: "CancellationConfirmation",
        error: error instanceof Error ? error.message : "Unknown error",
      },
    })
  }
}

// ── Refund Confirmation ──────────────────────────────────────

export interface RefundConfirmationParams extends MerchantContext {
  to: string
  productName: string
  amountCents: number
  currency: string
  transactionId: string
  refundedAt: Date
  appId?: string
  userId?: string
}

export async function sendRefundConfirmation(
  params: RefundConfirmationParams
) {
  const subject = `Refund confirmation — ${params.appName}`
  try {
    const result = await resend.emails.send({
      from: `${params.appName} <${FROM_EMAIL}>`,
      to: params.to,
      subject,
      react: RefundConfirmation({
        appName: params.appName,
        companyName: params.companyName,
        supportEmail: params.supportEmail,
        customerEmail: params.to,
        productName: params.productName,
        amountCents: params.amountCents,
        currency: params.currency,
        transactionId: params.transactionId,
        refundedAt: params.refundedAt,
      }),
    })
    await logEmailResult(result, {
      appId: params.appId,
      userId: params.userId,
      resourceType: "transaction",
      resourceId: params.transactionId,
      template: "RefundConfirmation",
      subject,
      to: params.to,
    })
  } catch (error) {
    console.error("[Email] Failed to send refund confirmation:", error)
    await logAuditEvent({
      appId: params.appId,
      userId: params.userId,
      category: "email",
      action: "failed",
      resourceType: "transaction",
      resourceId: params.transactionId,
      details: {
        to: params.to,
        subject,
        template: "RefundConfirmation",
        error: error instanceof Error ? error.message : "Unknown error",
      },
    })
  }
}

// ── Renewal Receipt ─────────────────────────────────────────

export interface RenewalReceiptParams extends MerchantContext {
  to: string
  productName: string
  amountCents: number
  currency: string
  transactionId: string
  renewedAt: Date
  nextRenewalDate?: Date
  appId?: string
  userId?: string
}

export async function sendRenewalReceipt(
  params: RenewalReceiptParams
) {
  const subject = `Subscription renewed — ${params.appName}`
  try {
    const result = await resend.emails.send({
      from: `${params.appName} <${FROM_EMAIL}>`,
      to: params.to,
      subject,
      react: RenewalReceipt({
        appName: params.appName,
        companyName: params.companyName,
        supportEmail: params.supportEmail,
        customerEmail: params.to,
        productName: params.productName,
        amountCents: params.amountCents,
        currency: params.currency,
        transactionId: params.transactionId,
        renewedAt: params.renewedAt,
        nextRenewalDate: params.nextRenewalDate,
      }),
    })
    await logEmailResult(result, {
      appId: params.appId,
      userId: params.userId,
      resourceType: "transaction",
      resourceId: params.transactionId,
      template: "RenewalReceipt",
      subject,
      to: params.to,
    })
  } catch (error) {
    console.error("[Email] Failed to send renewal receipt:", error)
    await logAuditEvent({
      appId: params.appId,
      userId: params.userId,
      category: "email",
      action: "failed",
      resourceType: "transaction",
      resourceId: params.transactionId,
      details: {
        to: params.to,
        subject,
        template: "RenewalReceipt",
        error: error instanceof Error ? error.message : "Unknown error",
      },
    })
  }
}

// ── Payment Failed ──────────────────────────────────────────

export interface PaymentFailedParams extends MerchantContext {
  to: string
  productName: string
  amountCents: number
  currency: string
  failedAt: Date
  appId?: string
  userId?: string
  entitlementId?: string
}

export async function sendPaymentFailed(
  params: PaymentFailedParams
) {
  const subject = `Payment failed — ${params.appName}`
  try {
    const result = await resend.emails.send({
      from: `${params.appName} <${FROM_EMAIL}>`,
      to: params.to,
      subject,
      react: PaymentFailed({
        appName: params.appName,
        companyName: params.companyName,
        supportEmail: params.supportEmail,
        customerEmail: params.to,
        productName: params.productName,
        amountCents: params.amountCents,
        currency: params.currency,
        failedAt: params.failedAt,
      }),
    })
    await logEmailResult(result, {
      appId: params.appId,
      userId: params.userId,
      resourceType: "entitlement",
      resourceId: params.entitlementId,
      template: "PaymentFailed",
      subject,
      to: params.to,
    })
  } catch (error) {
    console.error("[Email] Failed to send payment failed email:", error)
    await logAuditEvent({
      appId: params.appId,
      userId: params.userId,
      category: "email",
      action: "failed",
      resourceType: "entitlement",
      resourceId: params.entitlementId,
      details: {
        to: params.to,
        subject,
        template: "PaymentFailed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
    })
  }
}

// ── Webhook Failure Alert ───────────────────────────────────

export interface WebhookFailureAlertParams {
  to: string
  appName: string
  webhookUrl: string
  failureCount: number
  lastError: string
  lastAttemptAt: Date
  appId?: string
}

export async function sendWebhookFailureAlert(
  params: WebhookFailureAlertParams
) {
  const subject = `Your EuroPay webhook is failing — ${params.appName}`
  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject,
      react: WebhookFailureAlert({
        to: params.to,
        appName: params.appName,
        webhookUrl: params.webhookUrl,
        failureCount: params.failureCount,
        lastError: params.lastError,
        lastAttemptAt: params.lastAttemptAt,
      }),
    })
    await logEmailResult(result, {
      appId: params.appId,
      template: "WebhookFailureAlert",
      subject,
      to: params.to,
    })
  } catch (error) {
    console.error("[Email] Failed to send webhook failure alert:", error)
    await logAuditEvent({
      appId: params.appId,
      category: "email",
      action: "failed",
      details: {
        to: params.to,
        subject,
        template: "WebhookFailureAlert",
        error: error instanceof Error ? error.message : "Unknown error",
      },
    })
  }
}

// ── Dispute Alert ───────────────────────────────────────────

export interface DisputeAlertParams {
  to: string
  appName: string
  amount: number
  currency: string
  reason: string
  disputeId: string
  transactionId: string
  appId?: string
}

export async function sendDisputeAlert(params: DisputeAlertParams) {
  const subject = `Dispute opened on ${params.appName} — action required`
  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject,
      react: DisputeAlert({
        to: params.to,
        appName: params.appName,
        amount: params.amount,
        currency: params.currency,
        reason: params.reason,
        disputeId: params.disputeId,
        transactionId: params.transactionId,
      }),
    })
    await logEmailResult(result, {
      appId: params.appId,
      resourceType: "transaction",
      resourceId: params.transactionId,
      template: "DisputeAlert",
      subject,
      to: params.to,
    })
  } catch (error) {
    console.error("[Email] Failed to send dispute alert:", error)
    await logAuditEvent({
      appId: params.appId,
      category: "email",
      action: "failed",
      resourceType: "transaction",
      resourceId: params.transactionId,
      details: {
        to: params.to,
        subject,
        template: "DisputeAlert",
        error: error instanceof Error ? error.message : "Unknown error",
      },
    })
  }
}

// ── Developer Welcome ───────────────────────────────────────

export interface DeveloperWelcomeParams {
  to: string
  name: string
  appId?: string
  userId?: string
}

export async function sendDeveloperWelcome(params: DeveloperWelcomeParams) {
  const subject = "Welcome to EuroPay"
  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject,
      react: DeveloperWelcome({
        to: params.to,
        name: params.name,
      }),
    })
    await logEmailResult(result, {
      appId: params.appId,
      userId: params.userId,
      template: "DeveloperWelcome",
      subject,
      to: params.to,
    })
  } catch (error) {
    console.error("[Email] Failed to send developer welcome:", error)
    await logAuditEvent({
      appId: params.appId,
      userId: params.userId,
      category: "email",
      action: "failed",
      details: {
        to: params.to,
        subject,
        template: "DeveloperWelcome",
        error: error instanceof Error ? error.message : "Unknown error",
      },
    })
  }
}
