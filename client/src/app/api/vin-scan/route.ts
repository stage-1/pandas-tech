import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import { auth } from '@clerk/nextjs/server'

const resultSchema = z.object({
  vin: z.string(),
  confidence: z.number().min(0).max(1),
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
  const dataUrl = `data:${image.type};base64,${base64}`

  const { object } = await generateObject({
    model: openai('gpt-4o'),
    schema: resultSchema,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            image: dataUrl,
          },
          {
            type: 'text',
            text: `Extract the Vehicle Identification Number (VIN) from this image. The VIN is a 17-character alphanumeric code found on the dashboard (visible through the windshield), driver-side door jamb sticker, or engine bay. Return ONLY uppercase letters and digits — no spaces, hyphens, or other characters. If you cannot find a VIN or are uncertain, set confidence below 0.5. Confidence should reflect how clearly the VIN was visible and how certain you are each character is correct.`,
          },
        ],
      },
    ],
  })

  console.log('[vin-scan] result', { vin: object.vin, confidence: object.confidence })

  return Response.json(object)
}
