'use client'

import { cn } from '@/lib/utils'
import {
  SHOP_THEME_META,
  SHOP_THEME_SLUGS,
  type ShopThemeSlug,
} from '@/lib/shop-themes'
import { StepHeader } from './StepHeader'

const SWATCH_BG: Record<ShopThemeSlug, string> = {
  pandas:
    'linear-gradient(135deg,#C01E1E 0%,#30597C 42%,#F8F6F2 100%)',
  ocean:
    'linear-gradient(135deg,#0369a1 0%,#155e75 38%,#e0f2fe 100%)',
  forest:
    'linear-gradient(135deg,#92400e 0%,#57534e 42%,#faf6f1 100%)',
}

export function ThemePick({
  value,
  onChange,
}: {
  value: ShopThemeSlug
  onChange: (slug: ShopThemeSlug) => void
}) {
  return (
    <div className="flex flex-col gap-6">
      <StepHeader
        title="Apariencia del taller"
        description="Elige una paleta. Podrás cambiarla después en Configuración."
      />

      <div className="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Tema visual">
        {SHOP_THEME_SLUGS.map((slug) => {
          const selected = value === slug
          const meta = SHOP_THEME_META[slug]
          return (
            <button
              key={slug}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(slug)}
              className={cn(
                'flex flex-col gap-2 rounded-xl border px-4 py-3 text-left outline-none ring-offset-background',
                'motion-safe:active:scale-[0.97] motion-reduce:active:scale-100',
                'transition-[transform,border-color,box-shadow] duration-150',
                '[transition-timing-function:cubic-bezier(0.23,1,0.32,1)]',
                '[@media(hover:hover)_and_(pointer:fine)]:hover:border-primary/55',
                selected
                  ? 'border-primary shadow-sm ring-2 ring-ring/40'
                  : 'border-border bg-card/80',
              )}
            >
              <span
                className="h-10 w-full rounded-md border border-border/70 shadow-inner"
                style={{ background: SWATCH_BG[slug] }}
                aria-hidden
              />
              <span className="font-medium text-sm text-foreground">{meta.label}</span>
              <span className="text-xs leading-snug text-muted-foreground">
                {meta.description}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
