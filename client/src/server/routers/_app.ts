import { router } from '../trpc'
import { shopsRouter } from './shops'

export const appRouter = router({
  shops: shopsRouter,
})

export type AppRouter = typeof appRouter
