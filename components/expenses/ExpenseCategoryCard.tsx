'use client'

import { useMemo } from 'react'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, LabelList,
} from 'recharts'
import type { Expense } from '@/types'
import { formatCurrency, getCategoryColor } from '@/lib/utils'

interface Props {
  expenses: Expense[]
  subtitle: string
  onAdd?: () => void
}

// "Expenses by Category" — moved here from the dashboard. Computed from
// whatever list of expenses is passed in (the page's currently filtered set),
// so it stays in sync with the search/filter controls above the table.
export default function ExpenseCategoryCard({ expenses, subtitle, onAdd }: Props) {
  const total = useMemo(() => expenses.reduce((s, e) => s + Number(e.amount), 0), [expenses])

  const data = useMemo(() => {
    const map: Record<string, number> = {}
    expenses.forEach(e => { map[e.category] = (map[e.category] ?? 0) + Number(e.amount) })
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }))
  }, [expenses])

  return (
    <div className="card p-5" style={{
      borderColor: 'rgba(251,113,133,0.15)',
      background: 'linear-gradient(135deg, rgba(251,113,133,0.04) 0%, transparent 60%)',
    }}>
      <h2 className="text-sm font-bold text-white mb-0.5">Expenses by Category</h2>
      <p className="text-xs font-medium text-white/40 mb-4">{subtitle} · spending breakdown</p>

      {data.length > 0 ? (
        <>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data} margin={{ top: 24, right: 4, bottom: 32, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                angle={-35}
                textAnchor="end"
                interval={0}
              />
              <YAxis
                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={v => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
              />
              <Tooltip
                cursor={{ fill: 'rgba(251,113,133,0.06)' }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  return (
                    <div className="custom-tooltip">
                      <p className="text-xs font-semibold text-white mb-1">{payload[0].payload.name}</p>
                      <p className="font-mono text-sm font-bold" style={{ color: '#fb7185' }}>
                        {formatCurrency(Number(payload[0].value))}
                      </p>
                    </div>
                  )
                }}
              />
              <Bar dataKey="value" name="Spent" radius={[4, 4, 0, 0]} maxBarSize={36}>
                {data.map(e => (
                  <Cell key={e.name} fill={getCategoryColor(e.name)} opacity={0.85} />
                ))}
                <LabelList
                  dataKey="value"
                  position="top"
                  content={({ x, y, width, value }) => {
                    if (value == null || total === 0) return null
                    const pct = ((Number(value) / total) * 100).toFixed(1)
                    return (
                      <text
                        x={Number(x) + Number(width) / 2}
                        y={Number(y) - 4}
                        textAnchor="middle"
                        fontSize={10}
                        fontWeight={700}
                        fill="rgba(255,255,255,0.65)"
                        fontFamily="'SF Mono','Fira Code',monospace"
                      >
                        {pct}%
                      </text>
                    )
                  }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2 pt-4 border-t border-white/8">
            {data.slice(0, 4).map(c => (
              <div key={c.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: getCategoryColor(c.name) }} />
                  <span className="text-white/70 font-medium truncate max-w-[140px]">{c.name}</span>
                </div>
                <span className="font-mono font-bold" style={{ color: '#fb7185' }}>{formatCurrency(c.value)}</span>
              </div>
            ))}
            {data.length > 4 && (
              <p className="text-xs text-white/30 text-right">+{data.length - 4} more categories</p>
            )}
            <div className="flex items-center justify-between text-xs pt-1 border-t border-white/8 mt-1">
              <span className="text-white/45 font-semibold uppercase tracking-wider">Total</span>
              <span className="font-mono font-bold text-sm" style={{ color: '#fb7185' }}>{formatCurrency(total)}</span>
            </div>
          </div>
        </>
      ) : (
        <div className="h-32 flex flex-col items-center justify-center gap-3">
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
