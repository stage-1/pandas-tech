'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { Loader2 } from 'lucide-react'
import { useIsMobile } from '@/hooks/use-mobile'
import { trpc } from '@/lib/trpc'
import { createRepairOrderSchema, RO_MOBILE_STEPS } from '@/lib/repair-orders'
import { cn } from '@/lib/utils'
import { MobileStepIndicator } from '@/components/ui/mobile-step-indicator'
import { FieldError } from '@/components/ui/field-error'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { FormErrorBlock } from '@/components/ui/form-error-block'

type FormValues = {
  customer_id: string
  vehicle_id: string
  complaint: string
  internal_notes: string
  odometer_in: string
}

function normText(s: string): string | null {
  const t = s.trim()
  return t === '' ? null : t
}

function normOdometerInput(s: string): number | null {
  const t = s.trim()
  if (t === '') return null
  const n = Number.parseInt(t, 10)
  return Number.isFinite(n) && n >= 0 ? n : null
}

type EditSummary = {
  customerName: string
  vehicleLine: string
  vin: string | null
}

type RepairOrderFormProps =
  | { mode: 'create' }
  | {
      mode: 'edit'
      repairOrderId: string
      summary: EditSummary
      complaint: string | null
      internal_notes: string | null
      odometer_in: number | null
    }

