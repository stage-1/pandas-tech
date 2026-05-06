import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { sql } from '@/lib/postgres'

export async function POST(req: Request) {
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!)
  const payload = await req.text()
  const hdrs = Object.fromEntries((await headers()).entries())

  let event: {
    type: string
    data: {
      id: string
      email_addresses?: { email_address: string }[]
      first_name?: string
      last_name?: string
      image_url?: string
    }
  }
  try {
    event = wh.verify(payload, hdrs) as typeof event
  } catch {
    return new Response('Invalid signature', { status: 400 })
  }

  const { id, email_addresses, first_name, last_name, image_url } = event.data
  const email = email_addresses?.[0]?.email_address ?? null
  const full_name = [first_name, last_name].filter(Boolean).join(' ') || null

  if (event.type === 'user.created' || event.type === 'user.updated') {
    await sql`
      INSERT INTO public.users (id, email, full_name, avatar_url)
      VALUES (${id}, ${email}, ${full_name}, ${image_url ?? null})
      ON CONFLICT (id) DO UPDATE
        SET email      = EXCLUDED.email,
            full_name  = EXCLUDED.full_name,
            avatar_url = EXCLUDED.avatar_url,
            updated_at = now()
    `
  }

  if (event.type === 'user.deleted') {
    await sql`DELETE FROM public.users WHERE id = ${id}`
  }

  return new Response('OK')
}
