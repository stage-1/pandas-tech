import { z } from 'zod'

export const repairOrderStatusSchema = z.enum([
  'draft',
  'pending',
  'approved',
  'in_progress',
  'completed',
  'declined',
  'cancelled',
])

export type RepairOrderStatus = z.infer<typeof repairOrderStatusSchema>

export const RO_STATUS_LABELS: Record<RepairOrderStatus, string> = {
  draft: 'Borrador',
  pending: 'Pendiente aprobación',
  approved: 'Aprobada',
  in_progress: 'En taller',
  completed: 'Completada',
  declined: 'Rechazada',
  cancelled: 'Cancelada',
}

/** Allowed staff-driven transitions (server must still enforce). */
export const RO_STATUS_TRANSITIONS: Record<RepairOrderStatus, RepairOrderStatus[]> = {
  draft: ['pending', 'cancelled'],
  pending: ['approved', 'declined', 'cancelled'],
  approved: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  declined: [],
  cancelled: [],
}

export const lineItemTypeSchema = z.enum(['labor', 'part'])

export const createRepairOrderSchema = z.object({
  customer_id: z.string().uuid(),
  vehicle_id: z.string().uuid(),
  complaint: z.string().max(10_000).optional().nullable(),
  internal_notes: z.string().max(10_000).optional().nullable(),
  odometer_in: z.number().int().nonnegative().optional().nullable(),
})

export const updateRepairOrderSchema = z.object({
  id: z.string().uuid(),
  complaint: z.string().max(10_000).optional().nullable(),
  internal_notes: z.string().max(10_000).optional().nullable(),
  odometer_in: z.number().int().nonnegative().optional().nullable(),
  odometer_out: z.number().int().nonnegative().optional().nullable(),
})

export const updateRepairOrderStatusSchema = z.object({
  id: z.string().uuid(),
  status: repairOrderStatusSchema,
})

export const addLineItemSchema = z.object({
  repair_order_id: z.string().uuid(),
  type: lineItemTypeSchema,
  description: z.string().min(1).max(2000),
  qty: z.number().positive().max(1_000_000),
  unit_price_minor: z.number().int().nonnegative(),
  taxable: z.boolean().default(true),
  position: z.number().int().nonnegative().optional(),
})

export const updateLineItemSchema = z.object({
  id: z.string().uuid(),
  repair_order_id: z.string().uuid(),
  type: lineItemTypeSchema.optional(),
  description: z.string().min(1).max(2000).optional(),
  qty: z.number().positive().max(1_000_000).optional(),
  unit_price_minor: z.number().int().nonnegative().optional(),
  taxable: z.boolean().optional(),
  position: z.number().int().nonnegative().optional(),
})

export const removeLineItemSchema = z.object({
  id: z.string().uuid(),
  repair_order_id: z.string().uuid(),
})

/** Two-step wizard: cliente/vehículo → detalle. */
export const RO_MOBILE_STEPS = [
  { label: 'Vehículo', fields: ['customer_id', 'vehicle_id'] as const },
  { label: 'Detalle', fields: ['complaint', 'odometer_in', 'internal_notes'] as const },
] as const
