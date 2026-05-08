import { z } from 'zod'
import { router, protectedProcedure } from '../trpc'

export const usersRouter = router({
  me: protectedProcedure.query(async ({ ctx }) => {
    const [row] = await ctx.db`
      SELECT * FROM public.users WHERE id = ${ctx.userId}
    `
    return row ?? null
  }),

  upsert: protectedProcedure
    .input(z.object({
      full_name: z.string().min(2).max(120),
    }))
    .mutation(async ({ ctx, input }) => {
      const [row] = await ctx.db`
        INSERT INTO public.users (id, full_name)
        VALUES (${ctx.userId}, ${input.full_name})
        ON CONFLICT (id) DO UPDATE
          SET full_name  = EXCLUDED.full_name,
              updated_at = now()
        RETURNING *
      `
      return row ?? null
    }),
})
