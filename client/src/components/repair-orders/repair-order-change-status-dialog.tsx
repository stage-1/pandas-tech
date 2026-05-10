'use client'

import { useEffect, useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import {
  repairOrderStatusSchema,
  RO_STATUS_LABELS,
  RO_STATUS_TRANSITIONS,
  type RepairOrderStatus,
} from '@/lib/repair-orders'
import { RepairOrderStatusBadge } from '@/components/repair-order-status-badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

type Props = {
  repairOrderId: string
  currentStatus: string
}

export function RepairOrderChangeStatusDialog({ repairOrderId, currentStatus }: Props) {
  const [open, setOpen] = useState(false)
  const parsedStatus = repairOrderStatusSchema.safeParse(currentStatus)
  const from = parsedStatus.success ? parsedStatus.data : null
  const nextStates = useMemo(
    () => (from ? (RO_STATUS_TRANSITIONS[from] ?? []) : []),
    [from],
  )
  const [target, setTarget] = useState<string>('')

  const utils = trpc.useUtils()
  const updateStatus = trpc.repairOrders.updateStatus.useMutation({
    async onSuccess() {
      console.log('[RepairOrderChangeStatusDialog] status updated')
      await utils.repairOrders.byId.invalidate({ id: repairOrderId })
      await utils.repairOrders.list.invalidate()
      await utils.invoices.byRepairOrderId.invalidate({ repair_order_id: repairOrderId })
      setOpen(false)
    },
  })

  useEffect(() => {
    if (open && nextStates.length > 0) {
      setTarget(nextStates[0]!)
    }
  }, [open, nextStates])

  if (!from) {
    return (
      <p className="text-xs text-muted-foreground">
        Estado no reconocido: <strong>{currentStatus}</strong>
      </p>
    )
  }

  if (nextStates.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        No hay otros estados disponibles desde <strong>{RO_STATUS_LABELS[from]}</strong>.
      </p>
    )
  }

  const isCancelled = target === 'cancelled'
  const isDeclined = target === 'declined'

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button type="button" variant="outline" size="sm" className="w-full sm:w-auto" />}
      >
        Cambiar estado
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle>Cambiar estado</DialogTitle>
          <DialogDescription>
            Elige el siguiente estado. Solo se muestran transiciones permitidas para la orden actual.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">Estado actual</p>
            <RepairOrderStatusBadge status={currentStatus} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ro-status-target">Nuevo estado</Label>
            <Select
              modal={false}
              value={target || nextStates[0]!}
              onValueChange={(v) => setTarget(String(v ?? ''))}
            >
              <SelectTrigger id="ro-status-target" size="default" className="w-full min-w-0 max-w-full">
                <SelectValue placeholder="Seleccionar…" />
              </SelectTrigger>
              <SelectContent>
                {nextStates.map((s) => (
                  <SelectItem
                    key={s}
                    value={s}
                    className={cn(
                      s === 'cancelled' && 'text-destructive focus:text-destructive',
                      s === 'declined' && 'text-destructive focus:text-destructive',
                    )}
                  >
                    {RO_STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(isCancelled || isDeclined) && (
            <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
              {isCancelled
                ? 'La orden quedará cancelada. Verifica antes de confirmar.'
                : 'La orden quedará rechazada. Verifica antes de confirmar.'}
            </p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:justify-end">
          <DialogClose render={<Button type="button" variant="outline" disabled={updateStatus.isPending} />}>
            Volver
          </DialogClose>
          <Button
            type="button"
            variant={isCancelled || isDeclined ? 'destructive' : 'secondary'}
            disabled={!(target || nextStates[0]) || updateStatus.isPending}
            onClick={() => {
              const next = target || nextStates[0]!
              updateStatus.mutate({
                id: repairOrderId,
                status: next as RepairOrderStatus,
              })
            }}
          >
            {updateStatus.isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Aplicando…
              </>
            ) : (
              'Confirmar'
            )}
          </Button>
        </DialogFooter>

        {updateStatus.error && (
          <p className="text-xs text-destructive">{updateStatus.error.message}</p>
        )}
      </DialogContent>
    </Dialog>
  )
}
