import { cn } from '@/lib/utils'

export function MobileStepIndicator({
  step,
  steps,
}: {
  step: number
  steps: readonly { label: string }[]
}) {
  return (
    <div className="flex items-center justify-between mb-6">
      <span className="text-sm font-medium text-foreground">
        {steps[step].label}
      </span>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">
          Paso {step + 1} de {steps.length}
        </span>
        <div className="flex gap-1.5">
          {steps.map((_, i) => (
            <span
              key={i}
              className={cn(
                'h-1.5 w-1.5 rounded-full transition-colors',
                i <= step ? 'bg-primary' : 'bg-border',
              )}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
