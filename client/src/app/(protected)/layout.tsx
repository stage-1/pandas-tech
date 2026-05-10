import { AppSidebar } from '@/components/AppSidebar'
import { ShopThemeShell } from '@/components/ShopThemeShell'
import { ShopGate } from '@/components/ShopGate'
import { UserProfileDialog } from '@/components/UserProfileDialog'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ShopThemeShell>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="sticky top-0 z-10 flex h-12 items-center gap-2 border-b border-border bg-background px-4">
            <SidebarTrigger className="-ml-1" />
          </header>
          <main className="flex-1 p-6">
            <ShopGate>{children}</ShopGate>
          </main>
          <UserProfileDialog />
        </SidebarInset>
      </SidebarProvider>
    </ShopThemeShell>
  )
}
