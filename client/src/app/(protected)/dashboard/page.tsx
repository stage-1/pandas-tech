import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function DashboardPage() {
  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div className="space-y-1">
        <h1 className="font-display text-2xl font-bold text-foreground">
          Home
        </h1>
        <p className="text-sm text-muted-foreground">
          Start by creating your shop to unlock the rest of the app.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create shop</CardTitle>
          <CardDescription>
            Set up your workspace to start managing customers, jobs, and settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/onboard">Create Shop</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
