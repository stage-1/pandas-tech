import { z } from 'zod'

// ── AI response schema ────────────────────────────────────────────────────────

const fieldSchema = z.object({
  value: z.union([z.string(), z.number(), z.null()]),
  confidence: z.number().min(0).max(100),
})

export const propertyCardAiResultSchema = z.object({
  fields: z.object({
    transit_license_no: fieldSchema,
    plate:              fieldSchema,
    make:               fieldSchema,
    vehicle_class:      fieldSchema,
    service_type:       fieldSchema,
    engine_number:      fieldSchema,
    chassis_number:     fieldSchema,
    serial_number:      fieldSchema,
    body_type:          fieldSchema,
    color:              fieldSchema,
    displacement_cc:    fieldSchema,
    model_year:         fieldSchema,
    door_count:         fieldSchema,
    axle_count:         fieldSchema,
    city:               fieldSchema,
    issue_date:         fieldSchema,
  }),
  is_valid_property_card: z.boolean(),
  funny_comment: z.string(),
})

export type PropertyCardAiResult = z.infer<typeof propertyCardAiResultSchema>
export type PropertyCardFields = PropertyCardAiResult['fields']
export type PropertyCardFieldKey = keyof PropertyCardFields

// ── Resolved fields (after user review) ──────────────────────────────────────

export type ResolvedPropertyCardFields = {
  [K in PropertyCardFieldKey]: string | number | null
}

// ── tRPC create input ─────────────────────────────────────────────────────────

export const propertyCardScanCreateSchema = z.object({
  ai_result:           propertyCardAiResultSchema,
  confirmed_fields:    z.record(z.string(), z.union([z.string(), z.number(), z.null()])),
  overall_confidence:  z.number(),
  fields_flagged:      z.array(z.string()),
  fields_user_edited:  z.array(z.string()),
  image_storage_path:  z.string().nullable().optional(),
})

export type PropertyCardScanCreateInput = z.infer<typeof propertyCardScanCreateSchema>

// ── Callback result passed to VehicleForm ────────────────────────────────────

export type PropertyCardScanResult = {
  fields: ResolvedPropertyCardFields
  scanId: string
}

// ── Field config: labels + which ones map into VehicleForm ───────────────────

export const CONFIDENCE_THRESHOLD = 75

export const FIELD_CONFIG: Record<PropertyCardFieldKey, { label: string; mapsToVehicle: boolean }> = {
  transit_license_no: { label: 'No. Licencia',       mapsToVehicle: true  },
  plate:              { label: 'Placa',               mapsToVehicle: true  },
  make:               { label: 'Marca',               mapsToVehicle: true  },
  vehicle_class:      { label: 'Clase',               mapsToVehicle: true  },
  service_type:       { label: 'Servicio',            mapsToVehicle: true  },
  engine_number:      { label: 'No. Motor',           mapsToVehicle: true  },
  chassis_number:     { label: 'No. Chasis (VIN)',    mapsToVehicle: true  },
  serial_number:      { label: 'No. Serie',           mapsToVehicle: true  },
  body_type:          { label: 'Carrocería',          mapsToVehicle: true  },
  color:              { label: 'Color',               mapsToVehicle: true  },
  displacement_cc:    { label: 'Cilindraje (cc)',     mapsToVehicle: true  },
  model_year:         { label: 'Modelo (año)',        mapsToVehicle: true  },
  door_count:         { label: 'No. Puertas',        mapsToVehicle: true  },
  axle_count:         { label: 'No. Ejes',           mapsToVehicle: true  },
  city:               { label: 'Ciudad',              mapsToVehicle: true  },
  issue_date:         { label: 'Fecha expedición',   mapsToVehicle: false },
}

export const FIELD_KEYS = Object.keys(FIELD_CONFIG) as PropertyCardFieldKey[]
