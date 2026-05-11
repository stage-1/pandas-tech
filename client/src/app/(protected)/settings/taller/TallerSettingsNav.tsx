'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const TABS = [
  { href: '/settings/taller/datos', label: 'Datos' },
  { href: '/settings/taller/tema', label: 'Tema' },
] as const

export function TallerSettingsNav() {
  const pathname = usePathname()

  return (
    <nav
      className="flex gap-1 border-b border-border"
      aria-label="Secciones del taller"
    >
      {TABS.map(({ href, label }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`)
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              '-mb-px border-b-2 px-3 py-2.5 text-sm font-medium outline-none transition-[color,border-color] duration-150',
              '[transition-timing-function:cubic-bezier(0.23,1,0.32,1)]',
              'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-t-md',
              active
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
