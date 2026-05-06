# Auth Plan — Clerk + tRPC + Supabase Postgres

## Context

Supabase GoTrue (auth.uid(), auth.users) is replaced by Clerk. Supabase Postgres and Storage remain unchanged. The DB uses `current_setting('app.user_id', true)` for RLS — set per-transaction by the tRPC `protectedProcedure` middleware.

Stack:
- **Clerk** — auth provider (SOC 2 Type II)
- **postgres.js** — direct DB client (transaction pooler)
- **tRPC** — API layer; sets `app.user_id` before every protected query
- **svix** — Clerk webhook signature verification

---

## Install

```bash
cd client
npm install @clerk/nextjs svix postgres
npm install @trpc/server @trpc/client @trpc/react-query @tanstack/react-query zod
# do NOT install @trpc/next — Pages Router only, not needed for App Router
```

---

## Environment — `client/.env.local`

```
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
CLERK_WEBHOOK_SECRET=whsec_...

# Clerk redirect paths (embedded components)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Supabase — transaction mode pooler (port 6543, required for Vercel serverless)
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
```

---

## Files to create / modify

### `client/middleware.ts`

```ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/approval/(.*)',        // public customer approval links
  '/api/webhooks/(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) await auth.protect()
})

export const config = {
  matcher: ['/((?!_next|.*\\..*).*)'],
}
```

---

### `client/src/lib/postgres.ts`

```ts
import postgres from 'postgres'

export const sql = postgres(process.env.DATABASE_URL!, {
  max: 1,            // serverless: 1 connection per lambda
  idle_timeout: 20,
  connect_timeout: 10,
})
```

> Port **6543** = Supabase transaction pooler. Required for Vercel (stateless functions can't hold session-mode connections). `max: 1` because each lambda manages its own pool.

---

### `client/src/server/trpc.ts`

```ts
import { auth } from '@clerk/nextjs/server'
import { initTRPC, TRPCError } from '@trpc/server'
import { sql } from '@/lib/postgres'

export const createContext = async () => {
  const { userId } = await auth()
  return { userId }
}

const t = initTRPC.context<typeof createContext>().create()

export const router = t.router
export const publicProcedure = t.procedure

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.userId) throw new TRPCError({ code: 'UNAUTHORIZED' })

  // Open a transaction, set app.user_id (LOCAL = transaction-scoped, pool-safe).
  // sql.begin() auto-commits on resolve, auto-rollbacks on throw.
  return sql.begin(async (tx) => {
    await tx`SELECT set_config('app.user_id', ${ctx.userId!}, true)`
    return next({ ctx: { ...ctx, userId: ctx.userId!, db: tx } })
  })
})
```

---

### `client/src/server/routers/_app.ts`

```ts
import { router } from '../trpc'
import { shopsRouter } from './shops'
// import more routers as they're built

export const appRouter = router({
  shops: shopsRouter,
})

export type AppRouter = typeof appRouter
```

### `client/src/server/routers/shops.ts` (example)

```ts
import { z } from 'zod'
import { router, protectedProcedure } from '../trpc'

export const shopsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db`SELECT * FROM public.shops`
  }),

  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      country_code: z.enum(['CO', 'MX', 'CL', 'US']),
    }))
    .mutation(async ({ ctx, input }) => {
      const [shop] = await ctx.db`
        SELECT * FROM public.create_shop_for_owner(${input.name}, ${input.country_code})
      `
      return shop
    }),
})
```

---

### `client/src/app/api/trpc/[trpc]/route.ts`

```ts
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { createContext } from '@/server/trpc'
import { appRouter } from '@/server/routers/_app'

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext,
  })

export { handler as GET, handler as POST }
```

---

### `client/src/lib/trpc.ts`

```ts
import { createTRPCReact } from '@trpc/react-query'
import type { AppRouter } from '@/server/routers/_app'

export const trpc = createTRPCReact<AppRouter>()
```

---

### `client/src/app/providers.tsx`

```tsx
'use client'
import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink } from '@trpc/client'
import { trpc } from '@/lib/trpc'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())
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
```

---

### `client/src/app/layout.tsx` — update

```tsx
import { ClerkProvider } from '@clerk/nextjs'
import { Providers } from './providers'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="es">
        <body>
          <Providers>{children}</Providers>
        </body>
      </html>
    </ClerkProvider>
  )
}
```

---

### `client/src/app/sign-in/[[...sign-in]]/page.tsx`

```tsx
import { SignIn } from '@clerk/nextjs'
export default function Page() { return <SignIn /> }
```

### `client/src/app/sign-up/[[...sign-up]]/page.tsx`

```tsx
import { SignUp } from '@clerk/nextjs'
export default function Page() { return <SignUp /> }
```

---

### `client/src/app/api/webhooks/clerk/route.ts`

Syncs Clerk user events into `public.users` (replaces the removed `handle_new_user` trigger).

```ts
import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { sql } from '@/lib/postgres'

export async function POST(req: Request) {
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!)
  const payload = await req.text()
  const hdrs = Object.fromEntries((await headers()).entries())

  let event: any
  try {
    event = wh.verify(payload, hdrs)
  } catch {
    return new Response('Invalid signature', { status: 400 })
  }

  const { id, email_addresses, first_name, last_name, image_url } = event.data
  const email = email_addresses?.[0]?.email_address ?? null
  const full_name = [first_name, last_name].filter(Boolean).join(' ') || null

  if (event.type === 'user.created' || event.type === 'user.updated') {
    await sql`
      INSERT INTO public.users (id, email, full_name, avatar_url)
      VALUES (${id}, ${email}, ${full_name}, ${image_url ?? null})
      ON CONFLICT (id) DO UPDATE
        SET email      = EXCLUDED.email,
            full_name  = EXCLUDED.full_name,
            avatar_url = EXCLUDED.avatar_url,
            updated_at = now()
    `
  }

  if (event.type === 'user.deleted') {
    await sql`DELETE FROM public.users WHERE id = ${id}`
  }

  return new Response('OK')
}
```

**Clerk Dashboard setup:**
- Webhooks → Add endpoint: `https://your-domain.com/api/webhooks/clerk`
- Subscribe to: `user.created`, `user.updated`, `user.deleted`
- Copy the signing secret → `CLERK_WEBHOOK_SECRET`

---

## Data flow

```
Browser
  → Clerk session cookie (via ClerkProvider)
  → tRPC call → /api/trpc/<router>.<procedure>
  → createContext() reads userId from Clerk
  → protectedProcedure opens postgres.js transaction
  → SET LOCAL app.user_id = userId   (via set_config)
  → SQL query executes; RLS filters by shop membership
  → transaction commits; typed response returned
```

---

## Deferred (add later, no schema changes needed)

| Feature | When | Notes |
|---|---|---|
| Clerk Organizations | Multi-location shops | Maps to `shop_memberships`; skip MVP |
| `publicMetadata.shop_role` | Avoid per-request DB lookup | Store role in Clerk token; skip MVP |
| Supabase Realtime | Live kanban updates | Can coexist with Clerk auth via anon key; add post-MVP |

---

## Verification

1. `npm run dev` — no console errors
2. Sign up → check `public.users` row created (webhook fired)
3. Sign in → `/dashboard` accessible; `/approval/[token]` accessible without auth
4. `shops.list` tRPC call → only returns authenticated user's shops (RLS)
5. `shops.create` tRPC call → shop created + user added as owner
6. Sign out → redirected to `/sign-in`
7. Two test users → each sees only their own shops (RLS isolation)
