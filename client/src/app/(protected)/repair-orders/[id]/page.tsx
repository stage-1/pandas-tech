'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Undo2 } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ROHeader } from './ROHeader'
import { ROStatusBar } from './ROStatusBar'
import { LineItemsEditor } from './LineItemsEditor'
import { RONotesSection } from './RONotesSection'
import { InvoiceSection } from './InvoiceSection'

export default function RepairOrderDetailPage() {
  const params = useParams()
  const id = typeof params?.id === 'string' ? params.id : ''
  const { data, isPending } = trpc.repairOrders.byId.useQuery(
    { id },
    { enabled: Boolean(id) },
  )

  if (!id) {
    return (
      <p className="text-sm text-destructive">Identificador de orden inválido.</p>
    )
  }

  if (isPending) {
    return (
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (!data?.repairOrder) {
    return (
      <div className="max-w-xl space-y-4">
        <p className="text-sm text-muted-foreground">No encontramos esa orden.</p>
        <Button render={<Link href="/repair-orders" />} variant="outline" size="sm">
          <Undo2 className="mr-1 size-4" /> Volver a órdenes
        </Button>
      </div>
    )
  }

  const ro = data.repairOrder as Record<string, unknown>

  const currency = String(ro.currency ?? 'USD').trim() || 'USD'

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <div className="flex flex-wrap gap-2">
        <Button render={<Link href="/repair-orders" />} variant="ghost" size="sm">
          <Undo2 className="mr-1 size-4" /> Órdenes
        </Button>
      </div>

      <ROHeader repairOrder={ro as never} />

      <ROStatusBar repairOrderId={String(ro.id)} currentStatus={String(ro.status)} />

      <LineItemsEditor
        repairOrderId={String(ro.id)}
        currency={currency}
        lineItems={data.lineItems as Record<string, unknown>[]}
      />

      <RONotesSection
        repairOrderId={String(ro.id)}
        complaint={(ro.complaint as string | null) ?? null}
        internal_notes={(ro.internal_notes as string | null) ?? null}
      />

      <InvoiceSection repairOrderId={String(ro.id)} status={String(ro.status)} currency={currency} />
    </div>
  )
}
