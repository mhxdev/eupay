import { SignJWT, jwtVerify } from "jose"

const secret = new TextEncoder().encode(
  process.env.RETENTION_JWT_SECRET || process.env.NEXTAUTH_SECRET || "retention-secret-change-me"
)

export type RetentionTokenPayload = {
  appId: string
  customerId: string
  entitlementId: string
  stripeSubscriptionId: string
  externalUserId: string
}

export async function createRetentionToken(payload: RetentionTokenPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(secret)
}

export async function verifyRetentionToken(token: string): Promise<RetentionTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload as unknown as RetentionTokenPayload
  } catch {
    return null
  }
}
