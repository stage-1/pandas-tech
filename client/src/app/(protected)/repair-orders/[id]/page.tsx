'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Undo2 } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { RepairOrderForm } from '@/components/repair-orders/repair-order-form'
import { RepairOrderChangeStatusDialog } from '@/components/repair-orders/repair-order-change-status-dialog'
import { ROHeader } from './ROHeader'
import { LineItemsEditor } from './LineItemsEditor'
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

  const makeModel = `${String(ro.make ?? '').trim()} ${String(ro.model ?? '').trim()}`.trim()
  const plate =
    ro.license_plate != null && String(ro.license_plate) !== ''
      ? String(ro.license_plate)
      : ''
  const vehicleLine = [makeModel, plate].filter(Boolean).join(' · ') || '—'

  const odomRaw = ro.odometer_in
  const odometerIn =
    odomRaw != null && odomRaw !== ''
      ? Number(odomRaw)
      : null
  const odometerSanitized =
    odometerIn != null && Number.isFinite(odometerIn) ? odometerIn : null

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <div className="flex flex-wrap gap-2">
        <Button render={<Link href="/repair-orders" />} variant="ghost" size="sm">
          <Undo2 className="mr-1 size-4" /> Órdenes
        </Button>
      </div>

      <ROHeader repairOrder={ro as never} />

      <section className="rounded-xl border border-border bg-white px-4 py-3 dark:bg-card">
        <RepairOrderChangeStatusDialog
          repairOrderId={String(ro.id)}
          currentStatus={String(ro.status)}
        />
      </section>

      <RepairOrderForm
        mode="edit"
        repairOrderId={String(ro.id)}
        summary={{
          customerName: String(ro.customer_name ?? 'Sin cliente'),
          vehicleLine,
          vin: ro.vin != null && String(ro.vin).trim() !== '' ? String(ro.vin) : null,
        }}
        complaint={(ro.complaint as string | null) ?? null}
        internal_notes={(ro.internal_notes as string | null) ?? null}
        odometer_in={odometerSanitized}
      />

      <LineItemsEditor
        repairOrderId={String(ro.id)}
        currency={currency}
        lineItems={data.lineItems as Record<string, unknown>[]}
      />

      <InvoiceSection repairOrderId={String(ro.id)} status={String(ro.status)} currency={currency} />
    </div>
  )
}
