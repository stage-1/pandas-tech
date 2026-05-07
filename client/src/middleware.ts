import {
  clerkMiddleware,
  createRouteMatcher,
  type ClerkMiddlewareOptions,
} from '@clerk/nextjs/server'

// Protect only routes that require auth — not "everything minus a few allowlists".
// Otherwise Clerk's dev-browser handshake hits internal paths like /clerk_<id>
// without the __clerk_db_jwt cookie, auth.protect() runs again there, rewrite
// resolves to a 404 and the viewport stays blank (see x-clerk-auth-reason).
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/onboard(.*)',
  '/customers(.*)',
  '/settings(.*)',
  '/api/trpc(.*)',
])

/**
 * Widen JWT nbf/exp verification window for dev (`pk_test_`) machines whose clock lags Clerk.
 * Avoids handshake refresh loops (“infinite redirect loop”) when tokens are briefly “not active yet”.
 * Production `pk_live_` keeps Clerk’s default (~5s) unless CLERK_JWT_CLOCK_SKEW_MS is set.
 */
function clerkMiddlewareOptions(): ClerkMiddlewareOptions {
  const fromEnv = process.env.CLERK_JWT_CLOCK_SKEW_MS
  if (fromEnv !== undefined && fromEnv !== '') {
    const n = Number(fromEnv)
    if (Number.isFinite(n) && n > 0) return { clockSkewInMs: n }
  }
  const pk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? ''
  if (pk.startsWith('pk_test_')) {
    return { clockSkewInMs: 120_000 }
  }
  return {}
}

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) await auth.protect()
}, clerkMiddlewareOptions())

export const config = {
  matcher: [
    // Skip Next internals and static files unless requested via search params (Clerk / Next pattern)
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
