import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Role = 'owner' | 'tech'

interface UserProfileProps {
  fullName: string
  role: Role
  onNameChange: (value: string) => void
  onRoleChange: (value: Role) => void
}

const ROLES: { value: Role; label: string; desc: string }[] = [
  { value: 'owner', label: 'Dueño', desc: 'Administras el taller' },
  { value: 'tech',  label: 'Técnico', desc: 'Realizas reparaciones' },
]

export function UserProfile({ fullName, role, onNameChange, onRoleChange }: UserProfileProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-2xl sm:text-3xl font-bold uppercase tracking-wide text-foreground">
          Cuéntanos sobre ti
        </h2>
        <p className="text-sm text-muted-foreground">
          Tu nombre y rol en el taller.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="full-name" className="text-sm font-medium">
          Nombre completo
        </Label>
        <Input
          id="full-name"
          value={fullName}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Juan Pérez..."
          className="h-12 text-base focus-visible:ring-secondary focus-visible:border-secondary"
          autoFocus
          autoComplete="name"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-sm font-medium">¿Cuál es tu rol?</Label>
        <div className="grid grid-cols-2 gap-3">
          {ROLES.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => onRoleChange(r.value)}
              className={`flex flex-col items-start gap-0.5 rounded-lg border-2 p-4 text-left transition-colors ${
                role === r.value
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-muted-foreground/40'
              }`}
            >
              <span className="text-sm font-semibold text-foreground">{r.label}</span>
              <span className="text-xs text-muted-foreground">{r.desc}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
