import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// Dashboard and admin routes require authentication
const isProtectedRoute = createRouteMatcher(['/dashboard(.*)', '/onboarding(.*)', '/admin(.*)'])

// Routes allowed through during maintenance mode
const isMaintenanceAllowed = createRouteMatcher([
  '/coming-soon',
  '/api/health',
  '/_next(.*)',
  '/favicon.ico',
])

export default clerkMiddleware(async (auth, req) => {
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
    // Skip Next.js internals, static files, and API v1 routes
    // API v1 routes use their own API key auth, not Clerk
    '/((?!_next|api/v1|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
  ],
}
