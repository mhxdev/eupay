import { NextRequest } from "next/server"
import { prisma } from "./prisma"
import crypto from "crypto"

export interface V2AuthContext {
  app: {
    id: string
    name: string
    bundleId: string
    stripeConnectId: string | null
    mode: string
    platformFeePercent: number
    sendCustomerEmails: boolean
    companyName: string | null
    supportEmail: string | null
    returnUrlScheme: string | null
    appleKeyId: string | null
    appleIssuerId: string | null
    applePrivateKey: string | null
    appleBundleId: string | null
    webhookUrl: string | null
    webhookSecret: string | null
    webhookVersion: string
    clerkUserId: string
  }
  apiKey: {
    id: string
    keyType: string
  }
  requestId: string
}

export interface V2AuthError {
  error: { code: string; message: string }
  meta: { requestId: string }
  status: number
}

export function isV2AuthError(result: V2AuthContext | V2AuthError): result is V2AuthError {
  return "error" in result && "status" in result
}

export async function authenticateV2(req: NextRequest): Promise<V2AuthContext | V2AuthError> {
  const requestId = `req_${crypto.randomUUID().replace(/-/g, "").slice(0, 24)}`

  const authHeader = req.headers.get("authorization")
  const xApiKey = req.headers.get("x-api-key")
  const rawKey = xApiKey || (authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null)

  if (!rawKey || !rawKey.startsWith("europay_")) {
    return {
      error: { code: "invalid_api_key", message: "Missing or invalid API key. Include your key in the Authorization header: Bearer europay_..." },
      meta: { requestId },
      status: 401,
    }
  }

  const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex")
  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash },
    include: { app: true },
  })

  if (!apiKey || !apiKey.isActive) {
    return {
      error: { code: "invalid_api_key", message: "API key not found or has been revoked." },
      meta: { requestId },
      status: 401,
    }
  }

  const keyType = apiKey.keyType || "test"
  if (keyType === "live" && apiKey.app.mode !== "live") {
    return {
      error: { code: "mode_mismatch", message: "This is a live API key but the app is in sandbox mode. Use your test key for development." },
      meta: { requestId },
      status: 403,
    }
  }
  if (keyType === "test" && apiKey.app.mode === "live") {
    return {
      error: { code: "mode_mismatch", message: "This is a test API key and cannot be used in production. Generate your live key at europay.dev/dashboard." },
      meta: { requestId },
      status: 403,
    }
  }

  prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() },
  }).catch(() => {})

  return {
    app: {
      id: apiKey.app.id,
      name: apiKey.app.name,
      bundleId: apiKey.app.bundleId,
      stripeConnectId: apiKey.app.stripeConnectId,
      mode: apiKey.app.mode,
      platformFeePercent: apiKey.app.platformFeePercent,
      sendCustomerEmails: apiKey.app.sendCustomerEmails,
      companyName: apiKey.app.companyName,
      supportEmail: apiKey.app.supportEmail,
      returnUrlScheme: apiKey.app.returnUrlScheme,
      appleKeyId: apiKey.app.appleKeyId,
      appleIssuerId: apiKey.app.appleIssuerId,
      applePrivateKey: apiKey.app.applePrivateKey,
      appleBundleId: apiKey.app.appleBundleId,
      webhookUrl: apiKey.app.webhookUrl,
      webhookSecret: apiKey.app.webhookSecret,
      webhookVersion: apiKey.app.webhookVersion,
      clerkUserId: apiKey.app.clerkUserId,
    },
    apiKey: { id: apiKey.id, keyType },
    requestId,
  }
}
