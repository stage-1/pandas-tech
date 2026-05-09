'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Camera, Loader2 } from 'lucide-react'
import { useIsMobile } from '@/hooks/use-mobile'
import { trpc } from '@/lib/trpc'
import {
  createVehicleSchema,
  type CreateVehicleFormValues,
  type CreateVehicleInput,
  MOBILE_STEPS,
} from '@/lib/vehicles'
import { MAKES, MODELS_BY_MAKE } from '@/lib/vehicle-data'
import { cn } from '@/lib/utils'
import { FormErrorBlock } from '@/components/ui/form-error-block'
import { MobileStepIndicator } from '@/components/ui/mobile-step-indicator'
import { FieldError } from '@/components/ui/field-error'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { VehiclePicker, CustomerPicker } from '@/components/vehicles/vehicle-pickers'
import { VinScanner } from '@/components/vehicles/vin-scanner'
import { VehicleSpecsCard } from '@/components/vehicles/vehicle-specs-card'
import { type VehicleSpecs } from '@/lib/vehicles'

export type Vehicle = {
  id: string
  vin: string | null
  year: number | null
  make: string | null
  model: string | null
  trim: string | null
  color: string | null
  odometer: number | null
  license_plate: string | null
  notes: string | null
  current_customer_id: string | null
  customer_name: string | null
  // Vincario spec fields
  engine_displacement_ccm?: number | null
  engine_cylinders?: number | null
  engine_model?: string | null
  engine_power_kw?: number | null
  fuel_type?: string | null
  fuel_system?: string | null
  engine_turbine?: string | null
  engine_oil_capacity_l?: number | null
  engine_coolant_l?: number | null
  transmission?: string | null
  drive?: string | null
  number_of_gears?: number | null
  front_brakes?: string | null
  rear_brakes?: string | null
  abs?: boolean | null
  wheel_size?: string | null
  wheel_rims_size?: string | null
  front_suspension?: string | null
  rear_suspension?: string | null
  body_type?: string | null
  number_of_doors?: number | null
  number_of_seats?: number | null
}

