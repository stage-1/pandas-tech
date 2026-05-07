import { COUNTRY_CONFIG, CountryCode } from '@/lib/onboard'

interface ConfirmProps {
  name: string
  country: CountryCode
  taxId: string
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  )
}

export function Confirm({ name, country, taxId }: ConfirmProps) {
  const config = COUNTRY_CONFIG[country]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-2xl sm:text-3xl font-bold uppercase tracking-wide text-foreground">
          Resumen
        </h2>
        <p className="text-sm text-muted-foreground">
          Confirma los datos de tu taller antes de continuar.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-muted/40 px-4">
        <Row label="Taller"    value={name} />
        <Row label="País"      value={`${config.flag} ${config.name}`} />
        <Row label="Moneda"    value={config.currency} />
        <Row label="IVA"       value={config.iva !== null ? `${Math.round(config.iva * 100)}%` : 'Variable'} />
        <Row label={config.label} value={taxId || '—'} />
      </div>
    </div>
  )
}
