'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { VehicleSpecs } from '@/lib/vehicles'

interface VehicleSpecsCardProps {
  specs: VehicleSpecs
}

function SpecRow({ label, value }: { label: string; value: string | number | boolean | undefined | null }) {
  if (value == null || value === '') return null
  const display = typeof value === 'boolean' ? (value ? 'Sí' : 'No') : String(value)
  return (
    <div className="flex justify-between gap-2 py-1 border-b last:border-0">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span className="text-xs font-medium text-right">{display}</span>
    </div>
  )
}

function SpecGroup({ title, children, first }: { title: string; children: React.ReactNode; first?: boolean }) {
  return (
    <div className={cn('flex flex-col gap-0', !first && 'mt-3')}>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
        {title}
      </p>
      {children}
    </div>
  )
}

function buildSummary(specs: VehicleSpecs): string {
  const parts: string[] = []
  if (specs.engine_displacement_ccm && specs.engine_cylinders) {
    const litres = (specs.engine_displacement_ccm / 1000).toFixed(1)
    parts.push(`${litres}L ${specs.engine_cylinders}cil`)
  } else if (specs.engine_cylinders) {
    parts.push(`${specs.engine_cylinders}cil`)
  }
  if (specs.transmission) parts.push(specs.transmission)
  if (specs.drive) parts.push(specs.drive)
  if (specs.front_brakes && specs.rear_brakes) {
    parts.push(`${specs.front_brakes}/${specs.rear_brakes}`)
  }
  return parts.join(' · ')
}

export function VehicleSpecsCard({ specs }: VehicleSpecsCardProps) {
  const [expanded, setExpanded] = useState(false)
  const summary = buildSummary(specs)

  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between gap-2 text-left"
      >
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Datos del fabricante
          </span>
          {summary && (
            <span className="text-xs text-foreground truncate">{summary}</span>
          )}
        </div>
        {expanded
          ? <ChevronUp className="size-4 text-muted-foreground shrink-0" />
          : <ChevronDown className="size-4 text-muted-foreground shrink-0" />
        }
      </button>

      <div className={cn('overflow-hidden transition-all', expanded ? 'mt-3' : 'mt-0 h-0')}>
        <SpecGroup title="Motor" first>
          <SpecRow label="Cilindrada" value={specs.engine_displacement_ccm ? `${specs.engine_displacement_ccm} ccm` : null} />
          <SpecRow label="Cilindros" value={specs.engine_cylinders} />
          <SpecRow label="Motor" value={specs.engine_model} />
          <SpecRow label="Potencia" value={specs.engine_power_kw ? `${specs.engine_power_kw} kW` : null} />
          <SpecRow label="Combustible" value={specs.fuel_type} />
          <SpecRow label="Sistema combustible" value={specs.fuel_system} />
          <SpecRow label="Turbina" value={specs.engine_turbine} />
          <SpecRow label="Aceite motor" value={specs.engine_oil_capacity_l ? `${specs.engine_oil_capacity_l} L` : null} />
          <SpecRow label="Refrigerante" value={specs.engine_coolant_l ? `${specs.engine_coolant_l} L` : null} />
        </SpecGroup>

        <SpecGroup title="Transmisión">
          <SpecRow label="Caja" value={specs.transmission} />
          <SpecRow label="Tracción" value={specs.drive} />
          <SpecRow label="Velocidades" value={specs.number_of_gears} />
        </SpecGroup>

        <SpecGroup title="Frenos y ruedas">
          <SpecRow label="Frenos delanteros" value={specs.front_brakes} />
          <SpecRow label="Frenos traseros" value={specs.rear_brakes} />
          <SpecRow label="ABS" value={specs.abs} />
          <SpecRow label="Neumáticos" value={specs.wheel_size} />
          <SpecRow label="Llantas" value={specs.wheel_rims_size} />
        </SpecGroup>

        <SpecGroup title="Suspensión y carrocería">
          <SpecRow label="Suspensión delantera" value={specs.front_suspension} />
          <SpecRow label="Suspensión trasera" value={specs.rear_suspension} />
          <SpecRow label="Carrocería" value={specs.body_type} />
          <SpecRow label="Puertas" value={specs.number_of_doors} />
          <SpecRow label="Asientos" value={specs.number_of_seats} />
        </SpecGroup>

        <p className="text-[10px] text-muted-foreground mt-3">Datos provistos por Vincario</p>
      </div>
    </div>
  )
}
