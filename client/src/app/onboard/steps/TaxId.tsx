import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { COUNTRY_CONFIG, CountryCode } from '@/lib/onboard'

interface TaxIdProps {
  country: CountryCode
  value: string
  onChange: (value: string) => void
}

export function TaxId({ country, value, onChange }: TaxIdProps) {
  const config = COUNTRY_CONFIG[country]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-2xl sm:text-3xl font-bold uppercase tracking-wide text-foreground">
          {config.label} de tu taller
        </h2>
        <p className="text-sm text-muted-foreground">
          Requerido para emitir facturas electrónicas.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="tax-id" className="text-sm font-medium">
          {config.label}
        </Label>
        <Input
          id="tax-id"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`ej. ${config.hint}`}
          className="h-12 font-mono text-base tracking-wide focus-visible:ring-secondary focus-visible:border-secondary"
          autoComplete="off"
          inputMode="text"
        />
        <p className="text-xs text-muted-foreground">
          Opcional — puedes completarlo más tarde en Configuración.
        </p>
      </div>
    </div>
  )
}
