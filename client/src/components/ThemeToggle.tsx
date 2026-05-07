'use client'
import { useTheme } from 'next-themes'
import { Sun, Moon, Monitor } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const themes = ['light', 'dark', 'system'] as const
type Theme = (typeof themes)[number]

const icons: Record<Theme, React.ReactNode> = {
  light: <Sun className="size-4" />,
  dark: <Moon className="size-4" />,
  system: <Monitor className="size-4" />,
}

const labels: Record<Theme, string> = {
  light: 'Light',
  dark: 'Dark',
  system: 'System',
}

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()

  function cycle() {
    const current = (theme ?? 'system') as Theme
    const next = themes[(themes.indexOf(current) + 1) % themes.length]
    setTheme(next)
  }

  const current = (theme ?? 'system') as Theme

  return (
    <Tooltip>
      <TooltipTrigger
        onClick={cycle}
        aria-label={`Theme: ${labels[current]}. Click to switch.`}
        className={className ?? "inline-flex size-8 items-center justify-center rounded-md text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"}
      >
        {icons[current]}
      </TooltipTrigger>
      <TooltipContent side="right">
        {labels[current]} theme
      </TooltipContent>
    </Tooltip>
  )
}
