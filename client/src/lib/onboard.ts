import { z } from 'zod'
import { themeSlugSchema, type ShopThemeSlug } from '@/lib/shop-themes'

export const COUNTRY_CONFIG = {
  CO: { label: 'NIT', hint: '123456789-0', taxIdType: 'NIT', currency: 'COP', iva: 0.19, flag: '🇨🇴', name: 'Colombia',      timezone: 'America/Bogota'       },
  MX: { label: 'RFC', hint: 'XAXX010101000', taxIdType: 'RFC', currency: 'MXN', iva: 0.16, flag: '🇲🇽', name: 'México',       timezone: 'America/Mexico_City'  },
  CL: { label: 'RUT', hint: '12.345.678-9',  taxIdType: 'RUT', currency: 'CLP', iva: 0.19, flag: '🇨🇱', name: 'Chile',        timezone: 'America/Santiago'     },
  US: { label: 'EIN', hint: '12-3456789',    taxIdType: 'EIN', currency: 'USD', iva: null,  flag: '🇺🇸', name: 'United States', timezone: 'America/Los_Angeles'  },
} as const

export type CountryCode = keyof typeof COUNTRY_CONFIG

export const AVAILABLE_COUNTRIES: CountryCode[] = ['CO']

export const roleSchema = z.object({
  role: z.enum(['owner', 'tech']),
})

export const shopNameSchema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres').max(120),
})

export const countrySchema = z.object({
  country: z.enum(['CO', 'MX', 'CL', 'US'] as const),
})

export const taxIdSchema = z.object({
  taxId: z.string().max(30).optional(),
})

export const inviteCodeSchema = z.object({
  inviteCode: z.string().min(1, 'Ingresa un código de invitación'),
})

export const createShopSchema = z.object({
  name:         z.string().min(2).max(120),
  country_code: z.enum(['CO', 'MX', 'CL', 'US'] as const),
  tax_id:       z.string().max(30).optional(),
  tax_id_type:  z.string().max(20).optional(),
  theme_slug:   themeSlugSchema,
})

export function wizardStateToCreateInput(state: {
  role: 'owner' | 'tech'
  name: string
  country: CountryCode
  taxId: string
  theme_slug: ShopThemeSlug
}) {
  return {
    name: state.name,
    country_code: state.country,
    tax_id: state.taxId || undefined,
    tax_id_type: COUNTRY_CONFIG[state.country].taxIdType,
    role: state.role,
    theme_slug: state.theme_slug,
  }
}
