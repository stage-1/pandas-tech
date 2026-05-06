# Frontend

## Stack (installed)
Next.js 15 App Router · React 19 · Tailwind v4 · shadcn/ui · Lucide · next-themes
Design tokens: `v1Pandas.css` — do not edit by hand, run `npm run build:tokens`.

## Data
tRPC hooks only. No Supabase client, no raw fetch().
- Reads: `trpc.<router>.<proc>.useQuery()`
- Writes: `trpc.<router>.<proc>.useMutation()`
- Public routes (no auth): `publicProcedure`
- Auth-gated routes: `protectedProcedure` (RLS enforced in DB)

## Auth UI
Clerk: `<SignIn />` · `<SignUp />` · `useUser()` · `<UserButton />`

## Pages
| Route | Render | Notes |
|---|---|---|
| `/board` | Client | Kanban — dnd-kit (ssr:false) |
| `/ro/[id]` | Client | RO builder + line items |
| `/approval/[token]` | Server | No auth — customer-facing |
| `/sign-in` `/sign-up` | Client | Clerk embedded |

## Dynamic imports (browser-only APIs)
```ts
const Board = dynamic(() => import('@/components/Board'), { ssr: false })
const InvoicePDF = dynamic(() => import('@/components/InvoicePDF'), { ssr: false })
```

## Realtime
No live updates in MVP. Invalidate React Query cache on mutation for optimistic UI.
