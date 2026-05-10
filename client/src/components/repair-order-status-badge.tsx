import { cva } from 'class-variance-authority'

import { cn } from '@/lib/utils'
import {
  RO_STATUS_LABELS,
  repairOrderStatusSchema,
  type RepairOrderStatus,
} from '@/lib/repair-orders'

/** Soft pill per workflow state — uses theme chart + semantic tokens (see v1Pandas.css). */
const repairOrderStatusBadgeVariants = cva(
  'inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
  {
    variants: {
      status: {
        draft: 'border-border bg-muted text-muted-foreground',
        pending:
          'border-chart-3/35 bg-chart-3/12 text-chart-3 dark:border-chart-3/45 dark:bg-chart-3/18',
        approved:
          'border-primary/35 bg-primary/10 text-primary dark:border-primary/45 dark:bg-primary/15',
        in_progress:
          'border-chart-2/35 bg-chart-2/12 text-chart-2 dark:border-chart-2/45 dark:bg-chart-2/18',
        completed:
          'border-chart-4/40 bg-chart-4/12 text-chart-4 dark:border-chart-4/45 dark:bg-chart-4/18',
        declined: 'border-destructive/35 bg-destructive/10 text-destructive dark:bg-destructive/18',
        cancelled:
          'border-border bg-muted/90 text-muted-foreground decoration-muted-foreground/50',
        unknown: 'border-border bg-muted/80 text-muted-foreground',
      },
    },
    defaultVariants: {
      status: 'unknown',
    },
  },
)

export type RepairOrderStatusBadgeProps = {
  status: string
  className?: string
}

function labelFor(raw: string, parsed: RepairOrderStatus | null) {
  if (parsed) return RO_STATUS_LABELS[parsed]
  return raw
}

export function RepairOrderStatusBadge({ status, className }: RepairOrderStatusBadgeProps) {
  const parsed = repairOrderStatusSchema.safeParse(status)
  const variantStatus = parsed.success ? parsed.data : 'unknown'
  return (
    <span
      className={cn(repairOrderStatusBadgeVariants({ status: variantStatus }), className)}
      data-status={parsed.success ? parsed.data : undefined}
    >
      {labelFor(status, parsed.success ? parsed.data : null)}
    </span>
  )
}
