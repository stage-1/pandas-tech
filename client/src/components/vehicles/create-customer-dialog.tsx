'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { createCustomerSchema, type CreateCustomerFormValues } from '@/lib/customers'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { FormErrorBlock } from '@/components/ui/form-error-block'
import { FieldError } from '@/components/ui/field-error'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

export function CreateCustomerDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onCreated: (id: string, name: string) => void
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateCustomerFormValues>({
    resolver: zodResolver(createCustomerSchema),
    defaultValues: { name: '', phone: '' },
  })

  const utils = trpc.useUtils()
  const createCustomer = trpc.customers.create.useMutation({
    onSuccess: async (customer) => {
      await utils.dashboard.stats.invalidate()
      onCreated(customer.id as string, customer.name as string)
      reset()
    },
  })

  function onSubmit(data: CreateCustomerFormValues) {
    createCustomer.mutate({
      name: data.name,
      phone: data.phone || null,
      email: null,
      notes: null,
    })
  }

  function handleOpenChange(v: boolean) {
    if (!v) reset()
    createCustomer.reset()
    onOpenChange(v)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo cliente</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 mt-2">
          <div>
            <Label htmlFor="new-customer-name">Nombre *</Label>
            <Input
              id="new-customer-name"
              placeholder="Ej: Juan García"
              {...register('name')}
              aria-invalid={!!errors.name}
              className="mt-1.5"
              autoFocus
            />
            <FieldError message={errors.name?.message} />
          </div>

          <div>
            <Label htmlFor="new-customer-phone">Teléfono</Label>
            <Input
              id="new-customer-phone"
              type="tel"
              placeholder="Ej: +57 300 123 4567"
              {...register('phone')}
              className="mt-1.5"
            />
          </div>

          {createCustomer.error && (
            <FormErrorBlock
              title="Error al registrar el cliente"
              message={createCustomer.error.message}
            />
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={createCustomer.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={createCustomer.isPending} className="min-w-28">
              {createCustomer.isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  Guardando…
                </span>
              ) : (
                'Guardar cliente'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
