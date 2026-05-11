import Link from 'next/link'
import type { ReactNode } from 'react'
import { TallerSettingsNav } from './TallerSettingsNav'

export default function TallerSettingsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <nav className="text-sm text-muted-foreground" aria-label="Migas de pan">
        <Link
          href="/settings"
          className="text-primary transition-colors duration-150 hover:underline"
        >
          Configuración
        </Link>
        <span className="mx-1.5" aria-hidden>
          /
        </span>
        <span className="font-medium text-foreground">Taller</span>
      </nav>

      <div className="space-y-1">
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
          Taller
        </h1>
        <p className="text-sm text-muted-foreground">
          Datos del negocio y apariencia para todo el equipo.
        </p>
      </div>

      <TallerSettingsNav />
      {children}
    </div>
  )
}
