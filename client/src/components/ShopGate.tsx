'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { trpc } from '@/lib/trpc'
import { Skeleton } from '@/components/ui/skeleton'

export function ShopGate({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { data: shop, isPending } = trpc.shops.mine.useQuery()

  useEffect(() => {
    if (!isPending && !shop) {
      router.replace('/onboard')
    }
  }, [shop, isPending, router])

  if (isPending) return (
    <div className="flex flex-col gap-4 max-w-2xl">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-72" />
      <Skeleton className="h-64 w-full mt-4" />
    </div>
  )

  if (!shop) return null

  return <>{children}</>
}
