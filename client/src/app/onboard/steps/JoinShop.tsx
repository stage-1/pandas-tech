import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { StepHeader } from './StepHeader'

interface JoinShopProps {
  value: string
  onChange: (value: string) => void
}

export function JoinShop({ value, onChange }: JoinShopProps) {
  return (
    <div className="flex flex-col gap-6">
      <StepHeader
        title="Unirse a un taller"
        description="Ingresa el código de invitación que te compartió el dueño del taller."
      />

      <div className="flex flex-col gap-2">
        <Label htmlFor="invite-code" className="text-sm font-medium">
          Código de invitación
        </Label>
        <Input
          id="invite-code"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="ej. ABC-1234-XYZ"
          className="h-12 font-mono text-base tracking-wide focus-visible:ring-secondary focus-visible:border-secondary"
          autoFocus
          autoComplete="off"
        />
      </div>
    </div>
  )
}
