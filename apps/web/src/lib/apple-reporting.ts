import jwt from "jsonwebtoken"

type AppleApp = {
  appleKeyId: string
  appleIssuerId: string
  applePrivateKey: string
  appleBundleId: string
}

export function generateAppleJWT(app: AppleApp): string {
  const now = Math.floor(Date.now() / 1000)

  return jwt.sign(
    {
      iss: app.appleIssuerId,
      iat: now,
      exp: now + 3600,
      aud: "appstoreconnect-v1",
      bid: app.appleBundleId,
    },
    app.applePrivateKey,
    {
      algorithm: "ES256",
      header: {
        alg: "ES256",
        kid: app.appleKeyId,
        typ: "JWT",
      },
    }
  )
}

export async function reportTransaction(
  app: AppleApp,
  transactionId: string
): Promise<{ success: boolean; status?: number; error?: string }> {
  const token = generateAppleJWT(app)

  const isSandbox = process.env.APPLE_ENVIRONMENT === "sandbox"
  const baseUrl = isSandbox
    ? "https://api.storekit-sandbox.itunes.apple.com"
    : "https://api.storekit.itunes.apple.com"

  try {
    const res = await fetch(
      `${baseUrl}/externalPurchase/v1/transactions/null`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ transactionId }),
      }
    )

    if (!res.ok) {
      const text = await res.text().catch(() => "")
      return { success: false, status: res.status, error: text || `HTTP ${res.status}` }
    }

    return { success: true, status: res.status }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Network error",
    }
  }
}
