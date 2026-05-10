import { z } from 'zod'

export const SHOP_THEME_SLUGS = ['pandas', 'ocean', 'forest'] as const

export type ShopThemeSlug = (typeof SHOP_THEME_SLUGS)[number]

export const themeSlugSchema = z.enum(SHOP_THEME_SLUGS)

/** Copy used in onboarding + Settings → Taller */
export const SHOP_THEME_META: Record<
  ShopThemeSlug,
  { label: string; description: string }
> = {
  pandas: {
    label: 'Panda',
    description: 'Rojo y azul marca — tu identidad clásica.',
  },
  ocean: {
    label: 'Océano',
    description: 'Azul claro tipo clínica; modo oscuro navy con acentos contenidos.',
  },
  forest: {
    label: 'Bosque',
    description: 'Tonos marrón y ámbar tipo arboleda, cálidos y legibles.',
  },
}
