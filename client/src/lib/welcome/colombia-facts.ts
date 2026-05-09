import type { WelcomeEntry } from './mechanic-tips'

export const COLOMBIA_FACTS: readonly WelcomeEntry[] = [
  { short: 'Cristóbal Colón: 5,775 m.',     long: "Pico Cristóbal Colón (5,775 m) is Earth's highest coastal peak." },
  { short: 'Chocó: 10+ m of rain/year.',     long: 'Chocó is among the wettest places on Earth — over 10 m of rain a year.' },
  { short: 'Bogotá sits at 2,640 m.',        long: "Bogotá sits at ~2,640 m — one of the world's highest capitals." },
  { short: 'Caño Cristales blooms red.',     long: 'Caño Cristales blooms red between July and November.' },
  { short: 'Half of world\'s páramos.',      long: "Colombia holds nearly half of the planet's páramo ecosystems." },
  { short: 'Andes splits into 3 here.',      long: 'The Andes splits into three cordilleras only inside Colombia.' },
  { short: 'Nevado del Ruiz active.',        long: 'Nevado del Ruiz is still an active stratovolcano.' },
  { short: 'Tatacoa: dry forest.',           long: 'Tatacoa is a tropical dry forest, not a true desert.' },
  { short: 'Amazon: 35% of country.',        long: 'The Amazon basin covers about 35% of Colombia.' },
  { short: 'Tequendama drops 132 m.',        long: 'Salto del Tequendama drops ~132 m southwest of Bogotá.' },
  { short: 'Guatavita: El Dorado.',          long: 'Lake Guatavita is the legend-source of El Dorado.' },
  { short: 'Two oceans, one country.',       long: 'Colombia is the only South American country with Pacific and Caribbean coasts.' },
] as const

if (process.env.NODE_ENV !== 'production') {
  for (const e of COLOMBIA_FACTS) {
    if (e.short.length > 40) throw new Error(`Colombia fact 'short' exceeds 40 chars: ${e.short}`)
    if (e.long.length > 140) throw new Error(`Colombia fact 'long' exceeds 140 chars: ${e.long}`)
  }
}
