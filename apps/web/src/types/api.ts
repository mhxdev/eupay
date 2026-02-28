// src/types/api.ts

export interface CheckoutSessionResponse {
  sessionId: string
  checkoutUrl: string
  expiresAt: string
}

export interface EntitlementsResponse {
  userId: string
  entitlements: EntitlementDTO[]
}

export interface EntitlementDTO {
  id: string
  productId: string
  appStoreProductId: string | null
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PAUSED'
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
}

export interface ProductDTO {
  id: string
  name: string
  description: string | null
  productType: 'ONE_TIME' | 'SUBSCRIPTION'
  appStoreProductId: string | null
  amountCents: number
  currency: string
  interval: string | null
  intervalCount: number | null
  trialDays: number
}

export interface PortalResponse {
  url: string
}

export interface ApiError {
  error: string
  code?: string
}
