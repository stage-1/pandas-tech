'use client'

import Link from 'next/link'
import { CalendarClock, Car, Users } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { trpc } from '@/lib/trpc'
import { useWelcomeTag } from '@/lib/welcome/use-welcome-tag'
import { cn } from '@/lib/utils'

const easeOutStrong = '[transition-timing-function:cubic-bezier(0.23,1,0.32,1)]'

function KpiCardLink({
  href,
  title,
  description,
  value,
  icon: Icon,
}: {
  href: string
  title: string
  description: string
  value: number
  icon: typeof Car
}) {
  return (
    <Link
      href={href}
      className={cn(
        'block min-h-[88px] rounded-xl outline-none ring-offset-background',
        'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'motion-safe:active:scale-[0.97] motion-reduce:active:scale-100',
        'transition-transform duration-[160ms]',
        easeOutStrong,
        '[@media(hover:hover)_and_(pointer:fine)]:transition-colors [@media(hover:hover)_and_(pointer:fine)]:duration-[160ms]',
        '[@media(hover:hover)_and_(pointer:fine)]:hover:bg-muted/45',
      )}
    >
      <Card className="h-full rounded-xl border-border/80 shadow-none">
        <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
          <CardTitle className="text-sm font-medium leading-snug">
            {title}
          </CardTitle>
          <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        </CardHeader>
        <CardContent className="pt-0">
          <p className="font-display text-3xl font-bold tabular-nums tracking-tight text-foreground">
            {value.toLocaleString('es')}
          </p>
          <CardDescription className="mt-1.5 text-xs leading-relaxed">
            {description}
          </CardDescription>
        </CardContent>
      </Card>
    </Link>
  )
}

function KpiGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-[132px] w-full rounded-xl" />
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const welcomeTag = useWelcomeTag()
  const { data: shop, isPending: shopPending } = trpc.shops.mine.useQuery()
  const {
    data: stats,
    isPending: statsPending,
    isError: statsError,
    refetch,
  } = trpc.dashboard.stats.useQuery(undefined, {
    enabled: Boolean(shop),
    staleTime: 60_000,
    gcTime: 300_000,
  })

  if (shopPending) {
    return (
      <div className="flex max-w-5xl flex-col gap-6">
        <div className="space-y-1">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-40 w-full max-w-5xl" />
      </div>
    )
  }

  if (!shop) {
    return (
      <div className="flex max-w-2xl flex-col gap-6">
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-bold text-foreground">
            Inicio
          </h1>
          <p className="text-sm text-muted-foreground">
            Crea tu taller para desbloquear el resto de la aplicación.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Crear taller</CardTitle>
            <CardDescription>
              Configura tu espacio de trabajo para gestionar clientes, órdenes y configuración.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button render={<Link href="/onboard" />}>
              Crear taller
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex max-w-5xl flex-col gap-6">
      <div className="space-y-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-baseline sm:justify-between sm:gap-x-4">
          <h1 className="font-display text-2xl font-bold text-foreground">
            {shop.name}
          </h1>
          {statsPending ? (
            <Skeleton className="h-4 w-28 sm:shrink-0" aria-hidden />
          ) : stats ? (
            <p className="text-sm text-muted-foreground tabular-nums sm:shrink-0">
              {stats.customerCount.toLocaleString('es')}
              {' '}
              {stats.customerCount === 1 ? 'cliente' : 'clientes'}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground sm:shrink-0" aria-live="polite">
              Clientes no disponibles
            </p>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {welcomeTag.long}
        </p>
      </div>

      {statsPending ? (
        <KpiGridSkeleton />
      ) : statsError ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-4 text-sm text-foreground">
          <p className="font-medium">No pudimos cargar las métricas.</p>
          <p className="mt-1 text-muted-foreground">Comprueba tu conexión e inténtalo de nuevo.</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => void refetch()}
          >
            Reintentar
          </Button>
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <KpiCardLink
            href="/shop/vehicles"
            title="Flota"
            description="Vehículos registrados en tu taller."
            value={stats.vehicleCount}
            icon={Car}
          />
          <KpiCardLink
            href="/shop/vehicles"
            title="Altas recientes"
            description="Vehículos dados de alta en los últimos 30 días."
            value={stats.vehiclesCreatedLast30d}
            icon={CalendarClock}
          />
          <KpiCardLink
            href="/customers"
            title="Clientes con vehículo"
            description="Clientes con al menos un vehículo asignado."
            value={stats.customersWithVehicleCount}
            icon={Users}
          />
        </div>
      ) : null}
    </div>
  )
}
