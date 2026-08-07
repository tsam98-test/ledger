'use client'

import { format, parseISO } from 'date-fns'
import type { Expense } from '@/types'
import { formatCurrency, getCategoryColor, getCategoryEmoji } from '@/lib/utils'

interface Props {
  expenses: Expense[]
  onAdd: () => void
}

// "Recent Expenses" — moved here from the dashboard. Shows the 5
// most recent entries from whatever's currently filtered on this page.
export default function RecentExpensesCard({ expenses, onAdd }: Props) {
  const recent = [...expenses]
    .sort((a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at))
    .slice(0, 5)

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
        <h2 className="text-sm font-bold text-white">Recent Expenses</h2>
        <span className="text-xs font-medium text-white/35">latest 5</span>
      </div>
      {recent.length > 0 ? (
        <div className="divide-y divide-white/5">
          {recent.map(e => (
            <div key={e.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/[0.025] transition-colors">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                style={{ background: `${getCategoryColor(e.category)}20` }}>
                {getCategoryEmoji(e.category)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{e.category}</p>
                <p className="text-xs text-white/40 font-medium">{format(parseISO(e.date), 'MMM d')}</p>
              </div>
              <p className="text-sm font-mono font-bold" style={{ color: '#fb7185' }}>
                -{formatCurrency(Number(e.amount))}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="px-5 py-10 text-center">
          <p className="text-white/35 text-sm mb-3">No expenses match your filters</p>
          <button onClick={onAdd}
            className="text-xs font-semibold py-2 px-4 rounded-xl text-white"
            style={{ background: 'linear-gradient(135deg, #fb7185, #e11d48)' }}>
            + Add Expense
          </button>
        </div>
      )}
    </div>
  )
}
