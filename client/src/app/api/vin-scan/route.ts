import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import { auth } from '@clerk/nextjs/server'

const resultSchema = z.object({
  vin: z.string(),
  confidence: z.number().min(0).max(1),
  funnyComment: z.string(),
})

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const image = formData.get('image') as File | null
  if (!image) return Response.json({ error: 'No image provided' }, { status: 400 })

  console.log('[vin-scan] received image', { type: image.type, sizeKb: Math.round(image.size / 1024) })

  const bytes = await image.arrayBuffer()
  const base64 = Buffer.from(bytes).toString('base64')

  const { object } = await generateObject({
    model: openai('gpt-4o'),
    schema: resultSchema,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            image: base64,
            mediaType: image.type,
          },
          {
            type: 'text',
            text: `Extract the Vehicle Identification Number (VIN) from this image. The VIN is a 17-character alphanumeric code found on the dashboard (visible through the windshield), driver-side door jamb sticker, or engine bay. Return ONLY uppercase letters and digits — no spaces, hyphens, or other characters. If you cannot find a VIN or are uncertain, set confidence below 0.5. Confidence should reflect how clearly the VIN was visible and how certain you are each character is correct.

IMPORTANT: If the image clearly contains NO vehicle or VIN-related content at all (e.g. it's a pet, food, a selfie, a landscape, artwork, a meme, a screenshot, etc.), set confidence to 0, set vin to an empty string, and set funnyComment to a short, funny, self-aware bilingual (Spanish/English mix, Spanglish) comment about what the image actually shows. No emojis. The tone should be warm and playful, like a friend teasing you. Examples of style (do NOT copy these verbatim — make a fresh one based on what you actually see):
- "Aw tan cute! Pero eso es un gatito, no un VIN."
- "Eso es una pizza... deliciosa pero sin numero de serie."
- "Muy bonito el paisaje, pero los carros tienen VIN, no las montanas."
- "Ese selfie quedo bien, pero necesitamos el VIN, no tu cara."
If the image does contain a vehicle or possible VIN, set funnyComment to an empty string "".`,
          },
        ],
      },
    ],
  })

  console.log('[vin-scan] result', { vin: object.vin, confidence: object.confidence })

  return Response.json(object)
}
