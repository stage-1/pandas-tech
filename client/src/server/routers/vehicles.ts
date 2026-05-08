import { z } from 'zod'
import { router, protectedProcedure } from '../trpc'
import { createVehicleSchema } from '@/lib/vehicles'
import { resolveShopId } from './_utils'

export const vehiclesRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const shopId = await resolveShopId(ctx.db, ctx.userId)
    return ctx.db`
      SELECT v.*, c.name AS customer_name
      FROM public.vehicles v
      LEFT JOIN public.customers c ON c.id = v.current_customer_id
      WHERE v.shop_id = ${shopId} AND v.deleted_at IS NULL
      ORDER BY v.created_at DESC
    `
  }),

  create: protectedProcedure
    .input(createVehicleSchema)
    .mutation(async ({ ctx, input }) => {
      const shopId = await resolveShopId(ctx.db, ctx.userId)

      const [vehicle] = await ctx.db`
        INSERT INTO public.vehicles (
          shop_id, vin, year, make, model, trim, color, license_plate, notes,
          current_customer_id
        ) VALUES (
          ${shopId}, ${input.vin}, ${input.year ?? null}, ${input.make ?? null},
          ${input.model ?? null}, ${input.trim ?? null}, ${input.color ?? null},
          ${input.license_plate ?? null}, ${input.notes ?? null},
          ${input.customer_id ?? null}
        )
        RETURNING *
      `

      if (input.customer_id) {
        await ctx.db`
          INSERT INTO public.vehicle_ownerships (vehicle_id, customer_id)
          VALUES (${vehicle.id}, ${input.customer_id})
        `
      }

      return vehicle
    }),

  customers: protectedProcedure
    .input(z.object({ search: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const shopId = await resolveShopId(ctx.db, ctx.userId)
      const search = input.search?.trim()

      if (search) {
        return ctx.db`
          SELECT id, name FROM public.customers
          WHERE shop_id = ${shopId} AND deleted_at IS NULL
            AND name ILIKE ${'%' + search + '%'}
          ORDER BY name
          LIMIT 20
        `
      }

      return ctx.db`
        SELECT id, name FROM public.customers
        WHERE shop_id = ${shopId} AND deleted_at IS NULL
        ORDER BY name
        LIMIT 20
      `
    }),
})
