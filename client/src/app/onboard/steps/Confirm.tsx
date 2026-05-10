import { COUNTRY_CONFIG, CountryCode } from '@/lib/onboard'
import { SHOP_THEME_META, type ShopThemeSlug } from '@/lib/shop-themes'
import { StepHeader } from './StepHeader'

const ROLE_LABELS: Record<string, string> = {
  owner: 'Dueño',
  tech: 'Técnico',
}

interface ConfirmProps {
  name: string
  country: CountryCode
  taxId: string
  role: 'owner' | 'tech'
  themeSlug?: ShopThemeSlug
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  )
}

export function Confirm({ name, country, taxId, role, themeSlug }: ConfirmProps) {
  const config = COUNTRY_CONFIG[country]

  return (
    <div className="flex flex-col gap-6">
      <StepHeader
        title="Resumen"
        description="Confirma los datos de tu taller antes de continuar."
      />

      <div className="rounded-lg border border-border bg-muted/40 px-4">
        <Row label="Rol"       value={ROLE_LABELS[role] ?? role} />
        <Row label="Taller"    value={name} />
        <Row label="País"      value={`${config.flag} ${config.name}`} />
        <Row label="Moneda"    value={config.currency} />
        <Row label="IVA"       value={config.iva !== null ? `${Math.round(config.iva * 100)}%` : 'Variable'} />
        <Row label={config.label} value={taxId || '—'} />
        {themeSlug !== undefined ? (
          <Row label="Tema" value={SHOP_THEME_META[themeSlug].label} />
        ) : null}
      </div>
    </div>
  )
}
