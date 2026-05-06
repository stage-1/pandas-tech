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
