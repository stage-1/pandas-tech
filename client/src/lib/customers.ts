import { z } from 'zod'
import type { input } from 'zod/v4/core'

export const createCustomerSchema = z.object({
  name:  z.string().min(1, 'El nombre es requerido').max(200),
  email: z.union([z.string().email('Email inválido'), z.literal(''), z.null()]).nullish(),
  phone: z.string().max(30).nullish(),
  notes: z.string().max(2000).nullish(),
})

/** Parsed / API shape (schema output). */
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>
/** React Hook Form values before resolver coercion (schema input). */
export type CreateCustomerFormValues = input<typeof createCustomerSchema>

export const MOBILE_STEPS = [
  { label: 'Contacto',  fields: ['name', 'phone'] as const },
  { label: 'Adicional', fields: ['email', 'notes'] as const },
] as const
