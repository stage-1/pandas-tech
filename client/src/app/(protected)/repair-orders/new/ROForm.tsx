'use client'

import { useMemo, useState } from 'react'
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

export function ROForm() {
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
      console.log('[ROForm] created', row?.id)
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
          {/* Step cliente + vehículo */}
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
                  className="border-input mt-1.5 flex h-9 w-full rounded-lg border bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 dark:bg-input/30"
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
                  className="border-input mt-1.5 flex h-9 w-full rounded-lg border bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 dark:bg-input/30"
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

          {/* Step detalle */}
          <div className={cn(isMobile && step !== 1 && 'hidden')}>
            {!isMobile && (
              <h3 className="mb-4 text-sm font-medium text-muted-foreground">Detalle</h3>
            )}
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
