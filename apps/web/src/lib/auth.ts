// src/lib/auth.ts
import { NextRequest, NextResponse } from 'next/server'
import { createHash, randomBytes } from 'crypto'
import { prisma } from './prisma'

type AuthSuccess = {
  app: {
    id: string
    name: string
    bundleId: string
    clerkUserId: string
    paymentProvider: string
    stripeConnectId: string | null
    rootlineAccountId: string | null
    dmaEntitlementConfirmed: boolean
    platformFeePercent: number
    webhookUrl: string | null
    webhookSecret: string | null
    createdAt: Date
    updatedAt: Date
  }
  appId: string
}

type AuthError = {
  error: string
  status: number
}

export type AuthResult = AuthSuccess | AuthError

export function isAuthError(result: AuthResult): result is AuthError {
  return 'error' in result
}

/**
 * Authenticate an API request using Bearer token.
 *
 * 1. Extracts the key from the Authorization header.
 * 2. Computes SHA-256(key) and queries ApiKey.keyHash.
 * 3. Verifies isActive === true and the associated app exists.
 * 4. Returns { app, appId } on success.
 * 5. Updates lastUsedAt on the ApiKey record (non-blocking).
 */
export async function authenticateRequest(
  req: NextRequest
): Promise<AuthResult> {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: 'Missing or malformed API key. Use Authorization: Bearer <api_key>', status: 401 }
  }

  const rawKey = authHeader.slice(7)
  if (!rawKey) {
    return { error: 'Empty API key', status: 401 }
  }

  const keyHash = createHash('sha256').update(rawKey).digest('hex')

  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash },
    include: { app: true },
  })

  if (!apiKey || !apiKey.isActive) {
    return { error: 'Invalid or inactive API key', status: 401 }
  }

  // Non-blocking update of lastUsedAt
  prisma.apiKey
    .update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    })
    .catch(() => {})

  return { app: apiKey.app, appId: apiKey.appId }
}

/**
 * Helper to return a JSON error response from auth failure.
 */
export function authErrorResponse(result: AuthError): NextResponse {
  return NextResponse.json({ error: result.error }, { status: result.status })
}

/**
 * Generate a new API key.
 * Returns { raw, hash, prefix } — raw is shown ONCE to the developer and never stored.
 */
export function generateApiKey(type?: "test" | "live"): { raw: string; hash: string; prefix: string } {
  const typePrefix = type ? `${type}_` : ""
  const raw = `europay_${typePrefix}${randomBytes(32).toString('hex')}`
  const hash = createHash('sha256').update(raw).digest('hex')
  const prefix = raw.slice(0, 16)
  return { raw, hash, prefix }
}
