import { z } from 'zod'
import type { input } from 'zod/v4/core'

export const createVehicleSchema = z.object({
  vin:           z.string().min(11, 'VIN debe tener al menos 11 caracteres').max(17, 'VIN no puede exceder 17 caracteres'),
  year:          z.coerce.number().int().min(1900).max(2100).nullish(),
  make:          z.string().max(60).nullish(),
  model:         z.string().max(60).nullish(),
  trim:          z.string().max(60).nullish(),
  color:         z.string().max(30).nullish(),
  license_plate: z.string().max(20).nullish(),
  notes:         z.string().max(2000).nullish(),
  customer_id:   z.string().uuid().nullish(),
})

/** Parsed / API shape (schema output). */
export type CreateVehicleInput = z.infer<typeof createVehicleSchema>
/** React Hook Form values before resolver coercion (schema input). */
export type CreateVehicleFormValues = input<typeof createVehicleSchema>

export const updateVehicleSchema = createVehicleSchema.omit({ vin: true }).extend({
  id: z.string().uuid(),
})
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>
export type UpdateVehicleFormValues = input<typeof updateVehicleSchema>

export const MOBILE_STEPS = [
  { label: 'Identificación', fields: ['vin', 'license_plate'] as const },
  { label: 'Detalles',       fields: ['year', 'make', 'model', 'trim', 'color'] as const },
  { label: 'Adicional',      fields: ['customer_id', 'notes'] as const },
] as const