/** Create: customer/vehicle pickers + detalle (same as /repair-orders/new). */
function RepairOrderFormCreate() {
  const router = useRouter()
  const isMobile = useIsMobile()
  const [step, setStep] = useState(0)
  const { data: shop } = trpc.shops.mine.useQuery()
  const { data: customers } = trpc.customers.list.useQuery()
  const { data: vehicles } = trpc.vehicles.list.useQuery()
  const utils = trpc.useUtils()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      customer_id: '',
      vehicle_id: '',
      complaint: '',
      internal_notes: '',
      odometer_in: '',
    },
  })

  const selectedCustomerId = watch('customer_id')

  const vehicleOptions = useMemo(() => {
    if (!vehicles?.length) return []
    if (!selectedCustomerId) return vehicles
    const matched = vehicles.filter(
      (v) => String(v.current_customer_id ?? '') === selectedCustomerId,
    )
    return matched.length > 0 ? matched : vehicles
  }, [vehicles, selectedCustomerId])

  const createRO = trpc.repairOrders.create.useMutation({
    onSuccess: async (row) => {
      console.log('[RepairOrderForm] created', row?.id)
      await utils.repairOrders.list.invalidate()
      await utils.dashboard.stats.invalidate()
      router.push(`/repair-orders/${row.id}`)
    },
  })

  async function submit(data: FormValues) {
    const odom =
      data.odometer_in.trim() === '' ? undefined : Number.parseInt(data.odometer_in, 10)
    const parsed = createRepairOrderSchema.safeParse({
      customer_id: data.customer_id,
      vehicle_id: data.vehicle_id,
      complaint: data.complaint.trim() === '' ? null : data.complaint,
      internal_notes: data.internal_notes.trim() === '' ? null : data.internal_notes,
      odometer_in: Number.isFinite(odom) ? odom : null,
    })
    if (!parsed.success) {
      const fst = parsed.error.issues[0]
      const path = (fst?.path?.[0] as string | undefined) ?? '_root'
      setError(path as keyof FormValues, { message: fst?.message ?? 'Datos inválidos' })
      return
    }
    createRO.mutate(parsed.data)
  }

  async function handleMobileNext() {
    const fields = RO_MOBILE_STEPS[step].fields as unknown as (keyof FormValues)[]
    const ok = await trigger(fields)
    if (!ok) return
    if (step === 0) {
      const pv = createRepairOrderSchema.pick({ customer_id: true, vehicle_id: true }).safeParse({
        customer_id: watch('customer_id'),
        vehicle_id: watch('vehicle_id'),
      })
      if (!pv.success) {
        const fst = pv.error.issues[0]
        const path = fst?.path[0]
        if (path === 'customer_id' || path === 'vehicle_id') {
          setError(path, { message: fst?.message ?? 'Requerido' })
        }
        return
      }
    }
    setStep((s) => s + 1)
  }

  const isLastStep = step === RO_MOBILE_STEPS.length - 1

  const submitLabel = createRO.isPending ? (
    <span className="flex items-center gap-2">
      <Loader2 className="size-4 animate-spin" />
      Creando…
    </span>
  ) : (
    'Crear orden'
  )

  return (
    <Card>
      <CardContent className="space-y-4 p-5 sm:p-6">
        {shop?.currency && (
          <p className="text-xs text-muted-foreground">
            Moneda del taller: <span className="font-medium">{String(shop.currency)}</span> (
            {String(shop.country_code ?? '')})
          </p>
        )}

        {isMobile && <MobileStepIndicator step={step} steps={RO_MOBILE_STEPS} />}

        <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-6">
          <div className={cn(isMobile && step !== 0 && 'hidden')}>
            {!isMobile && (
              <h3 className="mb-4 text-sm font-medium text-muted-foreground">Cliente y vehículo</h3>
            )}
            <div className="grid gap-4">
              <div>
                <Label htmlFor="customer_id">Cliente *</Label>
                <select
                  id="customer_id"
                  {...register('customer_id', {
                    required: 'Selecciona un cliente',
                    onChange: () => {
                      setValue('vehicle_id', '')
                    },
                  })}
                  aria-invalid={!!errors.customer_id}
                  className="border-input mt-1.5 flex h-9 w-full rounded-lg border bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                  autoFocus={!isMobile || step === 0}
                >
                  <option value="">Seleccionar...</option>
                  {customers?.map((c) => (
                    <option key={String(c.id)} value={String(c.id)}>
                      {String(c.name)}
                    </option>
                  ))}
                </select>
                <FieldError message={errors.customer_id?.message} />
              </div>

              <div>
                <Label htmlFor="vehicle_id">Vehículo *</Label>
                <select
                  id="vehicle_id"
                  {...register('vehicle_id', { required: 'Selecciona un vehículo' })}
                  aria-invalid={!!errors.vehicle_id}
                  className="border-input mt-1.5 flex h-9 w-full rounded-lg border bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                  disabled={!selectedCustomerId}
                >
                  <option value="">Seleccionar...</option>
                  {vehicleOptions.map((v) => {
                    const label =
                      [
                        String(v.license_plate ?? '').trim(),
                        [v.make, v.model]
                          .map((x) => String(x ?? '').trim())
                          .filter(Boolean)
                          .join(' '),
                      ]
                        .filter(Boolean)
                        .join(' · ') || String(v.vin ?? '')
                    return (
                      <option key={String(v.id)} value={String(v.id)}>
                        {label || '—'}
                      </option>
                    )
                  })}
                </select>
                <FieldError message={errors.vehicle_id?.message} />
                {selectedCustomerId &&
                  vehicleOptions.length > 0 &&
                  !vehicleOptions.some(
                    (v) => String(v.current_customer_id ?? '') === selectedCustomerId,
                  ) && (
                    <p className="mt-2 text-[0.6875rem] text-amber-600 dark:text-amber-400">
                      Ningún vehículo tiene este cliente como actual; mostrando todos los del taller.
                    </p>
                  )}
              </div>
            </div>
          </div>

          <div className={cn(isMobile && step !== 1 && 'hidden')}>
            {!isMobile && <h3 className="mb-4 text-sm font-medium text-muted-foreground">Detalle</h3>}
            <div className="grid gap-4">
              <div>
                <Label htmlFor="complaint">Queja / síntomas</Label>
                <Textarea id="complaint" {...register('complaint')} rows={4} className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="internal_notes">Notas internas</Label>
                <Textarea
                  id="internal_notes"
                  {...register('internal_notes')}
                  rows={3}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="odometer_in">Odómetro entrada</Label>
                <Input
                  id="odometer_in"
                  inputMode="numeric"
                  {...register('odometer_in')}
                  placeholder="Opcional"
                  className="mt-1.5"
                />
                <FieldError message={errors.odometer_in?.message} />
              </div>
            </div>
          </div>

          {createRO.error && (
            <FormErrorBlock
              title="Error al crear la orden"
              message={createRO.error.message || 'Algo salió mal. Intenta de nuevo.'}
            />
          )}

          {isMobile && !isLastStep && (
            <div className="flex gap-2">
              <Button type="button" variant="outline" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>
                Atrás
              </Button>
              <Button type="button" className="flex-1" onClick={() => void handleMobileNext()}>
                Siguiente
              </Button>
            </div>
          )}
          {(isMobile && isLastStep) || !isMobile ? (
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={createRO.isPending}>
                {submitLabel}
              </Button>
              <Button type="button" variant="ghost" render={<Link href="/repair-orders" />}>
                Cancelar
              </Button>
            </div>
          ) : null}
        </form>
      </CardContent>
    </Card>
  )
}

