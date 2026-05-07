'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { trpc } from '@/lib/trpc'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export function ShopGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { data: shop, isPending } = trpc.shops.mine.useQuery()

  if (isPending) return (
    <div className="flex flex-col gap-4 max-w-2xl">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-72" />
      <Skeleton className="h-64 w-full mt-4" />
    </div>
  )

  const isHomeRoute = pathname === '/dashboard'
  if (!shop && !isHomeRoute) {
    return (
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Shop required</CardTitle>
          <CardDescription>
            Create a shop first to access this section.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-3">
          <Button asChild variant="secondary">
            <Link href="/dashboard">Go to Home</Link>
          </Button>
          <Button asChild>
            <Link href="/onboard">Create Shop</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return <>{children}</>
}
