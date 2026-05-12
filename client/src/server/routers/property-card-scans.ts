import { router, protectedProcedure } from '../trpc'
import { propertyCardScanCreateSchema } from '@/lib/property-card-scan'
import { resolveShopId } from './_utils'

export const propertyCardScansRouter = router({
  create: protectedProcedure
    .input(propertyCardScanCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const shopId = await resolveShopId(ctx.db, ctx.userId)

      const [row] = await ctx.db`
        INSERT INTO public.property_card_scans (
          shop_id,
          created_by,
          ai_result,
          confirmed_fields,
          overall_confidence,
          fields_flagged,
          fields_user_edited,
          image_storage_path,
          status
        ) VALUES (
          ${shopId},
          ${ctx.userId},
          ${ctx.db.json(input.ai_result)},
          ${ctx.db.json(input.confirmed_fields)},
          ${input.overall_confidence},
          ${input.fields_flagged},
          ${input.fields_user_edited},
          ${input.image_storage_path ?? null},
          'reviewed'
        )
        RETURNING id
      `

      return { id: row.id as string }
    }),
})
