import { router } from '../trpc'
import { shopsRouter } from './shops'
import { usersRouter } from './users'
import { vehiclesRouter } from './vehicles'
import { customersRouter } from './customers'
import { dashboardRouter } from './dashboard'
import { repairOrdersRouter } from './repair-orders'
import { invoicesRouter } from './invoices'

export const appRouter = router({
  shops: shopsRouter,
  users: usersRouter,
  vehicles: vehiclesRouter,
  customers: customersRouter,
  dashboard: dashboardRouter,
  repairOrders: repairOrdersRouter,
  invoices: invoicesRouter,
})

export type AppRouter = typeof appRouter
