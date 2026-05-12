'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Camera, ChevronDown, ChevronUp, FileCheck, Loader2 } from 'lucide-react'
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
import { PropertyCardScanner } from '@/components/vehicles/property-card-scanner'
import { normalizeMake } from '@/lib/make-normalizer'

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
  manufacturer?: string | null
  plant_country?: string | null
  make_logo_url?: string | null
  // property card fields
  transit_license_no?: string | null
  engine_number?: string | null
  serial_number?: string | null
  vehicle_class?: string | null
  service_type?: string | null
  axle_count?: number | null
  registration_city?: string | null
}

export function VehicleForm({ vehicle }: { vehicle?: Vehicle }) {
  const isEdit = !!vehicle
  const router = useRouter()
  const isMobile = useIsMobile()
  const [step, setStep] = useState(0)
  const [submitBlocked, setSubmitBlocked] = useState(false)
  const [scanId, setScanId] = useState<string | undefined>(undefined)
  const [docSectionOpen, setDocSectionOpen] = useState(() =>
    !!(vehicle?.transit_license_no || vehicle?.engine_number || vehicle?.serial_number ||
       vehicle?.vehicle_class || vehicle?.service_type || vehicle?.axle_count || vehicle?.registration_city)
  )

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
      transit_license_no: vehicle?.transit_license_no ?? '',
      engine_number: vehicle?.engine_number ?? '',
      serial_number: vehicle?.serial_number ?? '',
      vehicle_class: vehicle?.vehicle_class ?? '',
      service_type: vehicle?.service_type ?? '',
      axle_count: vehicle?.axle_count ?? undefined,
      registration_city: vehicle?.registration_city ?? '',
      body_type: vehicle?.body_type ?? '',
      number_of_doors: vehicle?.number_of_doors ?? undefined,
      engine_displacement_ccm: vehicle?.engine_displacement_ccm ?? undefined,
    },
  })

  const watchedDocFields = watch([
    'transit_license_no', 'engine_number', 'serial_number',
    'vehicle_class', 'service_type', 'axle_count', 'registration_city',
  ])
  const populatedDocFieldCount = watchedDocFields.filter(v => v != null && v !== '').length

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

  const utils = trpc.useUtils()
  const createVehicle = trpc.vehicles.create.useMutation({
    onSuccess: async () => {
      await utils.dashboard.stats.invalidate()
      router.push('/shop/vehicles')
    },
  })
  const updateVehicle = trpc.vehicles.update.useMutation({
    onSuccess: async () => {
      await utils.dashboard.stats.invalidate()
      router.push('/shop/vehicles')
    },
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
      transit_license_no: data.transit_license_no || null,
      engine_number: data.engine_number || null,
      serial_number: data.serial_number || null,
      vehicle_class: data.vehicle_class || null,
      service_type: data.service_type || null,
      axle_count: data.axle_count ?? null,
      registration_city: data.registration_city || null,
      body_type: data.body_type || null,
      number_of_doors: data.number_of_doors ?? null,
      engine_displacement_ccm: data.engine_displacement_ccm ?? null,
    }
    if (isEdit) {
      updateVehicle.mutate({ id: vehicle!.id, ...nullified, scan_id: scanId })
    } else {
      createVehicle.mutate({ vin: data.vin, ...nullified, scan_id: scanId })
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
                    <div className="flex items-center gap-2">
                      <PropertyCardScanner
                        onPropertyCardScanned={({ fields, scanId: id }) => {
                          const vin = typeof fields.chassis_number === 'string' ? fields.chassis_number : ''
                          if (vin) { setValue('vin', vin); trigger('vin') }
                          if (fields.plate)      setValue('license_plate', String(fields.plate))
                          if (fields.make) {
                            const normalized = normalizeMake(String(fields.make), MAKES)
                            setValue('make', normalized ?? String(fields.make))
                            setValue('model', '')
                          }
                          if (fields.model_year) setValue('year', Number(fields.model_year))
                          if (fields.color)      setValue('color', String(fields.color))
                          if (fields.transit_license_no) setValue('transit_license_no', String(fields.transit_license_no))
                          if (fields.engine_number)      setValue('engine_number',       String(fields.engine_number))
                          if (fields.serial_number)      setValue('serial_number',        String(fields.serial_number))
                          if (fields.vehicle_class)      setValue('vehicle_class',        String(fields.vehicle_class))
                          if (fields.service_type)       setValue('service_type',         String(fields.service_type))
                          if (fields.body_type)          setValue('body_type',            String(fields.body_type))
                          if (fields.displacement_cc)    setValue('engine_displacement_ccm', Number(fields.displacement_cc))
                          if (fields.door_count)         setValue('number_of_doors',      Number(fields.door_count))
                          if (fields.axle_count)         setValue('axle_count',           Number(fields.axle_count))
                          if (fields.city)               setValue('registration_city',    String(fields.city))
                          setScanId(id)
                          setDocSectionOpen(true)
                        }}
                        trigger={
                          <Button type="button" variant="ghost" size="xs" className="gap-1 text-muted-foreground">
                            <Camera className="size-3.5" />
                            Tarjeta
                          </Button>
                        }
                      />
                    </div>
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

            {/* Collapsible property card fields */}
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setDocSectionOpen(o => !o)}
                className="flex items-center justify-between w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <span className="flex items-center gap-1.5 font-medium">
                  <FileCheck className="size-3.5" />
                  Tarjeta de propiedad
                </span>
                <span className="flex items-center gap-2">
                  {!docSectionOpen && populatedDocFieldCount > 0 && (
                    <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full">
                      {populatedDocFieldCount} campos
                    </span>
                  )}
                  {docSectionOpen
                    ? <ChevronUp className="size-3.5" />
                    : <ChevronDown className="size-3.5" />}
                </span>
              </button>

              {docSectionOpen && (
                <div className="mt-2 rounded-md border border-dashed border-border/70 bg-muted/30 p-4">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <Label htmlFor="transit_license_no" className="text-xs">No. Licencia de Tránsito</Label>
                      <Input
                        id="transit_license_no"
                        {...register('transit_license_no')}
                        className="mt-1 text-sm h-8"
                      />
                    </div>
                    <div>
                      <Label htmlFor="engine_number" className="text-xs">No. Motor</Label>
                      <Input
                        id="engine_number"
                        {...register('engine_number')}
                        className="mt-1 text-sm h-8 uppercase"
                      />
                    </div>
                    <div>
                      <Label htmlFor="serial_number" className="text-xs">No. Serie</Label>
                      <Input
                        id="serial_number"
                        {...register('serial_number')}
                        className="mt-1 text-sm h-8 uppercase"
                      />
                    </div>
                    <div>
                      <Label htmlFor="vehicle_class" className="text-xs">Clase de vehículo</Label>
                      <Input
                        id="vehicle_class"
                        {...register('vehicle_class')}
                        className="mt-1 text-sm h-8 uppercase"
                      />
                    </div>
                    <div>
                      <Label htmlFor="service_type" className="text-xs">Servicio</Label>
                      <Input
                        id="service_type"
                        {...register('service_type')}
                        className="mt-1 text-sm h-8 uppercase"
                      />
                    </div>
                    <div>
                      <Label htmlFor="registration_city" className="text-xs">Ciudad de matrícula</Label>
                      <Input
                        id="registration_city"
                        {...register('registration_city')}
                        className="mt-1 text-sm h-8"
                      />
                    </div>
                    <div>
                      <Label htmlFor="axle_count" className="text-xs">No. Ejes</Label>
                      <Input
                        id="axle_count"
                        type="number"
                        min={1}
                        max={20}
                        {...register('axle_count')}
                        className="mt-1 text-sm h-8"
                      />
                    </div>
                  </div>
                </div>
              )}
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
                    allowCustom
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
                    allowCustom
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
