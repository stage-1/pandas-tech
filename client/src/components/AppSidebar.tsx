'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Settings } from 'lucide-react'
import { UserButton } from '@clerk/nextjs'
import { ThemeToggle } from '@/components/ThemeToggle'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar'

const navItems = [
  { label: 'Board', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Customers', href: '/customers', icon: Users, disabled: true },
  { label: 'Settings', href: '/settings', icon: Settings, disabled: true },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar>
      <SidebarHeader className="px-4 py-4">
        <span className="font-display text-lg font-bold tracking-tight text-sidebar-foreground">
          Panda Tech
        </span>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent className="px-2 py-2">
        <SidebarMenu>
          {navItems.map(({ label, href, icon: Icon, disabled }) => (
            <SidebarMenuItem key={href}>
              {disabled ? (
                <SidebarMenuButton
                  tooltip={label}
                  className="opacity-40 cursor-not-allowed"
                >
                  <Icon className="size-4" />
                  <span>{label}</span>
                </SidebarMenuButton>
              ) : (
                <SidebarMenuButton
                  render={<Link href={href} />}
                  isActive={pathname.startsWith(href)}
                  tooltip={label}
                >
                  <Icon className="size-4" />
                  <span>{label}</span>
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter className="px-4 py-3">
        <div className="flex items-center gap-2">
          <UserButton
            appearance={{
              elements: { avatarBox: 'size-8' },
            }}
          />
          <ThemeToggle />
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
