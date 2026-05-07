'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, Receipt, Target, LogOut,
  ChevronRight, Wallet, BarChart2,
} from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/dashboard-home', label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/expenses',       label: 'Expenses',    icon: Receipt         },
  { href: '/income',         label: 'Income',      icon: Wallet          },
  { href: '/investments',    label: 'Investments', icon: BarChart2       },
  { href: '/budgets',        label: 'Budgets',     icon: Target          },
]

export default function Sidebar({ userEmail }: { userEmail: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside
      className="hidden lg:flex flex-col fixed inset-y-0 left-0 w-64 border-r z-30"
      style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
    >
      <div className="px-6 py-7 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3">
          <Image src="/Icon.png" alt="Spendora" width={36} height={36} className="rounded-xl flex-shrink-0" />
          <div>
            <p className="font-display text-xl text-[var(--text-primary)] leading-none">Spendora</p>
            <p className="text-[10px] text-[var(--text-muted)] mt-0.5 uppercase tracking-widest">Track. Budget. Grow.</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-5 space-y-0.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                active
                  ? 'bg-amber-400/10 text-amber-400 border border-amber-400/15'
                  : 'text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)] border border-transparent'
              )}
            >
              <Icon size={17} className="flex-shrink-0" />
              {label}
              {active && <ChevronRight className="ml-auto w-3.5 h-3.5 text-amber-400/60" />}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-4 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="px-3.5 py-2 mb-1">
          <p className="text-xs text-[var(--text-muted)] truncate">{userEmail}</p>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-lg text-sm font-medium text-[var(--text-muted)] hover:bg-rose-500/10 hover:text-rose-400 transition-all duration-150"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
