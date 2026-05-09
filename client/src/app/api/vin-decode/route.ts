import crypto from 'crypto'
import { auth } from '@clerk/nextjs/server'
import type { VehicleSpecs } from '@/lib/vehicles'

function buildControlSum(vin: string, apiKey: string, secretKey: string): string {
  return crypto
    .createHash('sha1')
    .update(`${vin}|decode|${apiKey}|${secretKey}`)
    .digest('hex')
    .slice(0, 10)
}

function normalizeDecodeField(raw: string | number | null | undefined): string | number | null {
  if (raw == null) return null
  if (typeof raw === 'number') return raw
  const str = String(raw).trim()
  return str === '' || str === '-' ? null : str
}

function parseDecodeMap(decode: unknown): Record<string, string | number> {
  const map: Record<string, string | number> = {}

  if (Array.isArray(decode)) {
    for (const item of decode) {
      if (item && typeof item === 'object' && 'label' in item && 'value' in item) {
        const val = normalizeDecodeField((item as { value: unknown }).value as string | number)
        if (val != null) map[(item as { label: string }).label] = val
      }
    }
  } else if (decode && typeof decode === 'object') {
    for (const [key, val] of Object.entries(decode as Record<string, unknown>)) {
      // Unwrap nested { value: ..., value_id: ... } objects
      const raw = val && typeof val === 'object' && 'value' in val
        ? (val as { value: unknown }).value
        : val
      const normalized = normalizeDecodeField(raw as string | number)
      if (normalized != null) map[key] = normalized
    }
  }

  return map
}

function str(map: Record<string, string | number>, key: string): string | undefined {
  const v = map[key]
  return v != null ? String(v) : undefined
}

function num(map: Record<string, string | number>, key: string): number | undefined {
  const v = map[key]
  if (v == null) return undefined
  const n = Number(v)
  return isNaN(n) ? undefined : n
}

function pint(map: Record<string, string | number>, key: string): number | undefined {
  const v = map[key]
  if (v == null) return undefined
  const n = parseInt(String(v), 10)
  return isNaN(n) ? undefined : n
}

function bool(map: Record<string, string | number>, key: string): boolean | undefined {
  const v = map[key]
  if (v == null) return undefined
  const s = String(v).toLowerCase()
  if (s === 'yes' || s === '1' || s === 'true') return true
  if (s === 'no' || s === '0' || s === 'false') return false
  return undefined
}

function mapToSpecs(map: Record<string, string | number>): VehicleSpecs {
  return {
    make:                    str(map, 'Make'),
    model:                   str(map, 'Model'),
    year:                    num(map, 'Model Year'),
    trim:                    str(map, 'Trim') ?? str(map, 'Series'),
    engine_displacement_ccm: num(map, 'Engine Displacement (ccm)'),
    engine_cylinders:        num(map, 'Engine Cylinders'),
    engine_model:            str(map, 'Engine Model'),
    engine_power_kw:         num(map, 'Engine Power (kW)'),
    fuel_type:               str(map, 'Fuel Type - Primary'),
    fuel_system:             str(map, 'Fuel System'),
    engine_turbine:          str(map, 'Engine Turbine'),
    engine_oil_capacity_l:   num(map, 'Engine Oil Capacity (l)'),
    engine_coolant_l:        num(map, 'Engine Coolant (l)'),
    transmission:            str(map, 'Transmission'),
    drive:                   str(map, 'Drive'),
    number_of_gears:         num(map, 'Number of Gears'),
    front_brakes:            str(map, 'Front Brakes') ?? str(map, 'Front Breaks'),
    rear_brakes:             str(map, 'Rear Brakes') ?? str(map, 'Rear Breaks'),
    abs:                     bool(map, 'ABS'),
    wheel_size:              str(map, 'Wheel Size'),
    wheel_rims_size:         str(map, 'Wheel Rims Size'),
    front_suspension:        str(map, 'Front Suspension'),
    rear_suspension:         str(map, 'Rear Suspension'),
    body_type:               str(map, 'Body'),
    number_of_doors:         num(map, 'Number of Doors'),
    number_of_seats:         pint(map, 'Number of Seats'),
  }
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const apiKey = process.env.VINCARIO_API_KEY
  const secretKey = process.env.VINCARIO_SECRET_KEY
  if (!apiKey || !secretKey) {
    console.error('[vin-decode] missing VINCARIO_API_KEY or VINCARIO_SECRET_KEY')
    return Response.json({ specs: null })
  }

  let vin: string
  try {
    const body = await req.json() as { vin?: unknown }
    vin = String(body.vin ?? '').toUpperCase().trim()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!vin || vin.length < 11) {
    return Response.json({ error: 'VIN too short' }, { status: 400 })
  }

  const controlSum = buildControlSum(vin, apiKey, secretKey)
  const url = `https://api.vincario.com/3.2/${apiKey}/${controlSum}/decode/${vin}.json`

  console.log('[vin-decode] request vin=%s controlSum=%s url=%s', vin, controlSum, url)

  try {
    const res = await fetch(url)
    const text = await res.text()
    console.log('[vin-decode] response status=%d body=%s', res.status, text)

    if (!res.ok) {
      console.error('[vin-decode] non-OK status %d', res.status)
      return Response.json({ specs: null, raw: null })
    }

    const data = JSON.parse(text) as { decode?: unknown }
    const map = parseDecodeMap(data.decode)
    console.log('[vin-decode] parsed map keys:', Object.keys(map))

    const specs = mapToSpecs(map)
    console.log('[vin-decode] parsed specs %o', specs)

    return Response.json({ specs, raw: data })
  } catch (err) {
    console.error('[vin-decode] error %o', err)
    return Response.json({ specs: null, raw: null })
  }
}