/** Edit: read-only cliente/vehículo/VIN; mismos campos de detalle con guardado diferido (API no cambia cliente/vehículo). */
function RepairOrderFormEdit({
  repairOrderId,
  summary,
  complaint: initialComplaint,
  internal_notes: initialNotes,
  odometer_in: initialOdometer,
}: Extract<RepairOrderFormProps, { mode: 'edit' }>) {
  const [complaint, setComplaint] = useState(initialComplaint ?? '')
  const [internalNotes, setInternalNotes] = useState(initialNotes ?? '')
  const [odometerStr, setOdometerStr] = useState(
    initialOdometer != null ? String(initialOdometer) : '',
  )
  const skipNext = useRef(true)
  const lastSaved = useRef({
    complaint: normText(initialComplaint ?? ''),
    internal_notes: normText(initialNotes ?? ''),
    odometer_in: initialOdometer ?? null,
  })

  useEffect(() => {
    const c0 = initialComplaint ?? ''
    const n0 = initialNotes ?? ''
    const o0 = initialOdometer != null ? String(initialOdometer) : ''
    setComplaint(c0)
    setInternalNotes(n0)
    setOdometerStr(o0)
    lastSaved.current = {
      complaint: normText(c0),
      internal_notes: normText(n0),
      odometer_in: initialOdometer ?? null,
    }
    skipNext.current = true
  }, [initialComplaint, initialNotes, initialOdometer])

  const utils = trpc.useUtils()
  const update = trpc.repairOrders.update.useMutation({
    async onSuccess() {
      console.log('[RepairOrderForm] edit persisted')
      await utils.repairOrders.byId.invalidate({ id: repairOrderId })
      await utils.repairOrders.list.invalidate()
    },
  })

  useEffect(() => {
    if (skipNext.current) {
      skipNext.current = false
      return
    }

    const tid = window.setTimeout(() => {
      const c = normText(complaint)
      const n = normText(internalNotes)
      const odom = normOdometerInput(odometerStr)
      const prev = lastSaved.current
      if (c === prev.complaint && n === prev.internal_notes && odom === prev.odometer_in) return

      console.log('[RepairOrderForm] debounced save (edit)')

      update.mutate(
        { id: repairOrderId, complaint: c, internal_notes: n, odometer_in: odom },
        {
          onSuccess: () => {
            lastSaved.current = {
              complaint: c,
              internal_notes: n,
              odometer_in: odom,
            }
          },
        },
      )
    }, 800)

    return () => window.clearTimeout(tid)
  }, [complaint, internalNotes, odometerStr, repairOrderId, update])

  const vinDisplay = (summary.vin && String(summary.vin).trim() !== '')
    ? String(summary.vin)
    : '—'

  return (
    <Card>
      <CardContent className="space-y-6 p-5 sm:p-6">
        <h2 className="text-sm font-medium text-foreground">Datos de la orden</h2>

        <div className="grid gap-3 text-sm">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Cliente</p>
            <p className="mt-1 text-foreground">{summary.customerName || '—'}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Vehículo</p>
            <p className="mt-1 text-foreground">{summary.vehicleLine || '—'}</p>
          </div>
          <div>
            <Label htmlFor="ro-vin-readonly">VIN</Label>
            <Input
              id="ro-vin-readonly"
              value={vinDisplay}
              disabled
              readOnly
              className="mt-1.5 cursor-not-allowed font-mono text-sm opacity-90"
            />
            <p className="mt-1 text-[0.6875rem] text-muted-foreground">
              El VIN no se puede cambiar en una orden existente.
            </p>
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <h3 className="mb-4 text-sm font-medium text-muted-foreground">Detalle</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="edit-complaint">Queja / síntomas (cliente)</Label>
              <Textarea
                id="edit-complaint"
                rows={4}
                value={complaint}
                onChange={(e) => setComplaint(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="edit-internal_notes">Notas internas</Label>
              <Textarea
                id="edit-internal_notes"
                rows={4}
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                className="mt-1.5"
              />
            </div>
          </div>
          <div className="mt-4 max-w-xs">
            <Label htmlFor="edit-odometer_in">Odómetro entrada</Label>
            <Input
              id="edit-odometer_in"
              inputMode="numeric"
              value={odometerStr}
              onChange={(e) => setOdometerStr(e.target.value)}
              placeholder="Opcional"
              className="mt-1.5"
            />
          </div>
        </div>

        {update.isPending && (
          <p className="text-[0.6875rem] text-muted-foreground">Guardando…</p>
        )}
        {update.error?.message && (
          <p className="text-xs text-destructive">{update.error.message}</p>
        )}
      </CardContent>
    </Card>
  )
}

export function RepairOrderForm(props: RepairOrderFormProps) {
  if (props.mode === 'edit') {
    return <RepairOrderFormEdit {...props} />
  }
  return <RepairOrderFormCreate />
}
