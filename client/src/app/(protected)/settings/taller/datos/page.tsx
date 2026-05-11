'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { trpc } from '@/lib/trpc'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'

export default function TallerDatosPage() {
  const utils = trpc.useUtils()
  const { data: shop, isPending } = trpc.shops.mine.useQuery()
  const [name, setName] = useState('')

  const isOwner = shop?.membership_role === 'owner'

  useEffect(() => {
    if (shop?.name != null) setName(shop.name)
  }, [shop?.name])

  const updateDetails = trpc.shops.updateDetails.useMutation({
    onSuccess: async () => {
      await utils.shops.mine.invalidate()
    },
  })

  const savedName = shop?.name ?? ''
  const trimmed = name.trim()
  const dirty = isOwner && trimmed.length >= 2 && trimmed !== savedName.trim()

  if (isPending) {
    return (
      <Card className="border-border/90">
        <CardHeader>
          <Skeleton className="h-6 w-44" />
          <Skeleton className="h-4 w-full max-w-md" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-8 w-full max-w-md" />
          <Skeleton className="h-9 w-28" />
        </CardContent>
      </Card>
    )
  }

  if (!shop) {
    return (
      <Card className="border-border/90">
        <CardHeader>
          <CardTitle className="text-lg">Datos del taller</CardTitle>
          <CardDescription>
            Crea un taller para editar el nombre y otros datos.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button render={<Link href="/dashboard" />}>Ir al inicio</Button>
          <Button render={<Link href="/onboard" />} variant="secondary">
            Crear taller
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/90">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-lg">Nombre del taller</CardTitle>
        <CardDescription>
          {isOwner
            ? 'Así aparece en la barra lateral y en documentos para tu equipo.'
            : 'Solo el dueño puede cambiar el nombre. Tu taller actual:'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 border-t border-border/80 pt-5">
        <div className="space-y-2 max-w-md">
          <Label htmlFor="shop-name">Nombre</Label>
          <Input
            id="shop-name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!isOwner || updateDetails.isPending}
            maxLength={120}
            autoComplete="organization"
            aria-invalid={isOwner && trimmed.length > 0 && trimmed.length < 2}
          />
          {isOwner && trimmed.length > 0 && trimmed.length < 2 ? (
            <p className="text-xs text-destructive">Mínimo 2 caracteres.</p>
          ) : null}
        </div>

        {isOwner ? (
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              size="sm"
              disabled={!dirty || updateDetails.isPending}
              onClick={() => updateDetails.mutate({ name: trimmed })}
            >
              {updateDetails.isPending ? 'Guardando…' : 'Guardar nombre'}
            </Button>
            {dirty ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                disabled={updateDetails.isPending}
                onClick={() => setName(savedName)}
              >
                Descartar
              </Button>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{savedName}</span>
          </p>
        )}

        {updateDetails.error ? (
          <p className="text-sm text-destructive">{updateDetails.error.message}</p>
        ) : null}
      </CardContent>
    </Card>
  )
}
