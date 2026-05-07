import { UserButton } from '@clerk/nextjs'
import { ThemeToggle } from '@/components/ThemeToggle'
import { OnboardWizard } from './OnboardWizard'

export default function OnboardPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Minimal top bar — profile + theme only, no nav */}
      <div className="fixed top-3 right-4 flex items-center gap-2 z-50">
        <ThemeToggle className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" />
        <UserButton />
      </div>

      <OnboardWizard />
    </div>
  )
}
