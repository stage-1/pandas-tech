'use client'

import { useEffect, useState } from 'react'
import { MECHANIC_TIPS, type WelcomeEntry } from './mechanic-tips'
import { COLOMBIA_FACTS } from './colombia-facts'
import { formatWeather, type WeatherSnapshot } from './weather'

const TZ = 'America/Chicago'
const FALLBACK: WelcomeEntry = { short: 'Welcome', long: 'Welcome' }

type CtParts = { year: number; month: number; day: number; hour: number; minute: number; second: number }

function getCtParts(d: Date): CtParts {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hourCycle: 'h23',
  })
  const parts = fmt.formatToParts(d).reduce<Record<string, string>>((acc, p) => {
    if (p.type !== 'literal') acc[p.type] = p.value
    return acc
  }, {})
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  }
}

type SlotInfo =
  | { isActive: false; msUntilNext: number }
  | { isActive: true; typeIndex: 0 | 1 | 2; absoluteSlot: number; msUntilNext: number }

function computeSlot(now: Date): SlotInfo {
  const p = getCtParts(now)
  const dayNum = Math.floor(Date.UTC(p.year, p.month - 1, p.day) / 86_400_000)

  let nextHour: number
  if (p.hour < 8) nextHour = 8
  else if (p.hour < 14) nextHour = 14
  else if (p.hour < 20) nextHour = 20
  else nextHour = 32 // 8am next day

  const secondsLeft = (nextHour - p.hour) * 3600 - p.minute * 60 - p.second
  const msUntilNext = Math.max(1000, secondsLeft * 1000 - now.getMilliseconds() + 500)

  if (p.hour < 8 || p.hour >= 20) return { isActive: false, msUntilNext }

  const slotOfDay = p.hour < 14 ? 0 : 1
  const absoluteSlot = dayNum * 2 + slotOfDay
  const typeIndex = (absoluteSlot % 3) as 0 | 1 | 2
  return { isActive: true, typeIndex, absoluteSlot, msUntilNext }
}

export function useWelcomeTag(): WelcomeEntry {
  const [tag, setTag] = useState<WelcomeEntry>(FALLBACK)

  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | null = null

    const tick = async () => {
      const slot = computeSlot(new Date())

      if (!slot.isActive) {
        if (!cancelled) setTag(FALLBACK)
      } else if (slot.typeIndex === 0) {
        const tip = MECHANIC_TIPS[slot.absoluteSlot % MECHANIC_TIPS.length]
        if (!cancelled) setTag(tip)
      } else if (slot.typeIndex === 2) {
        const fact = COLOMBIA_FACTS[slot.absoluteSlot % COLOMBIA_FACTS.length]
        if (!cancelled) setTag(fact)
      } else {
        // Weather slot — fetch without flashing FALLBACK; previous tag holds briefly.
        try {
          const res = await fetch('/api/weather')
          const data = (await res.json()) as { snapshot: WeatherSnapshot | null }
          if (cancelled) return
          if (data.snapshot) setTag(formatWeather(data.snapshot))
          else setTag(FALLBACK)
        } catch {
          if (!cancelled) setTag(FALLBACK)
        }
      }

      if (!cancelled) {
        timer = setTimeout(tick, slot.msUntilNext)
      }
    }

    tick()

    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [])

  return tag
}
