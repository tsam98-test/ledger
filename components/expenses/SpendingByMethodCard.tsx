'use client'

import { useMemo } from 'react'
import type { Expense } from '@/types'
import { formatCurrency } from '@/lib/utils'

interface Props {
  expenses: Expense[]
  subtitle: string
  onAdd?: () => void
}

const PM_ICONS: Record<string, string> = {
  'Cash':           '💵',
  'Credit Card':    '💳',
  'Debit Card':     '🏧',
  'Bank Transfer':  '🏦',
  'Digital Wallet': '📱',
  'Other':          '💰',
}

const PM_COLORS: Record<string, { bar: string; bg: string }> = {
  'Credit Card':    { bar: 'linear-gradient(90deg,#6366f1,#818cf8)', bg: 'rgba(99,102,241,0.18)'  },
  'Debit Card':     { bar: 'linear-gradient(90deg,#3b82f6,#60a5fa)', bg: 'rgba(59,130,246,0.18)'  },
  'Bank Transfer':  { bar: 'linear-gradient(90deg,#fb7185,#f43f5e)', bg: 'rgba(251,113,133,0.18)' },
  'Cash':           { bar: 'linear-gradient(90deg,#f59e0b,#fbbf24)', bg: 'rgba(245,158,11,0.18)'  },
  'Digital Wallet': { bar: 'linear-gradient(90deg,#34d399,#10b981)', bg: 'rgba(52,211,153,0.18)'  },
  'Other':          { bar: 'linear-gradient(90deg,#94a3b8,#cbd5e1)', bg: 'rgba(148,163,184,0.18)' },
}

// "Spending by Method" — moved here from the dashboard, unchanged in
// behaviour and styling. Computed from the page's currently filtered expenses.
export default function SpendingByMethodCard({ expenses, subtitle, onAdd }: Props) {
  const total = useMemo(() => expenses.reduce((s, e) => s + Number(e.amount), 0), [expenses])

  const data = useMemo(() => {
    const map: Record<string, number> = {}
    expenses.forEach(e => { map[e.payment_method] = (map[e.payment_method] ?? 0) + Number(e.amount) })
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }))
  }, [expenses])

  return (
    <div className="card p-5" style={{
      borderColor: 'rgba(251,113,133,0.2)',
      background: 'linear-gradient(135deg, rgba(251,113,133,0.04) 0%, transparent 60%)',
    }}>
      <h2 className="text-sm font-bold text-white mb-0.5">Spending by Method</h2>
      <p className="text-xs font-medium text-white/40 mb-4">{subtitle} · how you paid</p>

      {data.length > 0 ? (
        <div className="space-y-3">
          {data.map(item => {
            const pct    = total > 0 ? (item.value / total) * 100 : 0
            const colors = PM_COLORS[item.name] ?? PM_COLORS['Other']
            const icon   = PM_ICONS[item.name]  ?? '💰'
            return (
              <div key={item.name}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                      style={{ background: colors.bg }}>
                      {icon}
                    </div>
                    <span className="text-xs font-bold text-white/80">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-semibold text-white/30">{pct.toFixed(1)}%</span>
                    <span className="text-xs font-mono font-bold" style={{ color: '#fb7185' }}>
                      {formatCurrency(item.value)}
                    </span>
                  </div>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: colors.bar }} />
                </div>
              </div>
            )
          })}
          <div className="flex items-center justify-between pt-3 border-t border-white/8">
            <span className="text-xs font-bold text-white/40 uppercase tracking-wider">Total</span>
            <span className="text-sm font-mono font-bold" style={{ color: '#fb7185' }}>{formatCurrency(total)}</span>
          </div>
        </div>
      ) : (
        <div className="h-40 flex flex-col items-center justify-center gap-3">
          <p className="text-sm text-white/35">No expenses match your filters</p>
          {onAdd && (
            <button onClick={onAdd}
              className="text-xs font-semibold py-1.5 px-3 rounded-xl text-white"
              style={{ background: 'linear-gradient(135deg, #fb7185, #e11d48)' }}>
              + Add Expense
            </button>
          )}
        </div>
      )}
    </div>
  )
}
