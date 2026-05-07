import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ShopNameProps {
  value: string
  onChange: (value: string) => void
}

export function ShopName({ value, onChange }: ShopNameProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-2xl sm:text-3xl font-bold uppercase tracking-wide text-foreground">
          ¿Cómo se llama tu taller?
        </h2>
        <p className="text-sm text-muted-foreground">
          Este nombre aparecerá en tus órdenes de trabajo y facturas.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="shop-name" className="text-sm font-medium">
          Nombre del taller
        </Label>
        <Input
          id="shop-name"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Taller Mecánico García..."
          className="h-12 text-base focus-visible:ring-secondary focus-visible:border-secondary"
          autoFocus
          autoComplete="off"
        />
      </div>
    </div>
  )
}
