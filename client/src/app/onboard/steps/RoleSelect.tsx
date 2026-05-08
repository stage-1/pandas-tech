import { StepHeader } from './StepHeader'

type Role = 'owner' | 'tech'

interface RoleSelectProps {
  role: Role
  onRoleChange: (value: Role) => void
}

const ROLES: { value: Role; label: string; desc: string }[] = [
  { value: 'owner', label: 'Dueño', desc: 'Administras el taller' },
  { value: 'tech',  label: 'Técnico', desc: 'Realizas reparaciones' },
]

export function RoleSelect({ role, onRoleChange }: RoleSelectProps) {
  return (
    <div className="flex flex-col gap-6">
      <StepHeader
        title="¿Cuál es tu rol?"
        description="Esto determina cómo configuramos tu experiencia."
      />

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
  )
}
