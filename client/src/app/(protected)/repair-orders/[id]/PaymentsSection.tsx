'use client'

import { useState } from 'react'
import { formatMinor } from '@/lib/format-currency'
import { trpc } from '@/lib/trpc'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const METHODS = [
  { value: 'cash', label: 'Efectivo' },
  { value: 'transfer', label: 'Transferencia' },
  { value: 'card', label: 'Tarjeta' },
  { value: 'pse', label: 'PSE' },
  { value: 'check', label: 'Cheque' },
  { value: 'ach', label: 'ACH' },
  { value: 'other', label: 'Otro' },
] as const

export function PaymentsSection({
  repairOrderId,
  invoiceId,
  currency,
}: {
  repairOrderId: string
  invoiceId: string
  currency: string
}) {
  const cc = currency.trim() || 'USD'
  const [amountMinor, setAmountMinor] = useState('')
  const [method, setMethod] = useState<(typeof METHODS)[number]['value']>('cash')

  const utils = trpc.useUtils()
  const { data: payments, isPending } = trpc.invoices.listPayments.useQuery({ invoice_id: invoiceId })

  const record = trpc.invoices.recordPayment.useMutation({
    async onSuccess() {
      console.log('[PaymentsSection] payment recorded')
      await utils.invoices.listPayments.invalidate({ invoice_id: invoiceId })
      await utils.invoices.byRepairOrderId.invalidate({ repair_order_id: repairOrderId })
      setAmountMinor('')
    },
  })

  return (
    <div className="space-y-4 border-t border-border pt-4">
      <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Pagos</h3>

      {isPending ? (
        <p className="text-xs text-muted-foreground">Cargando pagos…</p>
      ) : !payments?.length ? (
        <p className="text-xs text-muted-foreground">Sin pagos registrados.</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {payments.map((p) => {
            const row = p as Record<string, unknown>
            return (
              <li
                key={String(row.id)}
                className="flex flex-wrap justify-between gap-2 rounded-md border border-border/80 px-3 py-2"
              >
                <span className="tabular-nums font-medium">
                  {formatMinor(Number(row.amount_minor ?? 0), cc)}
                </span>
                <span className="text-muted-foreground text-xs">
                  {String(row.method)} · {String(row.status)}
                </span>
              </li>
            )
          })}
        </ul>
      )}

      <form
        className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end"
        onSubmit={(e) => {
          e.preventDefault()
          const n = Number.parseInt(amountMinor, 10)
          if (!Number.isFinite(n) || n <= 0) return
          record.mutate({
            invoice_id: invoiceId,
            amount_minor: n,
            currency: cc,
            method,
          })
        }}
      >
        <div>
          <Label htmlFor="pay_minor">Monto (minor units)</Label>
          <Input
            id="pay_minor"
            inputMode="numeric"
            value={amountMinor}
            onChange={(e) => setAmountMinor(e.target.value)}
            placeholder="Ej: 500000"
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="pay_method">Medio</Label>
          <select
            id="pay_method"
            value={method}
            onChange={(e) => setMethod(e.target.value as typeof method)}
            className="border-input mt-1.5 flex h-9 w-full min-w-[8rem] rounded-lg border bg-transparent px-2.5 text-sm dark:bg-input/30"
          >
            {METHODS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" size="sm" disabled={record.isPending}>
          {record.isPending ? '…' : 'Registrar pago'}
        </Button>
      </form>
      {record.error?.message && <p className="text-xs text-destructive">{record.error.message}</p>}
    </div>
  )
}
