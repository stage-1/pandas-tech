import { z } from 'zod'
import { router, protectedProcedure } from '../trpc'
import { createVehicleSchema, updateVehicleSchema } from '@/lib/vehicles'
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
          shop_id, vin, year, make, model, trim, color, odometer, license_plate, notes,
          current_customer_id
        ) VALUES (
          ${shopId}, ${input.vin}, ${input.year ?? null}, ${input.make ?? null},
          ${input.model ?? null}, ${input.trim ?? null}, ${input.color ?? null},
          ${input.odometer ?? null}, ${input.license_plate ?? null}, ${input.notes ?? null},
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

  byId: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const shopId = await resolveShopId(ctx.db, ctx.userId)
      const [vehicle] = await ctx.db`
        SELECT v.*, c.name AS customer_name
        FROM public.vehicles v
        LEFT JOIN public.customers c ON c.id = v.current_customer_id
        WHERE v.id = ${input.id}
          AND v.shop_id = ${shopId}
          AND v.deleted_at IS NULL
      `
      return vehicle ?? null
    }),

  update: protectedProcedure
    .input(updateVehicleSchema)
    .mutation(async ({ ctx, input }) => {
      const shopId = await resolveShopId(ctx.db, ctx.userId)
      const [vehicle] = await ctx.db`
        UPDATE public.vehicles SET
          license_plate       = ${input.license_plate ?? null},
          year                = ${input.year ?? null},
          make                = ${input.make ?? null},
          model               = ${input.model ?? null},
          trim                = ${input.trim ?? null},
          color               = ${input.color ?? null},
          odometer            = ${input.odometer ?? null},
          notes               = ${input.notes ?? null},
          current_customer_id = ${input.customer_id ?? null},
          updated_at          = NOW()
        WHERE id = ${input.id}
          AND shop_id = ${shopId}
          AND deleted_at IS NULL
        RETURNING id, current_customer_id
      `
      if (input.customer_id) {
        await ctx.db`
          INSERT INTO public.vehicle_ownerships (vehicle_id, customer_id)
          VALUES (${vehicle.id}, ${input.customer_id})
          ON CONFLICT DO NOTHING
        `
      }
      return vehicle
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const shopId = await resolveShopId(ctx.db, ctx.userId)
      await ctx.db`
        UPDATE public.vehicles
        SET deleted_at = NOW()
        WHERE id = ${input.id}
          AND shop_id = ${shopId}
          AND deleted_at IS NULL
      `
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
