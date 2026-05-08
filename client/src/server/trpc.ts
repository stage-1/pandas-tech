import { auth } from '@clerk/nextjs/server'
import { initTRPC, TRPCError } from '@trpc/server'
import { sql } from '@/lib/postgres'

export const createContext = async () => {
  try {
    const { userId } = await auth()
    console.log('[AUTH] createContext — userId:', userId ?? 'null (not authenticated)')
    return { userId }
  } catch (err) {
    console.error('[AUTH] createContext — auth() threw:', err)
    return { userId: null }
  }
}

const t = initTRPC.context<typeof createContext>().create()

export const router = t.router
export const publicProcedure = t.procedure

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.userId) throw new TRPCError({ code: 'UNAUTHORIZED' })

  return sql.begin(async (tx) => {
    await tx`SELECT set_config('app.user_id', ${ctx.userId!}, true)`
    return next({ ctx: { ...ctx, userId: ctx.userId!, db: tx } })
  })
})
