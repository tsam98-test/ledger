'use client'

import { useState } from 'react'
import type { Investment } from '@/types'
import { formatCurrency, INVESTMENT_CATEGORY_COLORS } from '@/lib/utils'

interface Props {
  investments: Investment[]
  totalInvested: number
  totalCurrentVal: number
}

// "Investment Returns" — moved here from the dashboard, unchanged in
// styling. The dashboard version linked out to "Manage →"; since we're
// already on the Investments page that link is replaced with a simple
// show-more toggle for the per-holding list instead.
export default function InvestmentReturnsCard({ investments, totalInvested, totalCurrentVal }: Props) {
  const [showAll, setShowAll] = useState(false)
  const totalReturn = totalCurrentVal - totalInvested
  const returnPct   = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0
  const visible      = showAll ? investments : investments.slice(0, 6)

  if (investments.length === 0) return null

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-white">Investment Returns</h2>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-4 pb-4 border-b border-white/8">
        <div>
          <p className="text-xs font-semibold text-white/45 mb-1 uppercase tracking-wider">Invested</p>
          <p className="font-mono font-bold text-white text-lg">{formatCurrency(totalInvested)}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-white/45 mb-1 uppercase tracking-wider">Current</p>
          <p className="font-mono font-bold text-white text-lg">{formatCurrency(totalCurrentVal)}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-white/45 mb-1 uppercase tracking-wider">Return</p>
          <p className={`font-mono font-bold text-lg ${totalReturn >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {totalReturn >= 0 ? '+' : ''}{formatCurrency(totalReturn)}
            <span className="text-xs ml-1 opacity-70">({returnPct >= 0 ? '+' : ''}{returnPct.toFixed(1)}%)</span>
          </p>
        </div>
      </div>
      <div className="space-y-3">
        {visible.map(inv => {
          const ret = Number(inv.current_value) - Number(inv.amount_invested)
          const pct = Number(inv.amount_invested) > 0 ? (ret / Number(inv.amount_invested)) * 100 : 0
          return (
            <div key={inv.id} className="flex items-center gap-3 text-xs">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ background: INVESTMENT_CATEGORY_COLORS[inv.category] ?? '#94a3b8' }} />
              <span className="text-white/70 flex-1 truncate font-medium">{inv.name}</span>
              <span className="font-mono text-white/50">{formatCurrency(Number(inv.current_value))}</span>
              <span className={`font-mono font-bold w-14 text-right ${ret >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {ret >= 0 ? '+' : ''}{pct.toFixed(1)}%
              </span>
            </div>
          )
        })}
      </div>
      {investments.length > 6 && (
        <button onClick={() => setShowAll(v => !v)}
          className="text-xs font-semibold mt-3 inline-block hover:opacity-75" style={{ color: '#fbbf24' }}>
          {showAll ? 'Show less ←' : `+${investments.length - 6} more →`}
        </button>
      )}
    </div>
  )
}
