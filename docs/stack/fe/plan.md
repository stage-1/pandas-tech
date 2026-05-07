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

## Forms — Enter key convention
All forms that include custom selection UI (card pickers, toggle groups, radio-card grids) **must** handle Enter key at the form level so keyboard-only users can advance without tabbing to the submit button.

Pattern (add `onKeyDown` to the `<form>`):
```tsx
function handleKeyDown(e: React.KeyboardEvent<HTMLFormElement>) {
  if (e.key !== 'Enter') return
  const tag = (e.target as HTMLElement).tagName.toLowerCase()
  if (tag === 'input' || tag === 'textarea') return // already handled natively
  e.preventDefault()
  // call next() / submit() if canContinue
}
```
This applies to: wizard steps with card pickers, filter panels with toggle chips, any step where the primary interaction is clicking a card rather than typing in an input.
