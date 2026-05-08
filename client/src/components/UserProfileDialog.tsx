'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export function UserProfileDialog() {
  const { data: user, isPending } = trpc.users.me.useQuery()
  const utils = trpc.useUtils()
  const [fullName, setFullName] = useState('')

  const upsertUser = trpc.users.upsert.useMutation({
    onSuccess: () => {
      utils.users.me.invalidate()
    },
  })

  const needsProfile = !isPending && user && !user.full_name
  const canSubmit = fullName.trim().length >= 2

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit || upsertUser.isPending) return
    upsertUser.mutate({ full_name: fullName.trim() })
  }

  return (
    <Dialog open={!!needsProfile}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-bold tracking-tight">
              Completa tu perfil
            </DialogTitle>
            <DialogDescription>
              Necesitamos tu nombre para continuar.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2 py-4">
            <Label htmlFor="profile-name" className="text-sm font-medium">
              Nombre completo
            </Label>
            <Input
              id="profile-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Juan Pérez..."
              className="h-12 text-base focus-visible:ring-secondary focus-visible:border-secondary"
              autoFocus
              autoComplete="name"
            />
            {upsertUser.error && (
              <p className="text-xs text-destructive">{upsertUser.error.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={!canSubmit || upsertUser.isPending}>
              {upsertUser.isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Guardando…
                </span>
              ) : (
                'Continuar'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
