'use client'

import { useLayoutEffect, useRef } from 'react'
import { trpc } from '@/lib/trpc'
import { SHOP_THEME_SLUGS, type ShopThemeSlug } from '@/lib/shop-themes'

const THEME_CACHE_KEY = 'pandas-tech:shop-appearance'

function slugFromShop(theme_slug: unknown): ShopThemeSlug {
  if (typeof theme_slug === 'string' && SHOP_THEME_SLUGS.includes(theme_slug as ShopThemeSlug)) {
    return theme_slug as ShopThemeSlug
  }
  return 'pandas'
}

function writeThemeCache(shopId: string, slug: ShopThemeSlug) {
  try {
    localStorage.setItem(
      THEME_CACHE_KEY,
      JSON.stringify({ shop_id: shopId, theme_slug: slug }),
    )
  } catch {
    /* quota / private mode */
  }
}

/**
 * Sets `data-shop-theme` for scoped tenant tokens. `pandas` uses `:root` / `.dark`
 * from `v1Pandas.css`; other slugs use `shop-theme-presets.css`.
 * Cache is write-only (avoids mismatched preset vs `shops.mine` after edits).
 */
export function ShopThemeShell({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const { data: shop } = trpc.shops.mine.useQuery()

  useLayoutEffect(() => {
    const root = ref.current
    if (!root) return

    if (!shop?.id) {
      root.removeAttribute('data-shop-theme')
      return
    }

    const slug = slugFromShop(shop.theme_slug)
    root.setAttribute('data-shop-theme', slug)
    writeThemeCache(shop.id, slug)
  }, [shop?.id, shop?.theme_slug])

  return (
    <div ref={ref} className="min-h-svh w-full bg-background">
      {children}
    </div>
  )
}
