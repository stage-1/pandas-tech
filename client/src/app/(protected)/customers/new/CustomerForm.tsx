'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useIsMobile } from '@/hooks/use-mobile'
import { trpc } from '@/lib/trpc'
import { createCustomerSchema, type CreateCustomerFormValues, MOBILE_STEPS } from '@/lib/customers'
import { cn } from '@/lib/utils'
import { FieldError } from '@/components/ui/field-error'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

export function CustomerForm() {
  const router = useRouter()
  const isMobile = useIsMobile()
  const [step, setStep] = useState(0)

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm<CreateCustomerFormValues>({
    resolver: zodResolver(createCustomerSchema),
    defaultValues: { name: '', email: '', phone: '', notes: '' },
  })

  const createCustomer = trpc.customers.create.useMutation({
    onSuccess: () => router.push('/customers'),
  })

  function onSubmit(data: CreateCustomerFormValues) {
    createCustomer.mutate({
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      notes: data.notes || null,
    })
  }

  async function handleMobileNext() {
    const fields = MOBILE_STEPS[step].fields as unknown as (keyof CreateCustomerFormValues)[]
    const valid = await trigger(fields)
    if (valid) setStep((s) => s + 1)
  }

  const isLastStep = step === MOBILE_STEPS.length - 1

  const submitLabel = createCustomer.isPending ? (
    <span className="flex items-center gap-2">
      <Loader2 className="size-4 animate-spin" />
      Guardando…
    </span>
  ) : (
    'Guardar cliente'
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

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
          {/* Step 1: Contacto */}
          <div className={cn(isMobile && step !== 0 && 'hidden')}>
            {!isMobile && (
              <h3 className="text-sm font-medium text-muted-foreground mb-4">
                Contacto
              </h3>
            )}
            <div className="grid gap-4">
              <div>
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  placeholder="Ej: Juan García"
                  {...register('name')}
                  aria-invalid={!!errors.name}
                  className="mt-1.5"
                  autoFocus
                />
                <FieldError message={errors.name?.message} />
              </div>
              <div>
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Ej: +57 300 123 4567"
                  {...register('phone')}
                  className="mt-1.5"
                />
              </div>
            </div>
          </div>

          {/* Step 2: Adicional */}
          <div className={cn(isMobile && step !== 1 && 'hidden')}>
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
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Ej: juan@ejemplo.com"
                  {...register('email')}
                  aria-invalid={!!errors.email}
                  className="mt-1.5"
                />
                <FieldError message={errors.email?.message} />
              </div>
              <div>
                <Label htmlFor="notes">Notas</Label>
                <Textarea
                  id="notes"
                  placeholder="Notas adicionales sobre el cliente…"
                  rows={3}
                  {...register('notes')}
                  className="mt-1.5"
                />
              </div>
            </div>
          </div>

          {/* Error */}
          {createCustomer.error && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2">
              <p className="text-sm font-medium text-destructive">
                Error al registrar el cliente
              </p>
              <p className="text-xs text-destructive/80 mt-0.5">
                {createCustomer.error.message}
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
                  disabled={createCustomer.isPending}
                  className="text-muted-foreground"
                >
                  Atrás
                </Button>
              )}
              {isLastStep ? (
                <Button type="submit" disabled={createCustomer.isPending} className="min-w-36">
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
              <Button type="submit" disabled={createCustomer.isPending} className="min-w-36">
                {submitLabel}
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
