'use client'

import { useState } from 'react'
import { Link2, Check } from 'lucide-react'
import { RepairOrderStatusBadge } from '@/components/repair-order-status-badge'
import { Button } from '@/components/ui/button'
import { formatMinor } from '@/lib/format-currency'

type Ro = Record<string, unknown> & {
  id: string
  ro_number: number
  status: string
  currency?: string | null
  subtotal_minor?: unknown
  tax_minor?: unknown
  total_minor?: unknown
  odometer_in?: unknown
  complaint?: unknown
  public_token?: unknown
  make?: unknown
  model?: unknown
  license_plate?: unknown
  vin?: unknown
  customer_name?: unknown
}

function CopyApproveLink({
  token,
  status,
}: {
  token: string
  status: string
}) {
  const [done, setDone] = useState(false)
  if (status !== 'pending') return null
  async function copy() {
    const url =
      typeof window !== 'undefined' ? `${window.location.origin}/approve/${token}` : ''
    await navigator.clipboard.writeText(url)
    setDone(true)
    console.log('[ROHeader] approve link copied', url)
    window.setTimeout(() => setDone(false), 2000)
  }
  return (
    <Button type="button" size="sm" variant="outline" onClick={() => void copy()}>
      {done ? (
        <>
          <Check className="mr-1 size-4 text-emerald-600" />
          Copiado
        </>
      ) : (
        <>
          <Link2 className="mr-1 size-4" />
          Copiar link aprobación
        </>
      )}
    </Button>
  )
}

export function ROHeader({ repairOrder }: { repairOrder: Ro }) {
  const ro = repairOrder
  const cur = String(ro.currency ?? 'USD').trim()
  const st = String(ro.status)

  const makeModel = `${String(ro.make ?? '').trim()} ${String(ro.model ?? '').trim()}`.trim()
  const customerName = repairOrder.customer_name != null ? String(repairOrder.customer_name) : null

  return (
    <header className="flex flex-col gap-4 rounded-xl border border-border bg-white p-4 md:flex-row md:items-start md:justify-between dark:bg-card">
      <div className="min-w-0 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-display text-2xl font-bold text-foreground">
            #{ro.ro_number}
          </h1>
          <RepairOrderStatusBadge status={st} />
        </div>
        <div className="text-sm text-muted-foreground space-y-0.5">
          {makeModel && <p>Vehículo: {makeModel}</p>}
          {ro.license_plate != null && String(ro.license_plate) !== '' && (
            <p>Placa: {String(ro.license_plate)}</p>
          )}
          {ro.vin != null && String(ro.vin) !== '' && (
            <p className="font-mono text-xs">VIN {String(ro.vin)}</p>
          )}
          {customerName && <p>Cliente: {customerName}</p>}
          <p className="tabular-nums text-foreground mt-2">
            Subtotal{' '}
            {formatMinor(Number(ro.subtotal_minor ?? 0), cur)} · IVA{' '}
            {formatMinor(Number(ro.tax_minor ?? 0), cur)}
            <span className="mx-2">·</span>
            Total <strong>{formatMinor(Number(ro.total_minor ?? 0), cur)}</strong>
          </p>
          {ro.odometer_in != null && (
            <p className="text-xs pt-1">Odómetro entrada: {String(ro.odometer_in)} km</p>
          )}
        </div>
      </div>
      <div className="shrink-0 flex flex-wrap gap-2">
        <CopyApproveLink token={String(ro.public_token ?? '')} status={String(ro.status)} />
      </div>
    </header>
  )
}
