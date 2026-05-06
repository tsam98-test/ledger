'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LayoutDashboard, Receipt, Target, LogOut, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/expenses', label: 'Expenses', icon: Receipt },
  { href: '/budgets', label: 'Budgets', icon: Target },
]

export default function MobileNav({ userEmail }: { userEmail: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      {/* Top bar */}
      <header className="lg:hidden sticky top-0 z-20 flex items-center justify-between px-4 h-14 border-b"
              style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <span className="font-display text-lg text-[var(--text-primary)]">Ledger</span>
        </div>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="btn-ghost p-2"
          aria-label="Menu"
        >
          <div className="space-y-1.5">
            <span className={cn("block h-px w-5 bg-current transition-all", menuOpen && "rotate-45 translate-y-2")} />
            <span className={cn("block h-px w-5 bg-current transition-all", menuOpen && "opacity-0")} />
            <span className={cn("block h-px w-5 bg-current transition-all", menuOpen && "-rotate-45 -translate-y-2")} />
          </div>
        </button>
      </header>

      {/* Dropdown menu */}
      {menuOpen && (
        <div className="lg:hidden fixed inset-0 z-10 pt-14" onClick={() => setMenuOpen(false)}>
          <div
            className="absolute top-14 left-0 right-0 border-b p-3 space-y-0.5"
            style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all',
                    active
                      ? 'bg-amber-400/10 text-amber-400'
                      : 'text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)]'
                  )}
                >
                  <Icon size={16} />
                  {label}
                </Link>
              )
            })}
            <div className="pt-2 border-t mt-2" style={{ borderColor: 'var(--border)' }}>
              <p className="px-3.5 py-1 text-xs text-[var(--text-muted)] truncate">{userEmail}</p>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-lg text-sm font-medium text-[var(--text-muted)] hover:bg-rose-500/10 hover:text-rose-400 transition-all"
              >
                <LogOut size={16} />
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom nav (mobile) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-20 flex border-t"
           style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors',
                active ? 'text-amber-400' : 'text-[var(--text-muted)]'
              )}
            >
              <Icon size={20} />
              {label}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