export function VehicleForm({ vehicle }: { vehicle?: Vehicle }) {
  const isEdit = !!vehicle
  const router = useRouter()
  const isMobile = useIsMobile()
  const [step, setStep] = useState(0)
  const [submitBlocked, setSubmitBlocked] = useState(false)
  const [vinSpecs, setVinSpecs] = useState<VehicleSpecs | null>(() => {
    if (!vehicle) return null
    const s: VehicleSpecs = {}
    const fields: (keyof VehicleSpecs)[] = [
      'engine_displacement_ccm', 'engine_cylinders', 'engine_model', 'engine_power_kw',
      'fuel_type', 'fuel_system', 'engine_turbine', 'engine_oil_capacity_l', 'engine_coolant_l',
      'transmission', 'drive', 'number_of_gears',
      'front_brakes', 'rear_brakes', 'abs', 'wheel_size', 'wheel_rims_size',
      'front_suspension', 'rear_suspension', 'body_type', 'number_of_doors', 'number_of_seats',
    ]
    let hasData = false
    for (const f of fields) {
      const v = (vehicle as Record<string, unknown>)[f]
      if (v != null) { (s as Record<string, unknown>)[f] = v; hasData = true }
    }
    return hasData ? s : null
  })

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm<CreateVehicleFormValues, unknown, CreateVehicleInput>({
    resolver: zodResolver(createVehicleSchema),
    defaultValues: {
      vin: vehicle?.vin ?? '',
      year: vehicle?.year ?? undefined,
      make: vehicle?.make ?? '',
      model: vehicle?.model ?? '',
      trim: vehicle?.trim ?? '',
      color: vehicle?.color ?? '',
      odometer: vehicle?.odometer ?? undefined,
      license_plate: vehicle?.license_plate ?? '',
      notes: vehicle?.notes ?? '',
      customer_id: vehicle?.current_customer_id ?? undefined,
    },
  })

  const customerId = watch('customer_id')
  const selectedMake = watch('make')
  const modelOptions = useMemo(
    () => (selectedMake ? (MODELS_BY_MAKE[selectedMake] ?? []) : []),
    [selectedMake],
  )
  const selectedYear = watch('year')
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear()
    return Array.from({ length: currentYear - 1901 + 1 }, (_, i) => String(currentYear - i))
  }, [])

  const createVehicle = trpc.vehicles.create.useMutation({
    onSuccess: () => router.push('/shop/vehicles'),
  })
  const updateVehicle = trpc.vehicles.update.useMutation({
    onSuccess: () => router.push('/shop/vehicles'),
  })

  const isPending = isEdit ? updateVehicle.isPending : createVehicle.isPending
  const mutationError = isEdit ? updateVehicle.error : createVehicle.error

  function onSubmit(data: CreateVehicleInput) {
    const nullified = {
      year: data.year || null,
      make: data.make || null,
      model: data.model || null,
      trim: data.trim || null,
      color: data.color || null,
      odometer: data.odometer ?? null,
      license_plate: data.license_plate || null,
      notes: data.notes || null,
      customer_id: data.customer_id || null,
    }
    if (isEdit) {
      updateVehicle.mutate({ id: vehicle!.id, ...nullified, specs: vinSpecs ?? undefined })
    } else {
      createVehicle.mutate({ vin: data.vin, ...nullified, specs: vinSpecs ?? undefined })
    }
  }

  async function handleMobileNext() {
    const fields = MOBILE_STEPS[step].fields as unknown as (keyof CreateVehicleFormValues)[]
    const valid = await trigger(fields)
    if (valid) {
      setSubmitBlocked(true)
      setStep((s) => s + 1)
      setTimeout(() => setSubmitBlocked(false), 400)
    }
  }

  const isLastStep = step === MOBILE_STEPS.length - 1

  const submitLabel = isPending ? (
    <span className="flex items-center gap-2">
      <Loader2 className="size-4 animate-spin" />
      Guardando…
    </span>
  ) : isEdit ? (
    'Guardar cambios'
  ) : (
    'Guardar vehículo'
  )

  return (
    <Card>
      <CardContent className="p-5 sm:p-6">
        {isMobile && (
          <MobileStepIndicator step={step} steps={MOBILE_STEPS} />
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
          {/* Step 1: Identificación */}
          <div className={cn(isMobile && step !== 0 && 'hidden')}>
            {!isMobile && (
              <h3 className="text-sm font-medium text-muted-foreground mb-4">
                Identificación
              </h3>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1.5">
                  <Label htmlFor="vin">VIN {!isEdit && '*'}</Label>
                  {!isEdit && (
                    <VinScanner
                      onVinDecoded={(vin, specs) => {
                        setValue('vin', vin)
                        trigger('vin')
                        if (specs) {
                          setVinSpecs(specs)
                          if (specs.make)  setValue('make', specs.make)
                          if (specs.model) setValue('model', specs.model)
                          if (specs.year)  setValue('year', specs.year)
                          if (specs.trim)  setValue('trim', specs.trim)
                        }
                      }}
                      trigger={
                        <Button type="button" variant="ghost" size="xs" className="gap-1 text-muted-foreground">
                          <Camera className="size-3.5" />
                          Escanear
                        </Button>
                      }
                    />
                  )}
                </div>
                <Input
                  id="vin"
                  placeholder="Ej: 1HGBH41JXMN109186"
                  {...register('vin')}
                  aria-invalid={!!errors.vin}
                  className="uppercase"
                  autoFocus={!isEdit}
                  disabled={isEdit}
                />
                {!isEdit && <FieldError message={errors.vin?.message} />}
              </div>
              <div>
                <Label htmlFor="license_plate">Placa</Label>
                <Input
                  id="license_plate"
                  placeholder="Ej: ABC-123"
                  {...register('license_plate')}
                  className="mt-1.5 uppercase"
                />
              </div>
            </div>
          </div>

          {/* Step 2: Detalles */}
          <div className={cn(isMobile && step !== 1 && 'hidden')}>
            {!isMobile && (
              <>
                <div className="border-t border-border my-2" />
                <h3 className="text-sm font-medium text-muted-foreground mb-4 mt-4">
                  Detalles del vehículo
                </h3>
              </>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="year">Año</Label>
                <div className="mt-1.5">
                  <VehiclePicker
                    id="year"
                    options={yearOptions}
                    value={selectedYear ? String(selectedYear) : null}
                    placeholder="Seleccionar año"
                    onChange={(v) => setValue('year', v ? Number(v) : undefined)}
                  />
                </div>
                <FieldError message={errors.year?.message} />
              </div>
              <div>
                <Label htmlFor="make_picker">Marca</Label>
                <div className="mt-1.5">
                  <VehiclePicker
                    id="make_picker"
                    options={MAKES}
                    value={selectedMake}
                    placeholder="Seleccionar marca"
                    onChange={(v) => {
                      setValue('make', v ?? '')
                      setValue('model', '')
                    }}
                  />
                </div>
                <FieldError message={errors.make?.message} />
              </div>
              <div>
                <Label htmlFor="model_picker">Modelo</Label>
                <div className="mt-1.5">
                  <VehiclePicker
                    id="model_picker"
                    options={modelOptions}
                    value={watch('model') || null}
                    placeholder={selectedMake ? 'Seleccionar modelo' : 'Selecciona marca primero'}
                    disabled={!selectedMake}
                    onChange={(v) => setValue('model', v ?? '')}
                  />
                </div>
                <FieldError message={errors.model?.message} />
              </div>
              <div>
                <Label htmlFor="trim">Versión</Label>
                <Input
                  id="trim"
                  placeholder="Ej: SE, XLE"
                  {...register('trim')}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  placeholder="Ej: Blanco"
                  {...register('color')}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="odometer">Kilometraje</Label>
                <Input
                  id="odometer"
                  type="number"
                  min={0}
                  placeholder="Ej: 150000"
                  {...register('odometer')}
                  aria-invalid={!!errors.odometer}
                  className="mt-1.5"
                />
                <FieldError message={errors.odometer?.message} />
              </div>
            </div>
            {vinSpecs && <div className="mt-4"><VehicleSpecsCard specs={vinSpecs} /></div>}
          </div>

          {/* Step 3: Adicional */}
          <div className={cn(isMobile && step !== 2 && 'hidden')}>
            {!isMobile && (
              <>
                <div className="border-t border-border my-2" />
                <h3 className="text-sm font-medium text-muted-foreground mb-4 mt-4">
                  Adicional
                </h3>
              </>
            )}
            <div className="grid gap-4">
              <div>
                <Label htmlFor="customer_picker">Cliente (opcional)</Label>
                <div className="mt-1.5">
                  <CustomerPicker
                    value={customerId}
                    onChange={(id) => setValue('customer_id', id ?? undefined)}
                    initialName={vehicle?.customer_name}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="notes">Notas</Label>
                <Textarea
                  id="notes"
                  placeholder="Notas adicionales sobre el vehículo…"
                  rows={3}
                  {...register('notes')}
                  className="mt-1.5"
                />
              </div>
            </div>
          </div>

          {mutationError && (
            <FormErrorBlock
              title={isEdit ? 'Error al actualizar el vehículo' : 'Error al registrar el vehículo'}
              message={mutationError.message}
            />
          )}

          {isMobile ? (
            <div className={cn('flex items-center gap-3', step > 0 ? 'justify-between' : 'justify-end')}>
              {step > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStep((s) => s - 1)}
                  disabled={isPending}
                  className="text-muted-foreground"
                >
                  Atrás
                </Button>
              )}
              {isLastStep ? (
                <Button type="submit" disabled={isPending || submitBlocked} className="min-w-36">
                  {submitLabel}
                </Button>
              ) : (
                <Button type="button" onClick={handleMobileNext}>
                  Continuar
                </Button>
              )}
            </div>
          ) : (
            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={isPending} className="min-w-36">
                {submitLabel}
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
