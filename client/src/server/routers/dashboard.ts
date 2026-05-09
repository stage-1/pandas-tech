import { router, protectedProcedure } from '../trpc'
import { resolveShopId } from './_utils'

/** Scalar dashboard aggregates — one DB round-trip, no row payloads. */
export const dashboardRouter = router({
  stats: protectedProcedure.query(async ({ ctx }) => {
    const shopId = await resolveShopId(ctx.db, ctx.userId)
    const started = Date.now()

    const [row] = await ctx.db`
      SELECT
        (SELECT COUNT(*)::int FROM public.customers c
          WHERE c.shop_id = ${shopId} AND c.deleted_at IS NULL) AS customer_count,
        (SELECT COUNT(*)::int FROM public.vehicles v
          WHERE v.shop_id = ${shopId} AND v.deleted_at IS NULL) AS vehicle_count,
        (SELECT COUNT(*)::int FROM public.vehicles v
          WHERE v.shop_id = ${shopId} AND v.deleted_at IS NULL
            AND v.created_at >= NOW() - INTERVAL '30 days') AS vehicles_created_last_30d,
        (SELECT COUNT(DISTINCT v.current_customer_id)::int FROM public.vehicles v
          INNER JOIN public.customers c ON c.id = v.current_customer_id
          WHERE v.shop_id = ${shopId}
            AND v.deleted_at IS NULL
            AND c.shop_id = ${shopId}
            AND c.deleted_at IS NULL) AS customers_with_vehicle_count
    `

    if (!row) {
      console.warn('[DASHBOARD_STATS] empty row shopId=', shopId)
      return {
        customerCount: 0,
        vehicleCount: 0,
        vehiclesCreatedLast30d: 0,
        customersWithVehicleCount: 0,
      }
    }

    const payload = {
      customerCount: Number(row.customer_count ?? 0),
      vehicleCount: Number(row.vehicle_count ?? 0),
      vehiclesCreatedLast30d: Number(row.vehicles_created_last_30d ?? 0),
      customersWithVehicleCount: Number(row.customers_with_vehicle_count ?? 0),
    }

    console.log(
      '[DASHBOARD_STATS]',
      'shopId=', shopId,
      'ms=', Date.now() - started,
      payload,
    )

    return payload
  }),
})
