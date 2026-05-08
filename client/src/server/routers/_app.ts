import { router } from '../trpc'
import { shopsRouter } from './shops'
import { usersRouter } from './users'
import { vehiclesRouter } from './vehicles'
import { customersRouter } from './customers'

export const appRouter = router({
  shops: shopsRouter,
  users: usersRouter,
  vehicles: vehiclesRouter,
  customers: customersRouter,
})

export type AppRouter = typeof appRouter
