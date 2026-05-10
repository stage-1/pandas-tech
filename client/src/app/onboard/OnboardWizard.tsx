'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Loader2 } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { CountryCode, shopNameSchema, inviteCodeSchema, wizardStateToCreateInput } from '@/lib/onboard'
import { type ShopThemeSlug } from '@/lib/shop-themes'
import { RoleSelect } from './steps/RoleSelect'
import { ShopName } from './steps/ShopName'
import { CountryPicker } from './steps/CountryPicker'
import { TaxId } from './steps/TaxId'
import { Confirm } from './steps/Confirm'
import { ThemePick } from './steps/ThemePick'
import { JoinShop } from './steps/JoinShop'
import { cn } from '@/lib/utils'

type WizardState = {
  step: number
  role: 'owner' | 'tech'
  name: string
  country: CountryCode
  taxId: string
  inviteCode: string
  theme_slug: ShopThemeSlug
}

const OWNER_STEPS = ['role', 'shop-name', 'country', 'tax-id', 'theme', 'confirm'] as const
const TECH_STEPS = ['role', 'join-shop'] as const

function getSteps(role: 'owner' | 'tech') {
  return role === 'owner' ? OWNER_STEPS : TECH_STEPS
}

export function OnboardWizard() {
  const { data: existingShop, isPending: checkingShop } = trpc.shops.mine.useQuery()

  useEffect(() => {
    if (!checkingShop && existingShop) {
      window.location.assign('/dashboard')
    }
  }, [existingShop, checkingShop])

  const [state, setState] = useState<WizardState>({
    step: 0,
    role: 'owner',
    name: '',
    country: 'CO',
    taxId: '',
    inviteCode: '',
    theme_slug: 'pandas',
  })

  const steps = getSteps(state.role)
  const totalSteps = steps.length
  const currentStepName = steps[state.step]
  const isLastStep = state.step === totalSteps - 1

  const createShop = trpc.shops.create.useMutation({
    onSuccess: () => {
      window.location.assign('/dashboard')
    },
  })

  const joinShop = trpc.shops.join.useMutation({
    onSuccess: () => {
      window.location.assign('/dashboard')
    },
  })

  const pendingMutation = createShop.isPending || joinShop.isPending
  const mutationError = createShop.error || joinShop.error

  function next() {
    if (state.step < totalSteps - 1) {
      setState((s) => ({ ...s, step: s.step + 1 }))
    }
  }

  function back() {
    if (state.step > 0) {
      setState((s) => ({ ...s, step: s.step - 1 }))
    }
  }

  function handleSubmit() {
    if (state.role === 'owner') {
      createShop.mutate(wizardStateToCreateInput(state))
    } else {
      joinShop.mutate({ invite_code: state.inviteCode })
    }
  }

  const canContinue = (() => {
    switch (currentStepName) {
      case 'role':      return true
      case 'shop-name': return shopNameSchema.safeParse({ name: state.name }).success
      case 'country':   return true
      case 'tax-id':    return true
      case 'theme':     return true
      case 'confirm':   return true
      case 'join-shop': return inviteCodeSchema.safeParse({ inviteCode: state.inviteCode }).success
      default:          return false
    }
  })()

  function advanceFromStep() {
    if (isLastStep) {
      handleSubmit()
      return
    }
    next()
  }

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canContinue || pendingMutation) return
    advanceFromStep()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLFormElement>) {
    if (e.key !== 'Enter') return
    const tag = (e.target as HTMLElement).tagName.toLowerCase()
    if (tag === 'input' || tag === 'textarea') return
    e.preventDefault()
    if (pendingMutation || !canContinue) return
    advanceFromStep()
  }

  if (checkingShop) {
    return (
      <Card className="w-full max-w-lg shadow-md">
        <CardContent className="p-5 sm:p-8 flex flex-col gap-5 sm:gap-8">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="flex flex-col gap-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-12 w-full" />
          </div>
          <Skeleton className="h-10 w-24 self-end" />
        </CardContent>
      </Card>
    )
  }

  if (existingShop) return null

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
              Paso {state.step + 1} de {totalSteps}
            </span>
            <div className="flex gap-1.5">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    'h-1.5 w-1.5 rounded-full transition-colors duration-150',
                    i <= state.step ? 'bg-primary' : 'bg-border',
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Step content */}
        <form onSubmit={handleFormSubmit} onKeyDown={handleKeyDown} className="flex flex-col gap-6">
        <div
          key={`${state.role}-${state.step}`}
          className="transition-all duration-150 ease-out animate-in fade-in slide-in-from-bottom-2"
        >
          {currentStepName === 'role' && (
            <RoleSelect
              role={state.role}
              onRoleChange={(role) => setState((s) => ({ ...s, role, step: 0 }))}
            />
          )}
          {currentStepName === 'shop-name' && (
            <ShopName
              value={state.name}
              onChange={(name) => setState((s) => ({ ...s, name }))}
            />
          )}
          {currentStepName === 'country' && (
            <CountryPicker
              value={state.country}
              onChange={(country) => setState((s) => ({ ...s, country }))}
            />
          )}
          {currentStepName === 'tax-id' && (
            <TaxId
              country={state.country}
              value={state.taxId}
              onChange={(taxId) => setState((s) => ({ ...s, taxId }))}
            />
          )}
          {currentStepName === 'theme' && (
            <ThemePick
              value={state.theme_slug}
              onChange={(theme_slug) => setState((s) => ({ ...s, theme_slug }))}
            />
          )}
          {currentStepName === 'confirm' && (
            <Confirm
              name={state.name}
              country={state.country}
              taxId={state.taxId}
              role={state.role}
              themeSlug={state.role === 'owner' ? state.theme_slug : undefined}
            />
          )}
          {currentStepName === 'join-shop' && (
            <JoinShop
              value={state.inviteCode}
              onChange={(inviteCode) => setState((s) => ({ ...s, inviteCode }))}
            />
          )}
        </div>

        {/* Error */}
        {mutationError && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2">
            <p className="text-sm font-medium text-destructive">
              {state.role === 'owner' ? 'Error al crear el taller' : 'Error al unirse al taller'}
            </p>
            <p className="text-xs text-destructive/80 mt-0.5">
              {mutationError.message}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className={`flex items-center gap-3 ${state.step > 0 ? 'justify-between' : 'justify-end'}`}>
          {state.step > 0 && (
            <Button
              type="button"
              variant="ghost"
              onClick={back}
              disabled={pendingMutation}
              className="text-muted-foreground"
            >
              Atrás
            </Button>
          )}

          {isLastStep ? (
            <Button
              type="submit"
              disabled={pendingMutation || !canContinue}
              className="min-w-36"
            >
              {pendingMutation ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {state.role === 'owner' ? 'Creando…' : 'Uniéndose…'}
                </span>
              ) : (
                state.role === 'owner' ? 'Crear mi taller' : 'Unirse al taller'
              )}
            </Button>
          ) : (
            <Button type="submit" disabled={!canContinue || pendingMutation}>
              Continuar
            </Button>
          )}
        </div>
        </form>
      </CardContent>
    </Card>
  )
}
