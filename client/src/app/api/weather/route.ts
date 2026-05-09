import { LA_CALERA, wmoToEmoji, type WeatherSnapshot } from '@/lib/welcome/weather'

export const revalidate = 3600

type OpenMeteoResponse = {
  current?: {
    temperature_2m?: number
    weather_code?: number
  }
}

export async function GET(): Promise<Response> {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${LA_CALERA.lat}&longitude=${LA_CALERA.lon}` +
    `&current=temperature_2m,weather_code&timezone=America/Bogota`

  try {
    const res = await fetch(url)
    if (!res.ok) return Response.json({ snapshot: null })
    const data = (await res.json()) as OpenMeteoResponse
    const tempC = data.current?.temperature_2m
    const code = data.current?.weather_code
    if (typeof tempC !== 'number' || typeof code !== 'number') {
      return Response.json({ snapshot: null })
    }
    const snapshot: WeatherSnapshot = {
      emoji: wmoToEmoji(code),
      tempC,
      label: LA_CALERA.label,
    }
    return Response.json({ snapshot })
  } catch {
    return Response.json({ snapshot: null })
  }
}
