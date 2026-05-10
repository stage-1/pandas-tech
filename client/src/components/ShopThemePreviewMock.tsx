import { cn } from '@/lib/utils'
import type { ShopThemeSlug } from '@/lib/shop-themes'

/**
 * Compact UI sample; `data-shop-theme` scopes tokens so each card shows its palette
 * without changing the rest of the app.
 */
export function ShopThemePreviewMock({
  slug,
  className,
}: {
  slug: ShopThemeSlug
  className?: string
}) {
  return (
    <div
      data-shop-theme={slug}
      className={cn(
        'rounded-lg border border-border bg-background p-2.5 text-foreground shadow-inner',
        className,
      )}
    >
      <div className="mb-2 flex h-5 items-center gap-1.5 rounded-md bg-sidebar px-2">
        <span className="size-1.5 shrink-0 rounded-full bg-sidebar-primary" />
        <span className="h-1 flex-1 rounded bg-sidebar-border" />
        <span className="h-1 w-6 rounded bg-muted-foreground/35" />
      </div>
      <div className="mb-2 space-y-1 rounded-md border border-border bg-card p-2 shadow-sm">
        <p className="text-[10px] font-semibold leading-none text-card-foreground">
          Encabezado
        </p>
        <p className="text-[9px] leading-snug text-muted-foreground">
          Texto auxiliar muted
        </p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <span className="inline-flex h-5 items-center rounded-md bg-primary px-2 text-[9px] font-medium text-primary-foreground shadow-sm">
          Primario
        </span>
        <span className="inline-flex h-5 items-center rounded-md bg-secondary px-2 text-[9px] font-medium text-secondary-foreground shadow-sm">
          Secundario
        </span>
        <span
          className="inline-flex h-5 items-center rounded-md border border-border bg-muted px-2 text-[9px] text-muted-foreground"
          aria-hidden
        >
          Muted
        </span>
      </div>
    </div>
  )
}
