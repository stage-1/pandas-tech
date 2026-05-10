'use client'

import { formatMinor } from '@/lib/format-currency'
import {
  RO_STATUS_TRANSITIONS,
  repairOrderStatusSchema,
} from '@/lib/repair-orders'
import { trpc } from '@/lib/trpc'
import { Button } from '@/components/ui/button'
import { PaymentsSection } from './PaymentsSection'

export function InvoiceSection({
  repairOrderId,
  status,
  currency,
}: {
  repairOrderId: string
  status: string
  currency: string
}) {
  const cc = currency.trim() || 'USD'
  const utils = trpc.useUtils()
  const { data: invoice, isPending } = trpc.invoices.byRepairOrderId.useQuery({
    repair_order_id: repairOrderId,
  })

  const createInv = trpc.invoices.createForRO.useMutation({
    async onSuccess() {
      console.log('[InvoiceSection] invoice created')
      await utils.invoices.byRepairOrderId.invalidate({ repair_order_id: repairOrderId })
      await utils.repairOrders.byId.invalidate({ id: repairOrderId })
    },
  })

  const updateStatus = trpc.repairOrders.updateStatus.useMutation({
    async onSuccess() {
      console.log('[InvoiceSection] order marked completed')
      await utils.repairOrders.byId.invalidate({ id: repairOrderId })
      await utils.repairOrders.list.invalidate()
      await utils.invoices.byRepairOrderId.invalidate({ repair_order_id: repairOrderId })
    },
  })

  if (status !== 'completed') {
    const parsed = repairOrderStatusSchema.safeParse(status)
    const from = parsed.success ? parsed.data : null
    const next = from ? (RO_STATUS_TRANSITIONS[from] ?? []) : []
    const canComplete = next.includes('completed')
    const blockedHint =
      'Primero avanza la orden hasta «En taller» para poder completarla.'

    return (
      <section className="rounded-xl border border-dashed border-border bg-white p-4 dark:bg-card">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <p className="min-w-0 flex-1 text-sm text-muted-foreground">
            Completa la orden (estado «Completada») para poder generar una factura desde los totales
            guardados.
          </p>
          <Button
            type="button"
            size="lg"
            variant="destructive"
            className="h-11 min-w-[12rem] w-full shrink-0 px-6 sm:ml-auto sm:w-auto"
            disabled={!canComplete || updateStatus.isPending}
            title={!canComplete ? blockedHint : undefined}
            onClick={() => updateStatus.mutate({ id: repairOrderId, status: 'completed' })}
          >
            {updateStatus.isPending ? 'Guardando…' : 'Completar orden'}
          </Button>
        </div>
        {!canComplete && (
          <p className="mt-3 text-xs text-muted-foreground">{blockedHint}</p>
        )}
      </section>
    )
  }

  if (isPending) {
    return <p className="text-sm text-muted-foreground">Cargando factura…</p>
  }

  if (!invoice) {
    return (
      <section className="space-y-3 rounded-xl border border-border bg-white p-4 dark:bg-card">
        <h2 className="text-sm font-medium text-foreground">Factura</h2>
        <p className="text-xs text-muted-foreground">
          Se copiarán subtotal, impuestos y total actuales de la orden. Opcional: vencimiento después
          de crear (mejora próxima).
        </p>
        <Button
          type="button"
          size="sm"
          disabled={createInv.isPending}
          onClick={() => createInv.mutate({ repair_order_id: repairOrderId })}
        >
          {createInv.isPending ? 'Creando…' : 'Crear factura'}
        </Button>
        {createInv.error?.message && (
          <p className="text-xs text-destructive">{createInv.error.message}</p>
        )}
      </section>
    )
  }

  const inv = invoice as Record<string, unknown>
  const paid = Number(inv.amount_paid_minor ?? 0)
  const total = Number(inv.total_minor ?? 0)

  return (
    <section className="space-y-4 rounded-xl border border-border bg-white p-4 dark:bg-card">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-medium text-foreground">
          Factura #{String(inv.invoice_number ?? '—')}
        </h2>
        <p className="text-xs text-muted-foreground tabular-nums">
          Pagado {formatMinor(paid, cc)} / {formatMinor(total, cc)}
        </p>
      </div>
      <div className="space-y-1 text-xs text-muted-foreground">
        <p>
          Subtotal {formatMinor(Number(inv.subtotal_minor ?? 0), cc)} · IVA{' '}
          {formatMinor(Number(inv.tax_minor ?? 0), cc)}
        </p>
      </div>
      <PaymentsSection
        repairOrderId={repairOrderId}
        invoiceId={String(inv.id)}
        currency={String(inv.currency ?? cc).trim() || cc}
      />
    </section>
  )
}
