'use client'

import Link from 'next/link'
import { Plus, Car, Pencil, Trash2 } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { formatMakeModel } from '@/lib/format-display'
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

function DeleteVehicleDialog({
  isPending,
  onConfirm,
}: {
  isPending: boolean
  onConfirm: () => void
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground hover:text-destructive"
            disabled={isPending}
          />
        }
      >
        <Trash2 className="size-4" />
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
          <AlertDialogAction variant="destructive" onClick={onConfirm}>
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default function VehiclesPage() {
  const { data: vehicles, isPending } = trpc.vehicles.list.useQuery()
  const utils = trpc.useUtils()
  const deleteVehicle = trpc.vehicles.delete.useMutation({
    onSuccess: () => utils.vehicles.list.invalidate(),
  })

  if (isPending) {
    return (
      <div className="flex max-w-6xl flex-col gap-6">
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
    <div className="flex max-w-6xl flex-col gap-6">
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
        <>
          {/* Desktop / tablet — table, only rendered at md+ */}
          <Card className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>VIN</TableHead>
                  <TableHead>Año</TableHead>
                  <TableHead>Marca / Modelo</TableHead>
                  <TableHead>Placa</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicles.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell
                      className="font-mono text-xs max-w-[10ch] truncate"
                      title={v.vin ?? undefined}
                    >
                      {v.vin}
                    </TableCell>
                    <TableCell>
                      {v.year ?? (
                        <span className="text-xs text-muted-foreground">Sin año</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {formatMakeModel(v.make, v.model) || (
                        <span className="text-xs text-muted-foreground">Sin datos</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {v.license_plate ?? (
                        <span className="text-xs text-muted-foreground">Sin placa</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {v.customer_name ?? (
                        <span className="text-xs text-muted-foreground">Sin cliente</span>
                      )}
                    </TableCell>
                    <TableCell className="w-20 text-right">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        render={<Link href={`/shop/vehicles/${v.id}/edit`} />}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <DeleteVehicleDialog
                        isPending={deleteVehicle.isPending}
                        onConfirm={() => deleteVehicle.mutate({ id: v.id })}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* Mobile — compact card per vehicle */}
          <div className="flex flex-col gap-3 md:hidden">
            {vehicles.map((v) => (
              <Card key={v.id}>
                <CardContent className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {formatMakeModel(v.make, v.model) || (
                        <span className="text-muted-foreground font-normal">Sin datos</span>
                      )}
                      {v.year && (
                        <span className="ml-1 font-normal text-muted-foreground">
                          {v.year}
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground truncate">
                      <span className="font-mono">{v.vin ?? '—'}</span>
                      {v.license_plate && ` · ${v.license_plate}`}
                      {v.customer_name && ` · ${v.customer_name}`}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      render={<Link href={`/shop/vehicles/${v.id}/edit`} />}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <DeleteVehicleDialog
                      isPending={deleteVehicle.isPending}
                      onConfirm={() => deleteVehicle.mutate({ id: v.id })}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
