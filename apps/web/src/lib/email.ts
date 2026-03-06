// src/lib/email.ts
// Email sending via Resend + React Email templates
import { Resend } from "resend"
import PurchaseConfirmation from "@/emails/PurchaseConfirmation"
import WiderrufsrechtWaiver from "@/emails/WiderrufsrechtWaiver"
import CancellationConfirmation from "@/emails/CancellationConfirmation"
import WebhookFailureAlert from "@/emails/WebhookFailureAlert"
import DisputeAlert from "@/emails/DisputeAlert"
import DeveloperWelcome from "@/emails/DeveloperWelcome"

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "noreply@europay.dev"

/** Merchant context passed to all end-customer emails */
export interface MerchantContext {
  appName: string
  companyName?: string
  supportEmail?: string
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
}

export async function sendPurchaseConfirmation(
  params: PurchaseConfirmationParams
) {
  try {
    await resend.emails.send({
      from: `${params.appName} <${FROM_EMAIL}>`,
      to: params.to,
      subject: `Your receipt from ${params.appName}`,
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
  } catch (error) {
    console.error("[Email] Failed to send purchase confirmation:", error)
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
}

export async function sendWiderrufsrechtWaiver(
  params: WiderrufsrechtWaiverParams
) {
  try {
    await resend.emails.send({
      from: `${params.appName} <${FROM_EMAIL}>`,
      to: params.to,
      subject: `Withdrawal waiver confirmation — ${params.appName}`,
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
  } catch (error) {
    console.error("[Email] Failed to send Widerrufsrecht waiver:", error)
  }
}

// ── Cancellation Confirmation ─────────────────────────────────

export interface CancellationConfirmationParams extends MerchantContext {
  to: string
  customerName: string
  productName: string
  currentPeriodEnd: Date
}

export async function sendCancellationConfirmation(
  params: CancellationConfirmationParams
) {
  try {
    await resend.emails.send({
      from: `${params.appName} <${FROM_EMAIL}>`,
      to: params.to,
      subject: `Subscription cancelled — ${params.appName}`,
      react: CancellationConfirmation({
        customerName: params.customerName,
        productName: params.productName,
        currentPeriodEnd: params.currentPeriodEnd,
        appName: params.appName,
        companyName: params.companyName,
        supportEmail: params.supportEmail,
      }),
    })
  } catch (error) {
    console.error("[Email] Failed to send cancellation confirmation:", error)
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
}

export async function sendWebhookFailureAlert(
  params: WebhookFailureAlertParams
) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: `Your EuroPay webhook is failing — ${params.appName}`,
      react: WebhookFailureAlert({
        to: params.to,
        appName: params.appName,
        webhookUrl: params.webhookUrl,
        failureCount: params.failureCount,
        lastError: params.lastError,
        lastAttemptAt: params.lastAttemptAt,
      }),
    })
  } catch (error) {
    console.error("[Email] Failed to send webhook failure alert:", error)
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
}

export async function sendDisputeAlert(params: DisputeAlertParams) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: `Dispute opened on ${params.appName} — action required`,
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
  } catch (error) {
    console.error("[Email] Failed to send dispute alert:", error)
  }
}

// ── Developer Welcome ───────────────────────────────────────

export interface DeveloperWelcomeParams {
  to: string
  name: string
}

export async function sendDeveloperWelcome(params: DeveloperWelcomeParams) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: "Welcome to EuroPay",
      react: DeveloperWelcome({
        to: params.to,
        name: params.name,
      }),
    })
  } catch (error) {
    console.error("[Email] Failed to send developer welcome:", error)
  }
}
