import Link from 'next/link'
import { Store } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function SettingsPage() {
  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div className="space-y-1">
        <h1 className="font-display text-2xl font-bold text-foreground">
          Configuración
        </h1>
        <p className="text-sm text-muted-foreground">
          Ajustes de tu cuenta y taller.
        </p>
      </div>

      <Card className="border-border/90">
        <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-2">
          <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
            <Store className="size-5 text-muted-foreground" aria-hidden />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <CardTitle className="text-lg">Taller</CardTitle>
            <CardDescription>
              Nombre del negocio, tema visual y apariencia para tu equipo.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <Button render={<Link href="/settings/taller" />}>Abrir ajustes del taller</Button>
        </CardContent>
      </Card>
    </div>
  )
}
