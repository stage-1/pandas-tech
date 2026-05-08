'use client'

import { trpc } from '@/lib/trpc'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { COUNTRY_CONFIG, type CountryCode } from '@/lib/onboard'

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  )
}

export default function ShopPage() {
  const { data: shop, isPending } = trpc.shops.mine.useQuery()

  if (isPending) {
    return (
      <div className="flex max-w-2xl flex-col gap-6">
        <div className="space-y-1">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (!shop) return null

  const country = (shop.country_code?.toUpperCase() ?? 'CO') as CountryCode
  const config = COUNTRY_CONFIG[country]

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div className="space-y-1">
        <h1 className="font-display text-2xl font-bold text-foreground">
          Taller
        </h1>
        <p className="text-sm text-muted-foreground">
          Información de tu taller.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{shop.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border bg-muted/40 px-4">
            <Row label="País" value={config ? config.name : shop.country_code} />
            <Row label="Moneda" value={shop.currency ?? config?.currency ?? '—'} />
            {config?.iva !== null && config?.iva !== undefined && (
              <Row label="IVA" value={`${Math.round(config.iva * 100)}%`} />
            )}
            <Row label={config?.label ?? 'Tax ID'} value={shop.tax_id || '—'} />
            <Row label="Zona horaria" value={shop.timezone ?? config?.timezone ?? '—'} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
