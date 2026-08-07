'use client'

import { format, parseISO } from 'date-fns'
import type { Income } from '@/types'
import { formatCurrency } from '@/lib/utils'

interface Props {
  income: Income[]
  onAdd: () => void
}

// "Recent Income" — moved here from the dashboard. Shows the 5
// most recent entries from whatever's currently filtered on this page.
export default function RecentIncomeCard({ income, onAdd }: Props) {
  const recent = [...income]
    .sort((a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at))
    .slice(0, 5)

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
        <h2 className="text-sm font-bold text-white">Recent Income</h2>
        <span className="text-xs font-medium text-white/35">latest 5</span>
      </div>
      {recent.length > 0 ? (
        <div className="divide-y divide-white/5">
          {recent.map(i => (
            <div key={i.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/[0.025] transition-colors">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                style={{ background: 'rgba(52,211,153,0.15)' }}>
                💵
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{i.source}</p>
                <p className="text-xs text-white/40 font-medium">
                  {format(parseISO(i.date), 'MMM d')}
                  {i.is_recurring && <span className="ml-1.5" style={{ color: '#38bdf8' }}>↻ recurring</span>}
                </p>
              </div>
              <p className="text-sm font-mono font-bold" style={{ color: '#34d399' }}>
                +{formatCurrency(Number(i.amount))}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="px-5 py-10 text-center">
          <p className="text-white/35 text-sm mb-3">No income matches your filters</p>
          <button onClick={onAdd}
            className="text-xs font-semibold py-2 px-4 rounded-xl text-white"
            style={{ background: 'linear-gradient(135deg, #34d399, #059669)' }}>
            + Add Income
          </button>
        </div>
      )}
    </div>
  )
}
