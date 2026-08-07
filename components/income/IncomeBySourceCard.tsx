'use client'

import { useMemo } from 'react'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from 'recharts'
import type { Income } from '@/types'
import { formatCurrency } from '@/lib/utils'

interface Props {
  income: Income[]
  subtitle: string
  onAdd?: () => void
}

// "Income by Source" — moved here from the dashboard, unchanged in
// behaviour and styling. Grouped by source name (e.g. "Jack Astor's Pay"),
// computed from whatever's currently filtered on this page.
export default function IncomeBySourceCard({ income, subtitle, onAdd }: Props) {
  const total = useMemo(() => income.reduce((s, i) => s + Number(i.amount), 0), [income])

  const data = useMemo(() => {
    const map: Record<string, number> = {}
    income.forEach(i => { map[i.source] = (map[i.source] ?? 0) + Number(i.amount) })
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }))
  }, [income])

  return (
    <div className="card p-5" style={{
      borderColor: 'rgba(52,211,153,0.15)',
      background: 'linear-gradient(135deg, rgba(52,211,153,0.04) 0%, transparent 60%)',
    }}>
      <h2 className="text-sm font-bold text-white mb-0.5">Income by Source</h2>
      <p className="text-xs font-medium text-white/40 mb-4">{subtitle} · all shifts combined</p>

      {data.length > 0 ? (
        <>
          <ResponsiveContainer width="100%" height={Math.max(data.length * 52, 80)}>
            <BarChart
              layout="vertical"
              data={data}
              margin={{ top: 2, right: 60, bottom: 2, left: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={v => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={90}
                tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: 'rgba(52,211,153,0.06)' }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  return (
                    <div className="custom-tooltip">
                      <p className="text-xs font-semibold text-white mb-1">{payload[0].payload.name}</p>
                      <p className="font-mono text-sm font-bold" style={{ color: '#34d399' }}>
                        +{formatCurrency(Number(payload[0].value))}
                      </p>
                    </div>
                  )
                }}
              />
              <Bar dataKey="value" name="Income" radius={[0, 4, 4, 0]} maxBarSize={32}>
                {data.map((_, i) => (
                  <Cell key={i} fill={`rgba(52,211,153,${0.9 - i * 0.15})`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-4 pt-4 border-t border-white/8">
            {data.map((s, i) => (
              <div key={s.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                    style={{ background: `rgba(52,211,153,${0.9 - i * 0.15})` }} />
                  <span className="text-white/70 font-medium truncate max-w-[140px]">{s.name}</span>
                </div>
                <span className="font-mono font-bold" style={{ color: '#34d399' }}>+{formatCurrency(s.value)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between text-xs pt-1 border-t border-white/8 mt-1">
              <span className="text-white/45 font-semibold uppercase tracking-wider">Total</span>
              <span className="font-mono font-bold text-sm" style={{ color: '#34d399' }}>+{formatCurrency(total)}</span>
            </div>
          </div>
        </>
      ) : (
        <div className="h-32 flex flex-col items-center justify-center gap-3">
          <p className="text-sm text-white/35">No income matches your filters</p>
          {onAdd && (
            <button onClick={onAdd}
              className="text-xs font-semibold py-1.5 px-3 rounded-xl text-white"
              style={{ background: '#10b981' }}>
              + Add Income
            </button>
          )}
        </div>
      )}
    </div>
  )
}
