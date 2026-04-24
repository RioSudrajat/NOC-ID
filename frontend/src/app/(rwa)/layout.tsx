'use client'

import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { LayoutDashboard, Map, Plus, Wrench, BarChart2, ArrowLeftRight, Settings } from 'lucide-react'
import { AppSidebar, type NavItem } from '@/components/layout/AppSidebar'

const OPERATOR_NAV: NavItem[] = [
  { href: '/rwa/operator', label: 'Overview', icon: LayoutDashboard },
  { href: '/rwa/operator/fleet', label: 'Fleet', icon: Map },
  { href: '/rwa/operator/mint', label: 'Mint', icon: Plus },
  { href: '/rwa/operator/maintenance', label: 'Maintenance', icon: Wrench },
  { href: '/rwa/operator/analytics', label: 'Analytics', icon: BarChart2 },
  { href: '/rwa/operator/transactions', label: 'Transaksi', icon: ArrowLeftRight },
  { href: '/rwa/operator/settings', label: 'Settings', icon: Settings },
]

export default function RWALayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const isOperatorPortal = pathname?.startsWith('/rwa/operator')

  if (isOperatorPortal) {
    return (
      <div className="min-h-screen flex" style={{ background: 'var(--solana-dark)' }}>
        <AppSidebar
          navItems={OPERATOR_NAV}
          portalName="Nemesis RWA"
          portalLabel="RWA"
          useInlineActiveStyle
          mobileNavCount={5}
        />
        <main
          className="flex-1 overflow-y-auto p-6 md:p-10 pt-24 md:pt-10"
          style={{ maxHeight: '100dvh' }}
        >
          {children}
        </main>
      </div>
    )
  }

  // Public pages — minimal, no sidebar
  return (
    <div className="min-h-screen" style={{ background: 'var(--solana-dark)' }}>
      {children}
    </div>
  )
}
