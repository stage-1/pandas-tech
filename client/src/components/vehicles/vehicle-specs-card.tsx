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

function hasSpecs(specs: VehicleSpecs, keys: (keyof VehicleSpecs)[]): boolean {
  return keys.some(k => specs[k] != null)
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
  // LATAM fallback when no engine data
  if (parts.length === 0) {
    if (specs.manufacturer) parts.push(specs.manufacturer)
    if (specs.plant_country) parts.push(specs.plant_country)
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
        {(specs.manufacturer || specs.plant_country) && (
          <SpecGroup title="Fabricante" first>
            {specs.make_logo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={specs.make_logo_url} alt="Logo" className="h-6 w-auto mb-1 opacity-80" />
            )}
            <SpecRow label="Ensamblador" value={specs.manufacturer} />
            <SpecRow label="País de planta" value={specs.plant_country} />
          </SpecGroup>
        )}
        {hasSpecs(specs, ['engine_displacement_ccm','engine_cylinders','engine_model','engine_power_kw','fuel_type','fuel_system','engine_turbine','engine_oil_capacity_l','engine_coolant_l']) && (
          <SpecGroup title="Motor" first={!specs.manufacturer && !specs.plant_country}>
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
        )}

        {hasSpecs(specs, ['transmission','drive','number_of_gears']) && (
          <SpecGroup title="Transmisión">
            <SpecRow label="Caja" value={specs.transmission} />
            <SpecRow label="Tracción" value={specs.drive} />
            <SpecRow label="Velocidades" value={specs.number_of_gears} />
          </SpecGroup>
        )}

        {hasSpecs(specs, ['front_brakes','rear_brakes','abs','wheel_size','wheel_rims_size']) && (
          <SpecGroup title="Frenos y ruedas">
            <SpecRow label="Frenos delanteros" value={specs.front_brakes} />
            <SpecRow label="Frenos traseros" value={specs.rear_brakes} />
            <SpecRow label="ABS" value={specs.abs} />
            <SpecRow label="Neumáticos" value={specs.wheel_size} />
            <SpecRow label="Llantas" value={specs.wheel_rims_size} />
          </SpecGroup>
        )}

        {hasSpecs(specs, ['front_suspension','rear_suspension','body_type','number_of_doors','number_of_seats']) && (
          <SpecGroup title="Suspensión y carrocería">
            <SpecRow label="Suspensión delantera" value={specs.front_suspension} />
            <SpecRow label="Suspensión trasera" value={specs.rear_suspension} />
            <SpecRow label="Carrocería" value={specs.body_type} />
            <SpecRow label="Puertas" value={specs.number_of_doors} />
            <SpecRow label="Asientos" value={specs.number_of_seats} />
          </SpecGroup>
        )}

        <p className="text-[10px] text-muted-foreground mt-3">Datos provistos por Vincario</p>
      </div>
    </div>
  )
}
