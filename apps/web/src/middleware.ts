import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import {
  apiRateLimit,
  checkoutRateLimit,
  webhookRateLimit,
  publicRateLimit,
  telemetryRateLimit,
} from '@/lib/rate-limit'

// Dashboard and admin routes require authentication
const isProtectedRoute = createRouteMatcher(['/dashboard(.*)', '/onboarding(.*)', '/admin(.*)'])

// Routes allowed through during maintenance mode
const isMaintenanceAllowed = createRouteMatcher([
  '/coming-soon',
  '/api/health',
  '/_next(.*)',
  '/favicon.ico',
])

function getApiKey(request: NextRequest): string | null {
  const apiKey = request.headers.get('x-api-key')
  if (apiKey) return apiKey

  const auth = request.headers.get('authorization')
  if (auth?.startsWith('Bearer ')) return auth.slice(7)

  return null
}

function getIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'anonymous'
  )
}

function rateLimitHeaders(limit: number, remaining: number, reset: number) {
  return {
    'X-RateLimit-Limit': String(limit),
    'X-RateLimit-Remaining': String(remaining),
    'X-RateLimit-Reset': String(reset),
  }
}

async function handleApiRateLimit(req: NextRequest): Promise<NextResponse> {
  const { pathname } = req.nextUrl
  const apiKey = getApiKey(req)
  const ip = getIP(req)

  let limiter
  let identifier

  if (pathname.startsWith('/api/v1/webhooks/stripe') || pathname.startsWith('/api/v2/webhooks/stripe')) {
    limiter = webhookRateLimit
    identifier = `ip:${ip}`
  } else if (pathname.startsWith('/api/v1/checkout/create') || pathname.startsWith('/api/v2/checkout')) {
    limiter = checkoutRateLimit
    identifier = apiKey ? `key:${apiKey}` : `ip:${ip}`
  } else if (pathname.startsWith('/api/v2/events')) {
    limiter = telemetryRateLimit
    identifier = apiKey ? `key:${apiKey}` : `ip:${ip}`
  } else if (pathname.startsWith('/api/v1/compliance') || pathname.startsWith('/api/v1/regulatory')) {
    limiter = publicRateLimit
    identifier = apiKey ? `key:${apiKey}` : `ip:${ip}`
  } else {
    limiter = apiRateLimit
    identifier = apiKey ? `key:${apiKey}` : `ip:${ip}`
  }

  // If Upstash is not configured, limiters are null — skip rate limiting
  if (!limiter) return NextResponse.next()

  try {
    const { success, limit, remaining, reset } = await limiter.limit(identifier)

    if (!success) {
      const retryAfter = Math.ceil((reset - Date.now()) / 1000)
      return NextResponse.json(
        {
          error: 'rate_limit_exceeded',
          message: 'Too many requests. Please try again later.',
          retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfter),
            ...rateLimitHeaders(limit, remaining, reset),
          },
        }
      )
    }

    const response = NextResponse.next()
    const headers = rateLimitHeaders(limit, remaining, reset)
    for (const [key, val] of Object.entries(headers)) {
      response.headers.set(key, val)
    }
    return response
  } catch (error) {
    // If rate limiting fails (e.g. Redis down), let the request through
    console.error('[RateLimit] Error:', error)
    return NextResponse.next()
  }
}

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl

  // Rate limit API v1 routes (these use their own API key auth, not Clerk)
  if (pathname.startsWith('/api/v1/') || pathname.startsWith('/api/v2/')) {
    return await handleApiRateLimit(req)
  }

  // Maintenance mode: redirect everything except allowed routes
  if (process.env.MAINTENANCE_MODE === 'true') {
    if (!isMaintenanceAllowed(req)) {
      return NextResponse.redirect(new URL('/coming-soon', req.url))
    }
    return NextResponse.next()
  }

  // Normal mode: protect dashboard and admin routes
  if (isProtectedRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and static files only
    // API v1 routes are now included so rate limiting runs on them
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
  ],
}
