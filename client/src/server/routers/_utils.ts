import { TRPCError } from '@trpc/server'
import type postgres from 'postgres'

export async function resolveShopId(db: postgres.TransactionSql, userId: string) {
  const [row] = await db`
    SELECT s.id FROM public.shops s
    JOIN public.shop_memberships m ON m.shop_id = s.id
    WHERE m.user_id = ${userId}
    LIMIT 1
  `
  if (!row) throw new TRPCError({ code: 'NOT_FOUND', message: 'No tienes un taller asignado.' })
  return row.id as string
}
