import type { WelcomeEntry } from './mechanic-tips'

export const LA_CALERA = { lat: 4.7211, lon: -73.9697, label: 'La Calera' } as const

export type WeatherSnapshot = {
  emoji: string
  tempC: number
  label: string
}

export function wmoToEmoji(code: number): string {
  if (code === 0) return '☀️'
  if (code >= 1 && code <= 3) return '⛅'
  if (code === 45 || code === 48) return '🌫️'
  if (code >= 51 && code <= 67) return '🌧️'
  if (code >= 71 && code <= 77) return '❄️'
  if (code >= 80 && code <= 82) return '🌧️'
  if (code === 85 || code === 86) return '🌨️'
  if (code >= 95 && code <= 99) return '⛈️'
  return '🌡️'
}

export function formatWeather(snap: WeatherSnapshot): WelcomeEntry {
  const t = `${Math.round(snap.tempC)}°C`
  return {
    short: `${snap.emoji} ${t} · ${snap.label}`,
    long: `${snap.emoji} ${t} — ${snap.label}, Cundinamarca`,
  }
}
