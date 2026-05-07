'use client'
import { useState } from 'react'
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query'
import { httpBatchLink } from '@trpc/client'
import { TRPCClientError } from '@trpc/client'
import { trpc } from '@/lib/trpc'

function isAuthError(err: unknown): boolean {
  if (!(err instanceof TRPCClientError)) return false
  return err.data?.code === 'UNAUTHORIZED'
}

function forceSignOut() {
  const clerk = (window as any).Clerk
  // Clerk's client-side session is still active → this is a transient tRPC error, not a real sign-out.
  // Clerk's own polling will handle genuine session expiry; the middleware handles route protection.
  if (clerk?.user) {
    console.warn('[AUTH] UNAUTHORIZED from tRPC but Clerk session still active — skipping sign-out')
    return
  }
  console.warn('[AUTH] Stale or invalid session detected — signing out')
  const p = clerk?.signOut?.()
  const redirect = () => window.location.replace('/sign-in')
  p ? p.then(redirect).catch(redirect) : redirect()
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    queryCache: new QueryCache({
      onError: (err) => { if (isAuthError(err)) forceSignOut() },
    }),
    mutationCache: new MutationCache({
      onError: (err) => { if (isAuthError(err)) forceSignOut() },
    }),
  }))

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [httpBatchLink({ url: '/api/trpc' })],
    })
  )
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  )
}
