import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, protectedProcedure, publicProcedure } from '../trpc'
import {
  RO_STATUS_TRANSITIONS,
  addLineItemSchema,
  createRepairOrderSchema,
  removeLineItemSchema,
  repairOrderStatusSchema,
  updateLineItemSchema,
  updateRepairOrderSchema,
  updateRepairOrderStatusSchema,
} from '@/lib/repair-orders'
import { sql } from '@/lib/postgres'
import { resolveShopId } from './_utils'

function assertRepairOrderTransition(
  from: keyof typeof RO_STATUS_TRANSITIONS,
  to: keyof typeof RO_STATUS_TRANSITIONS,
) {
  const allowed = RO_STATUS_TRANSITIONS[from]
  if (!allowed?.includes(to as never)) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `Transición inválida: ${from} → ${to}`,
    })
  }
}

export const repairOrdersRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const shopId = await resolveShopId(ctx.db, ctx.userId)
    console.log('[REPAIR_ORDERS] list shopId=', shopId)
    return ctx.db`
      SELECT ro.id, ro.ro_number, ro.status, ro.total_minor, ro.currency,
             ro.created_at,
             c.name AS customer_name,
             v.make, v.model, v.license_plate
      FROM public.repair_orders ro
      LEFT JOIN public.customers c ON c.id = ro.customer_id
      LEFT JOIN public.vehicles v ON v.id = ro.vehicle_id
      WHERE ro.shop_id = ${shopId}
        AND ro.deleted_at IS NULL
      ORDER BY ro.created_at DESC
      LIMIT 200
    `
  }),

  create: protectedProcedure
    .input(createRepairOrderSchema)
    .mutation(async ({ ctx, input }) => {
      const shopId = await resolveShopId(ctx.db, ctx.userId)
      console.log('[REPAIR_ORDERS] create shopId=', shopId, input)

      const [row] = await ctx.db`
        INSERT INTO public.repair_orders (
          shop_id, customer_id, vehicle_id,
          complaint, internal_notes, odometer_in,
          ro_number, status
        )
        VALUES (
          ${shopId},
          ${input.customer_id},
          ${input.vehicle_id},
          ${input.complaint ?? null},
          ${input.internal_notes ?? null},
          ${input.odometer_in ?? null},
          0,
          'draft'
        )
        RETURNING id, ro_number, currency, country_code
      `
      if (!row) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'No se pudo crear la orden.' })
      }
      return row
    }),

  byId: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const shopId = await resolveShopId(ctx.db, ctx.userId)
      const [repairOrder] = await ctx.db`
        SELECT ro.*,
               c.name AS customer_name, c.phone AS customer_phone,
               v.make, v.model, v.license_plate, v.vin
        FROM public.repair_orders ro
        LEFT JOIN public.customers c ON c.id = ro.customer_id
        LEFT JOIN public.vehicles v ON v.id = ro.vehicle_id
        WHERE ro.id = ${input.id}
          AND ro.shop_id = ${shopId}
          AND ro.deleted_at IS NULL
      `
      if (!repairOrder) return null

      const lineItems = await ctx.db`
        SELECT * FROM public.line_items
        WHERE repair_order_id = ${input.id}
        ORDER BY position ASC, created_at ASC
      `
      return { repairOrder, lineItems }
    }),

  update: protectedProcedure.input(updateRepairOrderSchema).mutation(async ({ ctx, input }) => {
    const shopId = await resolveShopId(ctx.db, ctx.userId)
    const [cur] = await ctx.db`
      SELECT complaint, internal_notes, odometer_in, odometer_out
      FROM public.repair_orders
      WHERE id = ${input.id} AND shop_id = ${shopId} AND deleted_at IS NULL
    `
    if (!cur) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Orden no encontrada.' })
    }

    const complaint = input.complaint !== undefined ? input.complaint : cur.complaint
    const internal_notes = input.internal_notes !== undefined ? input.internal_notes : cur.internal_notes
    const odometer_in = input.odometer_in !== undefined ? input.odometer_in : cur.odometer_in
    const odometer_out = input.odometer_out !== undefined ? input.odometer_out : cur.odometer_out

    console.log('[REPAIR_ORDERS] update id=', input.id)

    const rows = await ctx.db`
      UPDATE public.repair_orders SET
        complaint        = ${complaint},
        internal_notes   = ${internal_notes},
        odometer_in      = ${odometer_in},
        odometer_out     = ${odometer_out},
        updated_at       = NOW()
      WHERE id = ${input.id}
        AND shop_id = ${shopId}
        AND deleted_at IS NULL
      RETURNING id
    `
    if (!rows.length) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Orden no encontrada.' })
    }
    return { id: rows[0].id }
  }),

  updateStatus: protectedProcedure
    .input(updateRepairOrderStatusSchema)
    .mutation(async ({ ctx, input }) => {
      const shopId = await resolveShopId(ctx.db, ctx.userId)
      const [curRow] = await ctx.db`
        SELECT status::text AS status FROM public.repair_orders
        WHERE id = ${input.id}
          AND shop_id = ${shopId}
          AND deleted_at IS NULL
      `
      if (!curRow) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Orden no encontrada.' })
      }
      const current = repairOrderStatusSchema.parse(curRow.status)
      assertRepairOrderTransition(current, input.status)
      console.log('[REPAIR_ORDERS] updateStatus', input.id, current, '->', input.status)

      const rows = await ctx.db`
        UPDATE public.repair_orders
        SET status = ${input.status}::repair_order_status, updated_at = NOW()
        WHERE id = ${input.id}
          AND shop_id = ${shopId}
          AND status = ${current}::repair_order_status
          AND deleted_at IS NULL
        RETURNING id, status::text AS status
      `
      const [updated] = rows
      if (!updated) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'El estado cambió — recarga la orden e inténtalo de nuevo.',
        })
      }
      return updated
    }),

  addLineItem: protectedProcedure.input(addLineItemSchema).mutation(async ({ ctx, input }) => {
    const shopId = await resolveShopId(ctx.db, ctx.userId)
    const [ro] = await ctx.db`
      SELECT id FROM public.repair_orders
      WHERE id = ${input.repair_order_id} AND shop_id = ${shopId} AND deleted_at IS NULL
    `
    if (!ro) throw new TRPCError({ code: 'NOT_FOUND', message: 'Orden no encontrada.' })

    console.log('[REPAIR_ORDERS] addLineItem ro=', input.repair_order_id, input.type)

    const [row] =
      input.position === undefined
        ? await ctx.db`
            INSERT INTO public.line_items
              (repair_order_id, type, description, qty, unit_price_minor, taxable, position)
            VALUES (
              ${input.repair_order_id},
              ${input.type}::line_item_type,
              ${input.description},
              ${input.qty},
              ${input.unit_price_minor},
              ${input.taxable},
              (SELECT COALESCE(MAX(position), 0) + 1
               FROM public.line_items WHERE repair_order_id = ${input.repair_order_id})
            )
            RETURNING *
          `
        : await ctx.db`
            INSERT INTO public.line_items
              (repair_order_id, type, description, qty, unit_price_minor, taxable, position)
            VALUES (
              ${input.repair_order_id},
              ${input.type}::line_item_type,
              ${input.description},
              ${input.qty},
              ${input.unit_price_minor},
              ${input.taxable},
              ${input.position}
            )
            RETURNING *
          `
    return row
  }),

  updateLineItem: protectedProcedure.input(updateLineItemSchema).mutation(async ({ ctx, input }) => {
    const shopId = await resolveShopId(ctx.db, ctx.userId)
    const rows = await ctx.db`
      SELECT li.*
      FROM public.line_items li
      JOIN public.repair_orders ro ON ro.id = li.repair_order_id
      WHERE li.id = ${input.id}
        AND li.repair_order_id = ${input.repair_order_id}
        AND ro.shop_id = ${shopId}
        AND ro.deleted_at IS NULL
    `
    const cur = rows[0] as
      | {
          type: string
          description: string
          qty: unknown
          unit_price_minor: unknown
          taxable: boolean
          position: number
        }
      | undefined
    if (!cur) throw new TRPCError({ code: 'NOT_FOUND', message: 'Línea no encontrada.' })

    const type = input.type ?? cur.type
    const description = input.description ?? cur.description
    const qty = input.qty ?? Number(cur.qty)
    const unit_price_minor = input.unit_price_minor ?? Number(cur.unit_price_minor)
    const taxable = input.taxable ?? cur.taxable
    const position = input.position ?? cur.position

    const [row] = await ctx.db`
      UPDATE public.line_items SET
        type = ${type}::line_item_type,
        description = ${description},
        qty = ${qty},
        unit_price_minor = ${unit_price_minor},
        taxable = ${taxable},
        position = ${position},
        updated_at = NOW()
      WHERE id = ${input.id}
        AND repair_order_id = ${input.repair_order_id}
      RETURNING *
    `
    return row
  }),

  removeLineItem: protectedProcedure.input(removeLineItemSchema).mutation(async ({ ctx, input }) => {
    const shopId = await resolveShopId(ctx.db, ctx.userId)
    const result = await ctx.db`
      DELETE FROM public.line_items li
      USING public.repair_orders ro
      WHERE li.id = ${input.id}
        AND li.repair_order_id = ${input.repair_order_id}
        AND ro.id = li.repair_order_id
        AND ro.shop_id = ${shopId}
        AND ro.deleted_at IS NULL
      RETURNING li.id
    `
    console.log('[REPAIR_ORDERS] removeLineItem', input.id, 'deleted=', result.length)
    if (!result.length) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Línea no encontrada.' })
    }
    return { id: input.id }
  }),

  /** Public: customer approval link (no Clerk). Uses pool role with RPC EXECUTE. */
  approveByToken: publicProcedure
    .input(z.object({ token: z.string().min(16) }))
    .mutation(async ({ input }) => {
      const [row] = await sql`
        SELECT public.approve_repair_order_by_token(${input.token}) AS ok
      `
      console.log('[REPAIR_ORDERS] approveByToken', input.token.slice(0, 8), 'ok=', row?.ok)
      return { ok: Boolean(row?.ok) }
    }),

  declineByToken: publicProcedure
    .input(z.object({ token: z.string().min(16), reason: z.string().min(1).max(2000) }))
    .mutation(async ({ input }) => {
      const [row] = await sql`
        SELECT public.decline_repair_order_by_token(${input.token}, ${input.reason}) AS ok
      `
      console.log('[REPAIR_ORDERS] declineByToken', input.token.slice(0, 8), 'ok=', row?.ok)
      return { ok: Boolean(row?.ok) }
    }),
})
