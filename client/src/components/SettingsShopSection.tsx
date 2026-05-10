'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Store } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ShopThemePreviewMock } from '@/components/ShopThemePreviewMock'
import {
  SHOP_THEME_META,
  SHOP_THEME_SLUGS,
  type ShopThemeSlug,
} from '@/lib/shop-themes'
import { cn } from '@/lib/utils'

function normalizeSlug(theme_slug: unknown): ShopThemeSlug {
  return SHOP_THEME_SLUGS.includes(theme_slug as ShopThemeSlug)
    ? (theme_slug as ShopThemeSlug)
    : 'pandas'
}

export function SettingsShopSection() {
  const utils = trpc.useUtils()
  const { data: shop, isPending } = trpc.shops.mine.useQuery()
  const [selectedSlug, setSelectedSlug] = useState<ShopThemeSlug | null>(null)

  const savedSlug = shop ? normalizeSlug(shop.theme_slug) : null
  const isOwner = shop?.membership_role === 'owner'

  useEffect(() => {
    if (savedSlug) setSelectedSlug(savedSlug)
  }, [savedSlug])

  const updateTheme = trpc.shops.updateTheme.useMutation({
    onSuccess: async () => {
      await utils.shops.mine.invalidate()
    },
  })

  if (isPending) {
    return (
      <Card className="border-border/90">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-full max-w-md" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-36 w-full rounded-xl" />
        </CardContent>
      </Card>
    )
  }

  if (!shop) {
    return (
      <Card className="border-border/90">
        <CardHeader>
          <CardTitle className="text-lg">Taller</CardTitle>
          <CardDescription>
            Crea un taller para ver ajustes de tienda y tema.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button render={<Link href="/dashboard" />}>Ir al inicio</Button>
          <Button render={<Link href="/onboard" />} variant="secondary">
            Crear taller
          </Button>
        </CardContent>
      </Card>
    )
  }

  const draft = selectedSlug ?? savedSlug ?? 'pandas'
  const dirty = isOwner && savedSlug !== null && draft !== savedSlug

  return (
    <Card className="border-border/90">
      <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-4">
        <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
          <Store className="size-5 text-muted-foreground" aria-hidden />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0">
            <CardTitle className="text-lg">Taller</CardTitle>
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Shop
            </span>
          </div>
          <CardDescription>
            <span className="font-medium text-foreground/90">{shop.name}</span>
            {' · '}
            Tema y apariencia compartidos con tu equipo.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 border-t border-border/80 pt-5">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Tema visual</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {isOwner
              ? 'Toca un tema para previsualizarlo; «Aplicar tema» lo guarda para todo el taller.'
              : 'Vista previa de las paletas. Solo el dueño puede cambiar el tema activo.'}
          </p>
        </div>

        <div
          className="grid gap-4 sm:grid-cols-3"
          role={isOwner ? 'radiogroup' : undefined}
          aria-label={isOwner ? 'Seleccionar tema del taller' : undefined}
        >
          {SHOP_THEME_SLUGS.map((slug) => {
            const meta = SHOP_THEME_META[slug]
            const isSaved = slug === savedSlug
            const isSelected = slug === draft

            return (
              <div key={slug} className="flex flex-col gap-2">
                <button
                  type="button"
                  disabled={!isOwner}
                  onClick={() => isOwner && setSelectedSlug(slug)}
                  className={cn(
                    'rounded-xl border text-left outline-none ring-offset-background',
                    'transition-[transform,border-color,box-shadow] duration-150',
                    '[transition-timing-function:cubic-bezier(0.23,1,0.32,1)]',
                    'motion-safe:active:scale-[0.98] motion-reduce:active:scale-100',
                    isOwner && [
                      '@media(hover:hover)_and_(pointer:fine):hover:border-primary/50',
                      'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    ],
                    isSelected
                      ? 'border-primary shadow-sm ring-2 ring-ring/35'
                      : 'border-border bg-card/40',
                    !isOwner && 'cursor-default opacity-95',
                  )}
                  role={isOwner ? 'radio' : undefined}
                  aria-checked={isOwner ? isSelected : undefined}
                >
                  <ShopThemePreviewMock
                    slug={slug}
                    className="pointer-events-none rounded-t-[10px] rounded-b-none border-0 shadow-none"
                  />
                  <div className="border-t border-border/60 px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium leading-tight">{meta.label}</span>
                      {isSaved ? (
                        <span className="shrink-0 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary">
                          Activo
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                      {meta.description}
                    </p>
                  </div>
                </button>
              </div>
            )
          })}
        </div>

        {isOwner ? (
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              size="sm"
              disabled={!dirty || updateTheme.isPending}
              className="motion-safe:active:scale-[0.97] motion-reduce:active:scale-100"
              onClick={() => updateTheme.mutate({ theme_slug: draft })}
            >
              {updateTheme.isPending ? 'Guardando…' : 'Aplicar tema'}
            </Button>
            {dirty ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                disabled={updateTheme.isPending}
                onClick={() => setSelectedSlug(savedSlug!)}
              >
                Descartar
              </Button>
            ) : null}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Tema guardado en el taller:{' '}
            <span className="font-medium text-foreground">
              {savedSlug ? SHOP_THEME_META[savedSlug].label : '—'}
            </span>
          </p>
        )}

        {updateTheme.error ? (
          <p className="text-sm text-destructive">{updateTheme.error.message}</p>
        ) : null}
      </CardContent>
    </Card>
  )
}
