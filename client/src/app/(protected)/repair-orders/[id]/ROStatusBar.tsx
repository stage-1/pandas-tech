'use client'

import { Loader2 } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import {
  RO_STATUS_LABELS,
  RO_STATUS_TRANSITIONS,
  type RepairOrderStatus,
} from '@/lib/repair-orders'
import { Button } from '@/components/ui/button'

export function ROStatusBar({
  repairOrderId,
  currentStatus,
}: {
  repairOrderId: string
  currentStatus: string
}) {
  const utils = trpc.useUtils()
  const from = currentStatus as RepairOrderStatus

  const updateStatus = trpc.repairOrders.updateStatus.useMutation({
    async onSuccess() {
      console.log('[ROStatusBar] status updated')
      await utils.repairOrders.byId.invalidate({ id: repairOrderId })
      await utils.repairOrders.list.invalidate()
      await utils.invoices.byRepairOrderId.invalidate({ repair_order_id: repairOrderId })
    },
  })

  const nextStates = RO_STATUS_TRANSITIONS[from] ?? []

  if (nextStates.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        No hay cambios de estado disponibles desde <strong>{RO_STATUS_LABELS[from] ?? currentStatus}</strong>.
      </p>
    )
  }

  return (
    <section className="rounded-xl border border-border bg-muted/30 p-4">
      <h2 className="text-sm font-medium text-muted-foreground mb-3">Siguientes estados</h2>
      <div className="flex flex-wrap gap-2">
        {nextStates.map((to) => (
          <Button
            key={to}
            type="button"
            size="sm"
            variant="secondary"
            disabled={updateStatus.isPending}
            onClick={() => updateStatus.mutate({ id: repairOrderId, status: to })}
          >
            {updateStatus.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              RO_STATUS_LABELS[to]
            )}
          </Button>
        ))}
      </div>
      <p className="mt-2 text-[0.6875rem] text-muted-foreground">
        Solo se permiten transiciones válidas; el servidor compara estado actual y evita carreras.
      </p>
    </section>
  )
}
