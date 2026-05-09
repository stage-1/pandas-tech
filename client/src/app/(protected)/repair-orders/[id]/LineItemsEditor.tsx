'use client'

import { useCallback, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { formatMinor } from '@/lib/format-currency'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

function coerceNum(v: string) {
  const n = Number.parseFloat(v)
  return Number.isFinite(n) ? n : 0
}

function LineRowFields({
  roId,
  item,
}: {
  roId: string
  item: LineRow
}) {
  const id = String(item.id)
  const utils = trpc.useUtils()
  const [desc, setDesc] = useState(String(item.description ?? ''))
  const [qtyStr, setQtyStr] = useState(String(item.qty ?? '1'))
  const [minorStr, setMinorStr] = useState(String(item.unit_price_minor ?? '0'))

  const updateLi = trpc.repairOrders.updateLineItem.useMutation({
    async onSuccess() {
      await utils.repairOrders.byId.invalidate({ id: roId })
      await utils.repairOrders.list.invalidate()
    },
  })

  const pushUpdate = useCallback(async () => {
    const qty = coerceNum(qtyStr)
    if (qty <= 0) return
    const mp = Number.parseInt(minorStr, 10)
    if (!Number.isFinite(mp) || mp < 0) return
    if (!desc.trim()) return

    console.log('[LineItemsEditor] persist row', id)
    await updateLi.mutateAsync({
      id,
      repair_order_id: roId,
      description: desc.trim(),
      qty,
      unit_price_minor: mp,
    })
  }, [desc, qtyStr, minorStr, id, roId, updateLi])

  return (
    <TableRow>
      <TableCell className="w-[7rem]">
        <select
          value={String(item.type ?? 'labor')}
          onChange={(e) => {
            void updateLi.mutateAsync({
              id,
              repair_order_id: roId,
              type: e.target.value as 'labor' | 'part',
            })
          }}
          className="border-input flex h-8 w-full rounded-md border bg-transparent px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring dark:bg-input/30"
        >
          <option value="labor">Mano de obra</option>
          <option value="part">Parte</option>
        </select>
      </TableCell>
      <TableCell>
        <Input
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          onBlur={() => void pushUpdate()}
          className="min-w-[8rem]"
        />
      </TableCell>
      <TableCell className="w-[5.5rem]">
        <Input
          inputMode="decimal"
          value={qtyStr}
          onChange={(e) => setQtyStr(e.target.value)}
          onBlur={() => void pushUpdate()}
        />
      </TableCell>
      <TableCell className="w-[7rem]">
        <Input
          inputMode="numeric"
          value={minorStr}
          onChange={(e) => setMinorStr(e.target.value)}
          onBlur={() => void pushUpdate()}
        />
      </TableCell>
      <TableCell className="w-[5rem] text-center">
        <input
          type="checkbox"
          aria-label="Gravable"
          className="size-4 rounded border accent-primary"
          checked={Boolean(item.taxable)}
          onChange={(e) => {
            void updateLi.mutateAsync({
              id,
              repair_order_id: roId,
              taxable: e.currentTarget.checked,
            })
          }}
        />
      </TableCell>
      <DeleteLineButton roId={roId} lineId={id} />
    </TableRow>
  )
}

function DeleteLineButton({ roId, lineId }: { roId: string; lineId: string }) {
  const utils = trpc.useUtils()
  const del = trpc.repairOrders.removeLineItem.useMutation({
    async onSuccess() {
      await utils.repairOrders.byId.invalidate({ id: roId })
      await utils.repairOrders.list.invalidate()
    },
  })
  return (
    <TableCell className="w-12">
      <AlertDialog>
        <AlertDialogTrigger
          render={<Button variant="ghost" size="icon-sm" className="text-muted-foreground" />}
        >
          <Trash2 className="size-4" />
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar línea?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => del.mutate({ id: lineId, repair_order_id: roId })}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TableCell>
  )
}

export function LineItemsEditor({
  repairOrderId,
  currency,
  lineItems,
}: {
  repairOrderId: string
  currency: string
  lineItems: LineRow[]
}) {
  const utils = trpc.useUtils()

  const addLi = trpc.repairOrders.addLineItem.useMutation({
    async onSuccess() {
      console.log('[LineItemsEditor] line added')
      await utils.repairOrders.byId.invalidate({ id: repairOrderId })
      await utils.repairOrders.list.invalidate()
    },
  })

  const cc = currency.trim() || 'USD'

  return (
    <section className="rounded-xl border border-border overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/30 px-4 py-3">
        <h2 className="text-sm font-medium text-foreground">Líneas de servicio · {cc}</h2>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() =>
              addLi.mutate({
                repair_order_id: repairOrderId,
                type: 'labor',
                description: 'Nuevo trabajo',
                qty: 1,
                unit_price_minor: 0,
                taxable: true,
              })
            }
            disabled={addLi.isPending}
          >
            <Plus className="mr-1 size-4" />
            Labor
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() =>
              addLi.mutate({
                repair_order_id: repairOrderId,
                type: 'part',
                description: 'Nueva parte',
                qty: 1,
                unit_price_minor: 0,
                taxable: true,
              })
            }
            disabled={addLi.isPending}
          >
            <Plus className="mr-1 size-4" />
            Parte
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto p-2 md:p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipo</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Cant.</TableHead>
              <TableHead>Precio (minor)</TableHead>
              <TableHead>IVA?</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {(lineItems ?? []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground text-center text-sm py-8">
                  Sin líneas — agrega mano de obra o partes.
                </TableCell>
              </TableRow>
            ) : (
              lineItems.map((li) => (
                <LineRowFields key={String(li.id)} roId={repairOrderId} item={li} />
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <p className="text-[0.6875rem] text-muted-foreground px-4 py-3 border-t border-border">
        Precio en unidades mínimas de moneda (minor units). Ejemplo: 10 000 minor en COP con 2
        decimales equivale aprox. a {formatMinor(10_000, cc)} mostrado según la moneda RO.
      </p>
    </section>
  )
}
