'use client'

import Link from 'next/link'
import { Plus, Car, Trash2 } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

export default function VehiclesPage() {
  const { data: vehicles, isPending } = trpc.vehicles.list.useQuery()
  const utils = trpc.useUtils()
  const deleteVehicle = trpc.vehicles.delete.useMutation({
    onSuccess: () => utils.vehicles.list.invalidate(),
  })

  if (isPending) {
    return (
      <div className="flex max-w-4xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-8 w-40" />
        </div>
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-bold text-foreground">
            Vehículos
          </h1>
          <p className="text-sm text-muted-foreground">
            Vehículos registrados en tu taller.
          </p>
        </div>
        <Button render={<Link href="/shop/vehicles/new" />} size="sm">
          <Plus className="size-4 mr-1" />
          Agregar
        </Button>
      </div>

      {!vehicles || vehicles.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Car className="size-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm font-medium text-foreground mb-1">
              Sin vehículos
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Registra tu primer vehículo para comenzar.
            </p>
            <Button render={<Link href="/shop/vehicles/new" />} size="sm">
              <Plus className="size-4 mr-1" />
              Agregar vehículo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>VIN</TableHead>
                <TableHead className="hidden md:table-cell">Año</TableHead>
                <TableHead>Marca / Modelo</TableHead>
                <TableHead className="hidden sm:table-cell">Placa</TableHead>
                <TableHead className="hidden md:table-cell">Cliente</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehicles.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-mono text-xs">
                    {v.vin}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {v.year ?? '—'}
                  </TableCell>
                  <TableCell>
                    {[v.make, v.model].filter(Boolean).join(' ') || '—'}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {v.license_plate ?? '—'}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {v.customer_name ?? '—'}
                  </TableCell>
                  <TableCell className="w-10 text-right">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon-sm" disabled={deleteVehicle.isPending}>
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar vehículo?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteVehicle.mutate({ id: v.id })}>
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}
