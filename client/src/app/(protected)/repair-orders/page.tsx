'use client'

import Link from 'next/link'
import { Plus, ClipboardList } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { RepairOrderStatusBadge } from '@/components/repair-order-status-badge'
import { formatMinor } from '@/lib/format-currency'
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

export default function RepairOrdersPage() {
  const { data: rows, isPending } = trpc.repairOrders.list.useQuery()

  if (isPending) {
    return (
      <div className="flex max-w-6xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-8 w-44" />
        </div>
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  return (
    <div className="flex max-w-6xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-bold text-foreground">Órdenes</h1>
          <p className="text-sm text-muted-foreground">Órdenes de taller y totales por moneda.</p>
        </div>
        <Button render={<Link href="/repair-orders/new" />} size="sm">
          <Plus className="mr-1 size-4" />
          Nueva orden
        </Button>
      </div>

      {!rows || rows.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <ClipboardList className="mb-3 size-10 text-muted-foreground/50" />
            <p className="mb-1 text-sm font-medium text-foreground">Sin órdenes</p>
            <p className="mb-4 text-xs text-muted-foreground">Crea la primera orden de reparación.</p>
            <Button render={<Link href="/repair-orders/new" />} size="sm">
              <Plus className="mr-1 size-4" />
              Nueva orden
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Vehículo</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((ro) => {
                  const vehicle =
                    formatMakeModel(ro.make as string | null, ro.model as string | null) ||
                    (ro.license_plate as string | null) ||
                    '—'
                  return (
                    <TableRow key={ro.id}>
                      <TableCell className="font-medium">
                        <Link
                          className="text-primary hover:underline"
                          href={`/repair-orders/${ro.id}`}
                        >
                          {ro.ro_number}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <RepairOrderStatusBadge
                          className="font-normal"
                          status={String(ro.status)}
                        />
                      </TableCell>
                      <TableCell className="max-w-[14rem] truncate">{vehicle}</TableCell>
                      <TableCell className="max-w-[12rem] truncate">
                        {(ro.customer_name as string | null) ?? '—'}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMinor(
                          Number(ro.total_minor),
                          String(ro.currency ?? 'USD').trim(),
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {new Date(ro.created_at as string).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </Card>

          <div className="flex flex-col gap-3 md:hidden">
            {rows.map((ro) => {
              const vehicle =
                formatMakeModel(ro.make as string | null, ro.model as string | null) ||
                'Vehículo'
              return (
                <Card key={ro.id}>
                  <CardContent className="flex flex-col gap-3 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/repair-orders/${ro.id}`}
                          className="text-sm font-semibold text-primary hover:underline"
                        >
                          #{ro.ro_number}{' '}
                          <RepairOrderStatusBadge
                            className="ml-2 align-middle font-normal"
                            status={String(ro.status)}
                          />
                        </Link>
                        <p className="mt-1 truncate text-xs text-muted-foreground">
                          {vehicle}
                          {ro.license_plate ? ` · ${String(ro.license_plate)}` : ''}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {(ro.customer_name as string | null) ?? 'Sin cliente'}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm tabular-nums font-medium">
                        {formatMinor(
                          Number(ro.total_minor),
                          String(ro.currency ?? 'USD').trim(),
                        )}
                      </span>
                    </div>
                    <p className="text-[0.7rem] text-muted-foreground">
                      {new Date(ro.created_at as string).toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
