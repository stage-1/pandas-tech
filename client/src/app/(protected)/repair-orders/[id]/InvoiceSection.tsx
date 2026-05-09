'use client'

import { formatMinor } from '@/lib/format-currency'
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

  if (status !== 'completed') {
    return (
      <section className="rounded-xl border border-border border-dashed bg-muted/15 p-4 text-sm text-muted-foreground">
        Completa la orden (estado «Completada») para poder generar una factura desde los totales guardados.
      </section>
    )
  }

  if (isPending) {
    return <p className="text-sm text-muted-foreground">Cargando factura…</p>
  }

  if (!invoice) {
    return (
      <section className="rounded-xl border border-border p-4 space-y-3">
        <h2 className="text-sm font-medium text-foreground">Factura</h2>
        <p className="text-xs text-muted-foreground">
          Se copiarán subtotal, impuestos y total actuales de la orden. Opcional: vencimiento después de crear
          (mejora próxima).
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
    <section className="rounded-xl border border-border p-4 space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-medium text-foreground">
          Factura #{String(inv.invoice_number ?? '—')}
        </h2>
        <p className="text-xs text-muted-foreground tabular-nums">
          Pagado {formatMinor(paid, cc)} / {formatMinor(total, cc)}
        </p>
      </div>
      <div className="text-xs text-muted-foreground space-y-1">
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
