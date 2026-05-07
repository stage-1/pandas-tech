'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { trpc } from '@/lib/trpc'
import { CountryCode } from '@/lib/onboard'
import { ShopName } from './steps/ShopName'
import { CountryPicker } from './steps/CountryPicker'
import { TaxId } from './steps/TaxId'
import { Confirm } from './steps/Confirm'
import { cn } from '@/lib/utils'

type WizardState = {
  step: 1 | 2 | 3 | 4
  name: string
  country: CountryCode
  taxId: string
}

const TOTAL_STEPS = 4

export function OnboardWizard() {
  const { data: existingShop, isPending: checkingShop } = trpc.shops.mine.useQuery()

  useEffect(() => {
    if (!checkingShop && existingShop) {
      window.location.assign('/dashboard')
    }
  }, [existingShop, checkingShop])

  const [state, setState] = useState<WizardState>({
    step: 1,
    name: '',
    country: 'CO',
    taxId: '',
  })

  const create = trpc.shops.create.useMutation({
    onMutate: (vars) => {
      console.log('[SHOP_CREATE] Submitting:', vars)
    },
    onSuccess: (shop) => {
      console.log('[SHOP_CREATE] Success — shop created:', shop)
      window.location.assign('/dashboard')
    },
    onError: (err) => {
      console.error('[SHOP_CREATE] Error:', err.message, err)
    },
  })

  function next() {
    if (state.step < TOTAL_STEPS) {
      setState((s) => ({ ...s, step: (s.step + 1) as WizardState['step'] }))
    }
  }

  function back() {
    if (state.step > 1) {
      setState((s) => ({ ...s, step: (s.step - 1) as WizardState['step'] }))
    }
  }

  function handleSubmit() {
    create.mutate({
      name: state.name,
      country_code: state.country,
      tax_id: state.taxId || undefined,
      tax_id_type: 'NIT',
    })
  }

  const canContinue =
    state.step === 1 ? state.name.trim().length >= 2 : true

  const isLastStep = state.step === TOTAL_STEPS

  if (existingShop) return null

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (isLastStep) {
      handleSubmit()
    } else if (canContinue) {
      next()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLFormElement>) {
    if (e.key !== 'Enter') return
    const tag = (e.target as HTMLElement).tagName.toLowerCase()
    // inputs/textareas already submit via native form behaviour — don't double-fire
    if (tag === 'input' || tag === 'textarea') return
    e.preventDefault()
    if (create.isPending) return
    if (isLastStep) {
      handleSubmit()
    } else if (canContinue) {
      next()
    }
  }

  return (
    <Card className="w-full max-w-lg shadow-md">
      <CardContent className="p-5 sm:p-8 flex flex-col gap-5 sm:gap-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="font-display text-lg font-bold tracking-tight text-primary">
            Panda Tech
          </span>
          <div className="flex flex-col items-end gap-1.5">
            <span className="text-xs text-muted-foreground">
              Paso {state.step} de {TOTAL_STEPS}
            </span>
            <div className="flex gap-1.5">
              {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    'h-1.5 w-1.5 rounded-full transition-colors duration-150',
                    i < state.step ? 'bg-primary' : 'bg-border',
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Step content */}
        <form onSubmit={handleFormSubmit} onKeyDown={handleKeyDown} className="flex flex-col gap-6">
        <div
          key={state.step}
          className="transition-all duration-150 ease-out animate-in fade-in slide-in-from-bottom-2"
        >
          {state.step === 1 && (
            <ShopName
              value={state.name}
              onChange={(name) => setState((s) => ({ ...s, name }))}
            />
          )}
          {state.step === 2 && (
            <CountryPicker
              value={state.country}
              onChange={(country) => setState((s) => ({ ...s, country }))}
            />
          )}
          {state.step === 3 && (
            <TaxId
              country={state.country}
              value={state.taxId}
              onChange={(taxId) => setState((s) => ({ ...s, taxId }))}
            />
          )}
          {state.step === 4 && (
            <Confirm
              name={state.name}
              country={state.country}
              taxId={state.taxId}
            />
          )}
        </div>

        {/* Error */}
        {create.error && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2">
            <p className="text-sm font-medium text-destructive">
              Error al crear el taller
            </p>
            <p className="text-xs text-destructive/80 mt-0.5">
              {create.error.message}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className={`flex items-center gap-3 ${state.step > 1 ? 'justify-between' : 'justify-end'}`}>
          {state.step > 1 && (
            <Button
              type="button"
              variant="ghost"
              onClick={back}
              disabled={create.isPending}
              className="text-muted-foreground"
            >
              Atrás
            </Button>
          )}

          {isLastStep ? (
            <Button
              type="submit"
              disabled={create.isPending}
              className="min-w-36"
            >
              {create.isPending ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12" cy="12" r="10"
                      stroke="currentColor" strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Creando…
                </span>
              ) : (
                'Crear mi taller'
              )}
            </Button>
          ) : (
            <Button type="submit" disabled={!canContinue}>
              Continuar
            </Button>
          )}
        </div>
        </form>
      </CardContent>
    </Card>
  )
}
