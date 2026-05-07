import { z } from 'zod'
import { router, protectedProcedure } from '../trpc'

export const shopsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db`SELECT * FROM public.shops`
  }),

  mine: protectedProcedure.query(async ({ ctx }) => {
    const [row] = await ctx.db`
      SELECT s.* FROM public.shops s
      JOIN public.shop_memberships m ON m.shop_id = s.id
      WHERE m.user_id = ${ctx.userId}
      LIMIT 1
    `
    return row ?? null
  }),

  create: protectedProcedure
    .input(z.object({
      name:         z.string().min(2).max(120),
      country_code: z.enum(['CO', 'MX', 'CL', 'US']),
      tax_id:       z.string().max(30).optional(),
      tax_id_type:  z.string().max(20).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      console.log('[SHOP_CREATE] Starting for userId:', ctx.userId, 'input:', input)
      try {
        // Ensure user row exists (email now nullable — webhook fills it in production).
        await ctx.db`
          INSERT INTO public.users (id) VALUES (${ctx.userId})
          ON CONFLICT (id) DO NOTHING
        `
        console.log('[SHOP_CREATE] User upsert done')

        const [shop] = await ctx.db`
          SELECT * FROM public.create_shop_for_owner(${input.name}, ${input.country_code})
        `
        console.log('[SHOP_CREATE] Shop created:', shop?.id, shop?.name)

        if (input.tax_id) {
          await ctx.db`
            UPDATE public.shops
            SET tax_id = ${input.tax_id}, tax_id_type = ${input.tax_id_type ?? null}
            WHERE id = ${shop.id}
          `
          console.log('[SHOP_CREATE] Tax ID saved:', input.tax_id)
        }

        console.log('[SHOP_CREATE] Done — returning shop')
        return shop
      } catch (err) {
        console.error('[SHOP_CREATE] Failed:', err)
        throw err
      }
    }),
})
