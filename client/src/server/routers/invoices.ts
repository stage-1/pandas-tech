import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, protectedProcedure } from '../trpc'
import { resolveShopId } from './_utils'

export const invoicesRouter = router({
  byRepairOrderId: protectedProcedure
    .input(z.object({ repair_order_id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const shopId = await resolveShopId(ctx.db, ctx.userId)
      const rows = await ctx.db`
        SELECT i.* FROM public.invoices i
        JOIN public.repair_orders ro ON ro.id = i.repair_order_id
        WHERE i.repair_order_id = ${input.repair_order_id}
          AND ro.shop_id = ${shopId}
          AND ro.deleted_at IS NULL
        LIMIT 1
      `
      return rows[0] ?? null
    }),

  createForRO: protectedProcedure
    .input(
      z.object({
        repair_order_id: z.string().uuid(),
        due_at: z.coerce.date().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const shopId = await resolveShopId(ctx.db, ctx.userId)
      console.log('[INVOICES] createForRO', input.repair_order_id)

      const [existing] = await ctx.db`
        SELECT id FROM public.invoices
        WHERE repair_order_id = ${input.repair_order_id}
      `
      if (existing) {
        throw new TRPCError({ code: 'CONFLICT', message: 'Esta orden ya tiene factura.' })
      }

      const dueAt = input.due_at === undefined ? null : input.due_at

      const [invoice] = await ctx.db`
        INSERT INTO public.invoices (
          shop_id,
          repair_order_id,
          invoice_number,
          subtotal_minor,
          tax_minor,
          total_minor,
          due_at
        )
        SELECT
          ro.shop_id,
          ro.id,
          0,
          ro.subtotal_minor,
          ro.tax_minor,
          ro.total_minor,
          ${dueAt}
        FROM public.repair_orders ro
        WHERE ro.id = ${input.repair_order_id}
          AND ro.shop_id = ${shopId}
          AND ro.deleted_at IS NULL
          AND ro.status = 'completed'
        RETURNING *
      `
      if (!invoice) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Solo órdenes completadas pueden facturarse.',
        })
      }
      return invoice
    }),

  listPayments: protectedProcedure
    .input(z.object({ invoice_id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const shopId = await resolveShopId(ctx.db, ctx.userId)
      return ctx.db`
        SELECT p.* FROM public.payments p
        WHERE p.invoice_id = ${input.invoice_id}
          AND p.shop_id = ${shopId}
        ORDER BY p.created_at DESC
      `
    }),

  recordPayment: protectedProcedure
    .input(
      z.object({
        invoice_id: z.string().uuid(),
        amount_minor: z.number().int().positive(),
        currency: z.string().length(3),
        method: z.enum(['card', 'cash', 'check', 'ach', 'pse', 'transfer', 'other']),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const shopId = await resolveShopId(ctx.db, ctx.userId)

      const [inv] = await ctx.db`
        SELECT id FROM public.invoices
        WHERE id = ${input.invoice_id} AND shop_id = ${shopId}
      `
      if (!inv) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Factura no encontrada.' })
      }
      console.log('[INVOICES] recordPayment', input.invoice_id, input.amount_minor)

      await ctx.db`
        INSERT INTO public.payments (
          shop_id, invoice_id, amount_minor, currency,
          status, provider, method, paid_at
        )
        VALUES (
          ${shopId},
          ${input.invoice_id},
          ${input.amount_minor},
          ${input.currency},
          'succeeded',
          'manual',
          ${input.method}::payment_method,
          NOW()
        )
      `

      await ctx.db`
        UPDATE public.invoices SET
          amount_paid_minor = (
            SELECT COALESCE(SUM(p.amount_minor), 0)::bigint
            FROM public.payments p
            WHERE p.invoice_id = ${input.invoice_id}
              AND p.status = 'succeeded'
          ),
          updated_at = NOW()
        WHERE id = ${input.invoice_id} AND shop_id = ${shopId}
      `

      const [updated] = await ctx.db`
        SELECT amount_paid_minor, total_minor FROM public.invoices
        WHERE id = ${input.invoice_id} AND shop_id = ${shopId}
      `
      return updated
    }),
})
