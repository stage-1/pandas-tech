'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { trpc } from '@/lib/trpc'

export default function DashboardPage() {
  const { data: shop, isPending } = trpc.shops.mine.useQuery()

  if (isPending) {
    return (
      <div className="flex max-w-2xl flex-col gap-6">
        <div className="space-y-1">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (shop) {
    return (
      <div className="flex max-w-2xl flex-col gap-6">
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-bold text-foreground">
            {shop.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            Bienvenido a tu taller. Próximamente verás métricas y actividad reciente aquí.
          </p>
        </div>
      </div>
    )
  }

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
