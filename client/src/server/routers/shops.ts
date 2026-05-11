import { z } from 'zod'
import postgres from 'postgres'
import { TRPCError } from '@trpc/server'
import { router, protectedProcedure } from '../trpc'
import { themeSlugSchema } from '@/lib/shop-themes'

function isPostgresError(err: unknown): err is postgres.PostgresError {
  return (
    err instanceof postgres.PostgresError ||
    (!!err &&
      typeof err === 'object' &&
      (err as { name?: string }).name === 'PostgresError' &&
      typeof (err as { code?: string }).code === 'string')
  )
}

function handleThemeRpcFailure(err: unknown): never {
  if (isPostgresError(err)) {
    console.error('[SHOP_THEME] PostgresError', {
      code: err.code,
      message: err.message,
      detail: err.detail,
    })
    if (err.code === '42703') {
      throw new TRPCError({
        code: 'PRECONDITION_FAILED',
        message:
          'Base de datos sin columna o esquema incompleto (theme_slug). Ejecuta las migraciones en db/migrations.',
      })
    }
    if (err.code === '42883' || err.message.includes('update_shop_theme_for_session')) {
      throw new TRPCError({
        code: 'PRECONDITION_FAILED',
        message:
          'Falta la función update_shop_theme_for_session. Aplica db/migrations/0013_update_shop_theme_definer.sql.',
      })
    }
    if (err.code === '42501' || err.message.includes('forbidden')) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Solo el dueño puede cambiar el tema del taller.',
      })
    }
    if (err.code === '02000' || err.message.includes('no_shop')) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'No tienes un taller asignado.',
      })
    }
    if (err.code === '28000') {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Sesión inválida para actualizar el tema.',
      })
    }
    if (err.code === '23514') {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Tema no válido.' })
    }
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: err.message || 'Error al guardar el tema.',
    })
  }

  console.error('[SHOP_THEME] Unknown error', err)
  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message:
      err instanceof Error ? err.message : 'Error desconocido al guardar el tema.',
  })
}

export const shopsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db`SELECT * FROM public.shops`
  }),

  mine: protectedProcedure.query(async ({ ctx }) => {
    const [row] = await ctx.db`
      SELECT s.*, m.role AS membership_role FROM public.shops s
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
      role:         z.enum(['owner', 'tech']).default('owner'),
      theme_slug:   themeSlugSchema.default('pandas'),
    }))
    .mutation(async ({ ctx, input }) => {
      console.log('[SHOP_CREATE] Starting for userId:', ctx.userId, 'input:', input)
      try {
        await ctx.db`
          INSERT INTO public.users (id) VALUES (${ctx.userId})
          ON CONFLICT (id) DO NOTHING
        `
        console.log('[SHOP_CREATE] User upsert done')

        const [shop] = await ctx.db`
          SELECT * FROM public.create_shop_for_owner(
            ${input.name},
            ${input.country_code},
            NULL, NULL, NULL,
            ${input.role}
          )
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

        try {
          await ctx.db`
            SELECT public.update_shop_theme_for_session(${input.theme_slug})
          `
        } catch (e) {
          handleThemeRpcFailure(e)
        }
        console.log('[SHOP_CREATE] theme_slug:', input.theme_slug)

        console.log('[SHOP_CREATE] Done — returning shop')
        const [fresh] = await ctx.db`SELECT * FROM public.shops WHERE id = ${shop.id}`
        return fresh ?? shop
      } catch (err) {
        console.error('[SHOP_CREATE] Failed:', err)
        throw err
      }
    }),

  updateTheme: protectedProcedure
    .input(z.object({ theme_slug: themeSlugSchema }))
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.db`
          SELECT public.update_shop_theme_for_session(${input.theme_slug})
        `
        console.log('[SHOP_THEME] RPC ok', ctx.userId, input.theme_slug)
      } catch (err) {
        handleThemeRpcFailure(err)
      }
      return { theme_slug: input.theme_slug }
    }),

  updateDetails: protectedProcedure
    .input(z.object({ name: z.string().min(2).max(120) }))
    .mutation(async ({ ctx, input }) => {
      const name = input.name.trim()
      const [ownerRow] = await ctx.db`
        SELECT s.id
        FROM public.shops s
        INNER JOIN public.shop_memberships m
          ON m.shop_id = s.id AND m.user_id = ${ctx.userId}
        WHERE m.role = 'owner'
        LIMIT 1
      `
      if (!ownerRow?.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Solo el dueño puede editar el nombre del taller.',
        })
      }
      try {
        await ctx.db`
          UPDATE public.shops
          SET name = ${name}, updated_at = now()
          WHERE id = ${ownerRow.id}
        `
        console.log('[SHOP_DETAILS] name updated', ctx.userId, ownerRow.id)
      } catch (err) {
        if (isPostgresError(err)) {
          console.error('[SHOP_DETAILS] PostgresError', {
            code: err.code,
            message: err.message,
          })
          if (err.code === '42501') {
            throw new TRPCError({
              code: 'FORBIDDEN',
              message: 'No tienes permiso para actualizar el taller.',
            })
          }
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: err.message || 'Error al guardar el nombre.',
          })
        }
        throw err
      }
      return { name }
    }),

  join: protectedProcedure
    .input(z.object({ invite_code: z.string().min(1) }))
    .mutation(async () => {
      throw new TRPCError({ code: 'METHOD_NOT_SUPPORTED', message: 'El sistema de invitaciones estará disponible próximamente.' })
    }),
})
