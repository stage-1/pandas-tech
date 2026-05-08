interface StepHeaderProps {
  title: string
  description: string
}

export function StepHeader({ title, description }: StepHeaderProps) {
  return (
    <div className="flex flex-col gap-1">
      <h2 className="font-display text-2xl sm:text-3xl font-bold uppercase tracking-wide text-foreground">
        {title}
      </h2>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
