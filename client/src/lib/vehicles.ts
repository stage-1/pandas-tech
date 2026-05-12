import { z } from 'zod'
import type { input } from 'zod/v4/core'

export const vehicleSpecsSchema = z.object({
  make: z.string().optional(),
  model: z.string().optional(),
  year: z.number().int().optional(),
  trim: z.string().optional(),
  engine_displacement_ccm: z.number().int().optional(),
  engine_cylinders: z.number().int().optional(),
  engine_model: z.string().optional(),
  engine_power_kw: z.number().optional(),
  fuel_type: z.string().optional(),
  fuel_system: z.string().optional(),
  engine_turbine: z.string().optional(),
  engine_oil_capacity_l: z.number().optional(),
  engine_coolant_l: z.number().optional(),
  transmission: z.string().optional(),
  drive: z.string().optional(),
  number_of_gears: z.number().int().optional(),
  front_brakes: z.string().optional(),
  rear_brakes: z.string().optional(),
  abs: z.boolean().optional(),
  wheel_size: z.string().optional(),
  wheel_rims_size: z.string().optional(),
  front_suspension: z.string().optional(),
  rear_suspension: z.string().optional(),
  body_type: z.string().optional(),
  number_of_doors: z.number().int().optional(),
  number_of_seats: z.number().int().optional(),
  // LATAM fields (Vincario sparse response)
  manufacturer:  z.string().optional(),
  plant_country: z.string().optional(),
  make_logo_url: z.string().optional(),
})

export type VehicleSpecs = z.infer<typeof vehicleSpecsSchema>

export const createVehicleSchema = z.object({
  vin:           z.string().min(11, 'VIN debe tener al menos 11 caracteres').max(17, 'VIN no puede exceder 17 caracteres'),
  year:          z.coerce.number().int().min(1900).max(2100).nullish(),
  make:          z.string().max(60).nullish(),
  model:         z.string().max(60).nullish(),
  trim:          z.string().max(60).nullish(),
  color:         z.string().max(30).nullish(),
  odometer:      z.coerce.number().int().min(0).max(9_999_999).nullish(),
  license_plate: z.string().max(20).nullish(),
  notes:         z.string().max(2000).nullish(),
  customer_id:   z.string().uuid().nullish(),
  // property card fields
  transit_license_no:      z.string().max(50).nullish(),
  engine_number:           z.string().max(50).nullish(),
  serial_number:           z.string().max(50).nullish(),
  vehicle_class:           z.string().max(60).nullish(),
  service_type:            z.string().max(40).nullish(),
  axle_count:              z.coerce.number().int().min(1).max(20).nullish(),
  registration_city:       z.string().max(80).nullish(),
  body_type:               z.string().max(60).nullish(),
  number_of_doors:         z.coerce.number().int().min(1).max(20).nullish(),
  engine_displacement_ccm: z.coerce.number().int().min(0).nullish(),
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
  { label: 'Detalles',       fields: ['year', 'make', 'model', 'trim', 'color', 'odometer'] as const },
  { label: 'Adicional',      fields: ['customer_id', 'notes'] as const },
] as const
