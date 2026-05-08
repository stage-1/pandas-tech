'use client'

import Link from 'next/link'
import { Plus, Users } from 'lucide-react'
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

export default function CustomersPage() {
  const { data: customers, isPending } = trpc.customers.list.useQuery()

  if (isPending) {
    return (
      <div className="flex max-w-4xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-8 w-36" />
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
            Clientes
          </h1>
          <p className="text-sm text-muted-foreground">
            Clientes registrados en tu taller.
          </p>
        </div>
        <Button render={<Link href="/customers/new" />} size="sm">
          <Plus className="size-4 mr-1" />
          Agregar
        </Button>
      </div>

      {!customers || customers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="size-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm font-medium text-foreground mb-1">
              Sin clientes
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Registra tu primer cliente para comenzar.
            </p>
            <Button render={<Link href="/customers/new" />} size="sm">
              <Plus className="size-4 mr-1" />
              Agregar cliente
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead className="hidden sm:table-cell">Email</TableHead>
                <TableHead className="hidden md:table-cell">Teléfono</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                    {c.email ?? '—'}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {c.phone ?? '—'}
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
