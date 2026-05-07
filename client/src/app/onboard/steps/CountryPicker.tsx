import { COUNTRY_CONFIG, CountryCode, AVAILABLE_COUNTRIES } from '@/lib/onboard'
import { cn } from '@/lib/utils'

const COUNTRY_ORDER: CountryCode[] = ['CO', 'MX', 'CL', 'US']

interface CountryPickerProps {
  value: CountryCode
  onChange: (value: CountryCode) => void
}

export function CountryPicker({ value, onChange }: CountryPickerProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-2xl sm:text-3xl font-bold uppercase tracking-wide text-foreground">
          ¿En qué país operas?
        </h2>
        <p className="text-sm text-muted-foreground">
          Define tu moneda, impuestos y requisitos de facturación.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {COUNTRY_ORDER.map((code) => {
          const config = COUNTRY_CONFIG[code]
          const available = AVAILABLE_COUNTRIES.includes(code)
          const selected = value === code

          return (
            <button
              key={code}
              type="button"
              disabled={!available}
              onClick={() => available && onChange(code)}
              className={cn(
                'relative flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-all duration-150 h-full min-h-[88px]',
                selected
                  ? 'border-primary bg-accent ring-1 ring-primary'
                  : 'border-border bg-card hover:border-primary/40 hover:bg-muted',
                !available && 'cursor-not-allowed opacity-50 hover:border-border hover:bg-card',
              )}
            >
              {!available && (
                <span className="absolute right-2 top-2 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  Próximamente
                </span>
              )}
              <span className="text-2xl leading-none">{config.flag}</span>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold text-foreground">{config.name}</span>
                <span className="text-xs text-muted-foreground">{config.currency} · {config.label}</span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
