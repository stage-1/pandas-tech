import { z } from 'zod'
import { router, protectedProcedure } from '../trpc'
import { createVehicleSchema, updateVehicleSchema, vehicleSpecsSchema } from '@/lib/vehicles'
import { resolveShopId } from './_utils'

const specsExtension = { specs: vehicleSpecsSchema.optional() }
const createWithSpecs = createVehicleSchema.extend(specsExtension)
const updateWithSpecs = updateVehicleSchema.extend(specsExtension)

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
    .input(createWithSpecs)
    .mutation(async ({ ctx, input }) => {
      const shopId = await resolveShopId(ctx.db, ctx.userId)
      const s = input.specs

      const [vehicle] = await ctx.db`
        INSERT INTO public.vehicles (
          shop_id, vin, year, make, model, trim, color, odometer, license_plate, notes,
          current_customer_id,
          engine_displacement_ccm, engine_cylinders, engine_model, engine_power_kw,
          fuel_type, fuel_system, engine_turbine, engine_oil_capacity_l, engine_coolant_l,
          transmission, drive, number_of_gears,
          front_brakes, rear_brakes, abs, wheel_size, wheel_rims_size,
          front_suspension, rear_suspension, body_type, number_of_doors, number_of_seats
        ) VALUES (
          ${shopId}, ${input.vin}, ${input.year ?? null}, ${input.make ?? null},
          ${input.model ?? null}, ${input.trim ?? null}, ${input.color ?? null},
          ${input.odometer ?? null}, ${input.license_plate ?? null}, ${input.notes ?? null},
          ${input.customer_id ?? null},
          ${s?.engine_displacement_ccm ?? null}, ${s?.engine_cylinders ?? null},
          ${s?.engine_model ?? null}, ${s?.engine_power_kw ?? null},
          ${s?.fuel_type ?? null}, ${s?.fuel_system ?? null}, ${s?.engine_turbine ?? null},
          ${s?.engine_oil_capacity_l ?? null}, ${s?.engine_coolant_l ?? null},
          ${s?.transmission ?? null}, ${s?.drive ?? null}, ${s?.number_of_gears ?? null},
          ${s?.front_brakes ?? null}, ${s?.rear_brakes ?? null}, ${s?.abs ?? null},
          ${s?.wheel_size ?? null}, ${s?.wheel_rims_size ?? null},
          ${s?.front_suspension ?? null}, ${s?.rear_suspension ?? null},
          ${s?.body_type ?? null}, ${s?.number_of_doors ?? null}, ${s?.number_of_seats ?? null}
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
    .input(updateWithSpecs)
    .mutation(async ({ ctx, input }) => {
      const shopId = await resolveShopId(ctx.db, ctx.userId)
      const s = input.specs

      const [vehicle] = await ctx.db`
        UPDATE public.vehicles SET
          license_plate             = ${input.license_plate ?? null},
          year                      = ${input.year ?? null},
          make                      = ${input.make ?? null},
          model                     = ${input.model ?? null},
          trim                      = ${input.trim ?? null},
          color                     = ${input.color ?? null},
          odometer                  = ${input.odometer ?? null},
          notes                     = ${input.notes ?? null},
          current_customer_id       = ${input.customer_id ?? null},
          engine_displacement_ccm   = ${s?.engine_displacement_ccm ?? null},
          engine_cylinders          = ${s?.engine_cylinders ?? null},
          engine_model              = ${s?.engine_model ?? null},
          engine_power_kw           = ${s?.engine_power_kw ?? null},
          fuel_type                 = ${s?.fuel_type ?? null},
          fuel_system               = ${s?.fuel_system ?? null},
          engine_turbine            = ${s?.engine_turbine ?? null},
          engine_oil_capacity_l     = ${s?.engine_oil_capacity_l ?? null},
          engine_coolant_l          = ${s?.engine_coolant_l ?? null},
          transmission              = ${s?.transmission ?? null},
          drive                     = ${s?.drive ?? null},
          number_of_gears           = ${s?.number_of_gears ?? null},
          front_brakes              = ${s?.front_brakes ?? null},
          rear_brakes               = ${s?.rear_brakes ?? null},
          abs                       = ${s?.abs ?? null},
          wheel_size                = ${s?.wheel_size ?? null},
          wheel_rims_size           = ${s?.wheel_rims_size ?? null},
          front_suspension          = ${s?.front_suspension ?? null},
          rear_suspension           = ${s?.rear_suspension ?? null},
          body_type                 = ${s?.body_type ?? null},
          number_of_doors           = ${s?.number_of_doors ?? null},
          number_of_seats           = ${s?.number_of_seats ?? null},
          updated_at                = NOW()
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
