import { router } from '../trpc'
import { shopsRouter } from './shops'
import { usersRouter } from './users'
import { vehiclesRouter } from './vehicles'

export const appRouter = router({
  shops: shopsRouter,
  users: usersRouter,
  vehicles: vehiclesRouter,
})

export type AppRouter = typeof appRouter
