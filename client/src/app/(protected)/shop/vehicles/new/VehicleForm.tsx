'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, ChevronsUpDown, Check } from 'lucide-react'
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
import { FieldError } from '@/components/ui/field-error'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command'

function VehiclePicker({
  options,
  value,
  onChange,
  placeholder,
  id,
  disabled,
}: {
  options: string[]
  value: string | null | undefined
  onChange: (v: string | null) => void
  placeholder: string
  id?: string
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const filtered = useMemo(
    () =>
      search
        ? options.filter((o) => o.toLowerCase().includes(search.toLowerCase()))
        : options,
    [options, search],
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        type="button"
        id={id}
        disabled={disabled}
        className={cn(
          'flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs',
          'ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          !value && 'text-muted-foreground',
        )}
      >
        {value ?? placeholder}
        <ChevronsUpDown className="ml-2 size-3.5 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-[--anchor-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={`Buscar…`}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>Sin resultados.</CommandEmpty>
            <CommandGroup>
              {filtered.map((opt) => (
                <CommandItem
                  key={opt}
                  value={opt}
                  onSelect={() => {
                    onChange(opt === value ? null : opt)
                    setSearch('')
                    setOpen(false)
                  }}
                >
                  {opt}
                  <Check
                    className={cn('ml-auto size-4', value === opt ? 'opacity-100' : 'opacity-0')}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

function CustomerPicker({
  value,
  onChange,
}: {
  value: string | null | undefined
  onChange: (id: string | null) => void
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedName, setSelectedName] = useState<string | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

  const { data: customers } = trpc.vehicles.customers.useQuery(
    { search: debouncedSearch || undefined },
    { enabled: open },
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        type="button"
        id="customer_picker"
        className={cn(
          'flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs',
          'ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          !value && 'text-muted-foreground',
        )}
      >
        {selectedName ?? 'Seleccionar cliente'}
        <ChevronsUpDown className="ml-2 size-3.5 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-[--anchor-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Buscar cliente…"
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>Sin resultados.</CommandEmpty>
            <CommandGroup>
              {customers?.map((c) => (
                <CommandItem
                  key={c.id}
                  value={c.id}
                  onSelect={() => {
                    if (c.id === value) {
                      onChange(null)
                      setSelectedName(null)
                    } else {
                      onChange(c.id)
                      setSelectedName(c.name)
                    }
                    setOpen(false)
                  }}
                >
                  {c.name}
                  <Check
                    className={cn(
                      'ml-auto size-4',
                      value === c.id ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export function VehicleForm() {
  const router = useRouter()
  const isMobile = useIsMobile()
  const [step, setStep] = useState(0)

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
      vin: '',
      year: undefined,
      make: '',
      model: '',
      trim: '',
      color: '',
      license_plate: '',
      notes: '',
      customer_id: undefined,
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

  function onSubmit(data: CreateVehicleInput) {
    createVehicle.mutate({
      ...data,
      year: data.year || null,
      make: data.make || null,
      model: data.model || null,
      trim: data.trim || null,
      color: data.color || null,
      license_plate: data.license_plate || null,
      notes: data.notes || null,
      customer_id: data.customer_id || null,
    })
  }

  async function handleMobileNext() {
    const fields = MOBILE_STEPS[step].fields as unknown as (keyof CreateVehicleFormValues)[]
    const valid = await trigger(fields)
    if (valid) setStep((s) => s + 1)
  }

  const isLastStep = step === MOBILE_STEPS.length - 1

  const submitLabel = createVehicle.isPending ? (
    <span className="flex items-center gap-2">
      <Loader2 className="size-4 animate-spin" />
      Guardando…
    </span>
  ) : (
    'Guardar vehículo'
  )

  return (
    <Card>
      <CardContent className="p-5 sm:p-6">
        {/* Mobile step indicator */}
        {isMobile && (
          <div className="flex items-center justify-between mb-6">
            <span className="text-sm font-medium text-foreground">
              {MOBILE_STEPS[step].label}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                Paso {step + 1} de {MOBILE_STEPS.length}
              </span>
              <div className="flex gap-1.5">
                {MOBILE_STEPS.map((_, i) => (
                  <span
                    key={i}
                    className={cn(
                      'h-1.5 w-1.5 rounded-full transition-colors',
                      i <= step ? 'bg-primary' : 'bg-border',
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-6"
        >
          {/* Step 1: Identificación */}
          <div className={cn(isMobile && step !== 0 && 'hidden')}>
            {!isMobile && (
              <h3 className="text-sm font-medium text-muted-foreground mb-4">
                Identificación
              </h3>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="vin">VIN *</Label>
                <Input
                  id="vin"
                  placeholder="Ej: 1HGBH41JXMN109186"
                  {...register('vin')}
                  aria-invalid={!!errors.vin}
                  className="mt-1.5 uppercase"
                  autoFocus
                />
                <FieldError message={errors.vin?.message} />
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
                    onChange={(id) => setValue('customer_id', id)}
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

          {/* Error */}
          {createVehicle.error && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2">
              <p className="text-sm font-medium text-destructive">
                Error al registrar el vehículo
              </p>
              <p className="text-xs text-destructive/80 mt-0.5">
                {createVehicle.error.message}
              </p>
            </div>
          )}

          {/* Actions */}
          {isMobile ? (
            <div className={cn('flex items-center gap-3', step > 0 ? 'justify-between' : 'justify-end')}>
              {step > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStep((s) => s - 1)}
                  disabled={createVehicle.isPending}
                  className="text-muted-foreground"
                >
                  Atrás
                </Button>
              )}
              {isLastStep ? (
                <Button type="submit" disabled={createVehicle.isPending} className="min-w-36">
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
              <Button type="submit" disabled={createVehicle.isPending} className="min-w-36">
                {submitLabel}
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
