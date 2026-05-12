import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { auth } from '@clerk/nextjs/server'
import { StorageClient } from '@supabase/storage-js'
import sharp from 'sharp'
import { propertyCardAiResultSchema } from '@/lib/property-card-scan'

// ── Rate limiter (in-memory, per userId) ──────────────────────────────────────

const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 20
const RATE_WINDOW_MS = 60 * 60 * 1000 // 1 hour

function isRateLimited(userId: string): boolean {
  const now = Date.now()
  // Prune expired entries to prevent unbounded map growth
  for (const [key, val] of rateLimitMap) {
    if (now > val.resetAt) rateLimitMap.delete(key)
  }
  const entry = rateLimitMap.get(userId)
  if (!entry) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_WINDOW_MS })
    return false
  }
  if (entry.count >= RATE_LIMIT) return true
  entry.count++
  return false
}


// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const image = formData.get('image') as File | null
  if (!image) return Response.json({ error: 'No image provided' }, { status: 400 })

  // [2] File size
  if (image.size > 20 * 1024 * 1024) {
    return Response.json({ error: 'Archivo muy grande (máx. 20 MB).' }, { status: 400 })
  }

  // [3] MIME — must be some image type (mobile browsers vary on exact subtype)
  if (!image.type.startsWith('image/')) {
    return Response.json({ error: `Tipo de archivo no soportado: ${image.type}` }, { status: 400 })
  }

  // [4] Rate limit — before expensive I/O
  if (isRateLimited(userId)) {
    return Response.json({ error: 'Límite de escaneos alcanzado. Intenta más tarde.' }, { status: 429 })
  }

  const rawBytes = Buffer.from(await image.arrayBuffer())

  // [5] Sharp: validate dimensions + re-encode to webp (strips EXIF, neutralizes polyglots)
  // Sharp is the real security gate — it rejects anything that isn't a decodable image
  let safeBuffer: Buffer
  try {
    const meta = await sharp(rawBytes).metadata()
    if (!meta.width || !meta.height) throw new Error('no dimensions')
    if (meta.width > 10000 || meta.height > 10000) throw new Error('too large')
    if (meta.width < 200 || meta.height < 200) throw new Error('too small')
    if (meta.pages && meta.pages > 1) throw new Error('animated')
    safeBuffer = await sharp(rawBytes).webp({ quality: 85 }).toBuffer()
  } catch (e) {
    const reason = e instanceof Error ? e.message : String(e)
    return Response.json({ error: `Sharp falló: ${reason}` }, { status: 400 })
  }

  console.log('[property-card-scan] received image', { type: image.type, sizeKb: Math.round(image.size / 1024) })

  const base64 = safeBuffer.toString('base64')

  let object
  try {
    const result = await generateObject({
      model: openai('gpt-4o'),
      schema: propertyCardAiResultSchema,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              image: base64,
              mediaType: 'image/webp',
            },
            {
              type: 'text',
              text: `Extract all fields from this Colombian vehicle registration card (Licencia de Tránsito / Tarjeta de Propiedad).

For each field, return the extracted value and a confidence score from 0 to 100 reflecting how clearly the text was visible and how certain you are of the reading.

Fields to extract:
- transit_license_no: The "LICENCIA DE TRÁNSITO No." number in the top-right corner (large, often red/printed)
- plate: "PLACA ÚNICA" — the license plate (e.g. BSJ475)
- make: "MARCA" — vehicle brand and line (e.g. NISSAN-PATHFINDER R50)
- vehicle_class: "CLASE DE VEHÍCULO" — e.g. CAMIONETA, AUTOMOVIL
- service_type: "SERVICIO" — e.g. Particular, Público
- engine_number: "NÚMERO DE MOTOR"
- chassis_number: "NÚMERO DE CHASIS" — this is typically the VIN (17-char alphanumeric)
- serial_number: "NÚMERO DE SERIE"
- body_type: "CARROCERÍA TIPO" — e.g. STATION WAGON, SEDAN
- color: "COLOR(ES)" — e.g. GRIS OSCURO, BLANCO
- displacement_cc: "CILINDRAJE" — numeric cubic centimeters (e.g. 3500), null if not visible
- model_year: "MODELO" — 4-digit year (e.g. 2005), null if not visible
- door_count: "No. PUERTAS" — numeric (e.g. 5), null if not visible
- axle_count: "No. EJES" — numeric possibly decimal (e.g. 2.0), null if not visible
- city: "CIUDAD" — city of registration (e.g. Buenaventura)
- issue_date: "DATE" from día/mes/año fields — format as ISO date YYYY-MM-DD, null if not visible

Set confidence to 0 and value to null/empty string for any field that is redacted (shown as XXXXX), not present, or genuinely unreadable.

Set is_valid_property_card to false and funny_comment to a short, warm, bilingual (Spanglish) comment if the image clearly contains NO vehicle registration card at all (e.g. a pet, food, selfie, landscape). No emojis. Examples of style — do NOT copy verbatim, make a fresh one based on what you actually see:
- "Eso es un perro muy lindo, pero los perros no tienen tarjeta de propiedad."
- "Muy rico ese almuerzo, pero necesitamos la tarjeta, no el menú."
If the image does contain a registration card (even partially), set is_valid_property_card to true and funny_comment to "".`,
            },
          ],
        },
      ],
    })
    object = result.object
  } catch (err: unknown) {
    // gpt-4o content policy rejection (NSFW or policy violation)
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.toLowerCase().includes('content') || msg.toLowerCase().includes('policy') || msg.toLowerCase().includes('safety')) {
      return Response.json({ error: 'Image could not be processed' }, { status: 422 })
    }
    throw err
  }

  console.log('[property-card-scan] result', {
    valid: object.is_valid_property_card,
    plate: object.fields.plate,
    chassis: object.fields.chassis_number,
  })

  // Upload to Supabase Storage (non-fatal — scan proceeds even if upload fails)
  let imagePath: string | null = null
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceKey) throw new Error('Storage env vars not configured')

    const storage = new StorageClient(
      `${supabaseUrl}/storage/v1`,
      { apikey: serviceKey, authorization: `Bearer ${serviceKey}` },
    )
    const storagePath = `${userId}/${Date.now()}.webp`
    const { error: uploadError } = await storage
      .from('property-card-scans')
      .upload(storagePath, safeBuffer, { contentType: 'image/webp' })
    if (uploadError) {
      console.error('[property-card-scan] storage upload failed', uploadError)
    } else {
      imagePath = storagePath
    }
  } catch (err) {
    console.error('[property-card-scan] storage upload threw', err)
  }

  return Response.json({ ...object, imagePath })
}
