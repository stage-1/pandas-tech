'use client'

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { trpc } from '@/lib/trpc'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { EditVehicleForm, type Vehicle } from './EditVehicleForm'

export default function EditVehiclePage({ params }: { params: { id: string } }) {
  const { data: vehicle, isPending } = trpc.vehicles.byId.useQuery({ id: params.id })

  if (isPending) {
    return (
      <div className="flex max-w-2xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (!vehicle) {
    notFound()
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-bold text-foreground">
            Editar vehículo
          </h1>
          <p className="text-sm text-muted-foreground font-mono">
            {vehicle.vin ?? '—'}
          </p>
        </div>
        <Button render={<Link href="/shop/vehicles" />} variant="ghost" size="sm">
          Volver
        </Button>
      </div>
      <EditVehicleForm vehicle={vehicle as unknown as Vehicle} />
    </div>
  )
}
