'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, Receipt, Target, LogOut,
  Wallet, BarChart2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'

const NAV_ITEMS = [
  { href: '/dashboard-home', label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/expenses',       label: 'Expenses',    icon: Receipt         },
  { href: '/income',         label: 'Income',      icon: Wallet          },
  { href: '/investments',    label: 'Investments', icon: BarChart2       },
  { href: '/budgets',        label: 'Budgets',     icon: Target          },
]

export default function MobileNav({ userEmail }: { userEmail: string }) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      {/* ── Top bar ── */}
      <header
        className="lg:hidden sticky top-0 z-20 flex items-center justify-between px-4 h-14"
        style={{
          background:    'rgba(2,5,9,0.92)',
          borderBottom:  '1px solid rgba(99,102,241,0.08)',
          backdropFilter:'blur(24px)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-base font-bold"
            style={{
              background: 'linear-gradient(135deg, #4338CA, #22D3EE)',
              boxShadow:  '0 0 16px rgba(99,102,241,0.4)',
            }}
          >
            ◈
          </div>
          <span
            className="font-display text-lg leading-none"
            style={{ color: 'var(--text-primary)' }}
          >
            Ledger
          </span>
        </div>

        {/* Hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-2 rounded-lg transition-colors"
          aria-label="Menu"
          style={{ color: 'var(--text-secondary)' }}
        >
          <div className="space-y-1.5 w-5">
            <span
              className={cn(
                'block h-px bg-current transition-all duration-200',
                menuOpen ? 'rotate-45 translate-y-[7px]' : ''
              )}
            />
            <span
              className={cn(
                'block h-px bg-current transition-all duration-200',
                menuOpen ? 'opacity-0' : ''
              )}
            />
            <span
              className={cn(
                'block h-px bg-current transition-all duration-200',
                menuOpen ? '-rotate-45 -translate-y-[7px]' : ''
              )}
            />
          </div>
        </button>
      </header>

      {/* ── Dropdown menu ── */}
      {menuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-10 pt-14"
          onClick={() => setMenuOpen(false)}
        >
          <div
            className="absolute top-14 left-0 right-0 p-3 space-y-0.5"
            style={{
              background:    'rgba(2,5,9,0.98)',
              borderBottom:  '1px solid rgba(99,102,241,0.08)',
              backdropFilter:'blur(24px)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
                  style={
                    active
                      ? {
                          background: 'rgba(99,102,241,0.14)',
                          border:     '1px solid rgba(99,102,241,0.22)',
                          color:      '#fff',
                        }
                      : {
                          color: 'var(--text-secondary)',
                          border: '1px solid transparent',
                        }
                  }
                >
                  <span
                    className="w-[28px] h-[28px] rounded-lg flex items-center justify-center"
                    style={{ background: active ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.04)' }}
                  >
                    <Icon size={14} />
                  </span>
                  {label}
                </Link>
              )
            })}

            {/* User + signout */}
            <div
              className="pt-2 mt-2 space-y-0.5"
              style={{ borderTop: '1px solid rgba(99,102,241,0.08)' }}
            >
              <p
                className="px-3.5 py-1 text-xs truncate"
                style={{ color: 'var(--text-muted)' }}
              >
                {userEmail}
              </p>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
                style={{ color: 'var(--text-muted)' }}
              >
                <span
                  className="w-[28px] h-[28px] rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.04)' }}
                >
                  <LogOut size={14} />
                </span>
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bottom tab bar ── */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-20 flex"
        style={{
          background:   'rgba(2,5,9,0.96)',
          borderTop:    '1px solid rgba(99,102,241,0.08)',
          backdropFilter:'blur(24px)',
        }}
      >
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors"
              style={{ color: active ? '#818CF8' : 'var(--text-muted)' }}
            >
              <span
                className="w-8 h-6 flex items-center justify-center rounded-lg mb-0.5 transition-all"
                style={{ background: active ? 'rgba(99,102,241,0.18)' : 'transparent' }}
              >
                <Icon size={17} />
              </span>
              {label}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
