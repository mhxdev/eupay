import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Dashboard and admin routes require authentication
const isProtectedRoute = createRouteMatcher(['/dashboard(.*)', '/onboarding(.*)', '/admin(.*)'])

export default clerkMiddleware(async (auth, req) => {
  // Protect dashboard and admin routes
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
