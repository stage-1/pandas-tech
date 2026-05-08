import { z } from 'zod'
import { router, protectedProcedure } from '../trpc'
import { createCustomerSchema } from '@/lib/customers'
import { resolveShopId } from './_utils'

export const customersRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const shopId = await resolveShopId(ctx.db, ctx.userId)
    return ctx.db`
      SELECT id, name, email, phone, notes, created_at
      FROM public.customers
      WHERE shop_id = ${shopId} AND deleted_at IS NULL
      ORDER BY name ASC
    `
  }),

  create: protectedProcedure
    .input(createCustomerSchema)
    .mutation(async ({ ctx, input }) => {
      const shopId = await resolveShopId(ctx.db, ctx.userId)
      const [customer] = await ctx.db`
        INSERT INTO public.customers (shop_id, name, email, phone, notes)
        VALUES (
          ${shopId},
          ${input.name},
          ${input.email ?? null},
          ${input.phone ?? null},
          ${input.notes ?? null}
        )
        RETURNING *
      `
      return customer
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const shopId = await resolveShopId(ctx.db, ctx.userId)
      await ctx.db`
        UPDATE public.customers
        SET deleted_at = NOW()
        WHERE id = ${input.id}
          AND shop_id = ${shopId}
          AND deleted_at IS NULL
      `
    }),
})
