'use client'

import { formatCurrency } from '@/lib/utils'

interface Props {
  totalIncome: number
  totalExpenses: number
}

const GAUGE_R  = 72
const GAUGE_CX = 90
const GAUGE_CY = 95
const GAUGE_CIRCUMFERENCE = Math.PI * GAUGE_R

function gaugeNeedle(rate: number) {
  const angle = Math.PI * (1 - rate / 100)
  return { x: GAUGE_CX + GAUGE_R * Math.cos(angle), y: GAUGE_CY - GAUGE_R * Math.sin(angle) }
}

function gaugeColor(rate: number): string {
  if (rate < 10) return '#ef4444'
  if (rate < 20) return '#f59e0b'
  if (rate < 35) return '#34d399'
  return '#60d4b4'
}

// "Savings Rate" — moved here from the dashboard, unchanged in behaviour
// and styling. Uses this calendar month's Income and Expenses totals.
export default function SavingsRateCard({ totalIncome, totalExpenses }: Props) {
  const netSavings  = totalIncome - totalExpenses
  const savingsRate = totalIncome > 0 ? Math.max(0, Math.min(100, (netSavings / totalIncome) * 100)) : 0
  const dashoffset  = GAUGE_CIRCUMFERENCE * (1 - savingsRate / 100)
  const needle      = gaugeNeedle(savingsRate)
  const color       = gaugeColor(savingsRate)
  const hasData     = totalIncome > 0 || totalExpenses > 0

  const status = savingsRate < 10
    ? { text: 'Critical — save more urgently', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.28)' }
    : savingsRate < 20
    ? { text: 'Below target · aim for 20%+',  color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.28)' }
    : savingsRate < 35
    ? { text: 'On track — solid savings pace', color: '#34d399', bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.28)' }
    : { text: 'Excellent — top tier saver!',   color: '#60d4b4', bg: 'rgba(96,212,180,0.12)', border: 'rgba(96,212,180,0.28)' }

  return (
    <div className="card p-5" style={{
      borderColor: 'rgba(96,212,180,0.2)',
      background: 'linear-gradient(135deg, rgba(96,212,180,0.04) 0%, transparent 60%)',
    }}>
      <h2 className="text-sm font-bold text-white mb-0.5">Savings Rate</h2>
      <p className="text-xs font-medium text-white/40 mb-3">This month · income kept vs spent</p>

      {hasData ? (
        <>
          <div className="flex justify-center">
            <svg viewBox="0 0 180 110" width="100%" style={{ maxWidth: 200, overflow: 'visible' }}>
              <defs>
                <linearGradient id="sgGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%"   stopColor="#ef4444" />
                  <stop offset="25%"  stopColor="#f59e0b" />
                  <stop offset="60%"  stopColor="#34d399" />
                  <stop offset="100%" stopColor="#60d4b4" />
                </linearGradient>
              </defs>
              <path d="M 18 95 A 72 72 0 0 1 162 95" fill="none"
                stroke="rgba(255,255,255,0.07)" strokeWidth="12" strokeLinecap="round" />
              <path d="M 18 95 A 72 72 0 0 1 162 95" fill="none"
                stroke="url(#sgGrad)" strokeWidth="12" strokeLinecap="round"
                strokeDasharray={GAUGE_CIRCUMFERENCE}
                strokeDashoffset={dashoffset} />
              <circle cx={needle.x} cy={needle.y} r="6"
                fill={color} stroke="rgba(0,0,0,0.45)" strokeWidth="2" />
              <text x="11"  y="108" fontSize="8" fill="rgba(255,255,255,0.25)" fontWeight="700" textAnchor="middle">0%</text>
              <text x="90"  y="20"  fontSize="8" fill="rgba(255,255,255,0.25)" fontWeight="700" textAnchor="middle">50%</text>
              <text x="169" y="108" fontSize="8" fill="rgba(255,255,255,0.25)" fontWeight="700" textAnchor="middle">100%</text>
              <text x="90" y="80" textAnchor="middle" dominantBaseline="middle"
                fontSize="28" fontWeight="800" fill={color}
                fontFamily="'SF Mono','Fira Code',monospace">
                {savingsRate.toFixed(1)}%
              </text>
              <text x="90" y="97" textAnchor="middle"
                fontSize="9" fill="rgba(255,255,255,0.35)" fontWeight="600" letterSpacing="0.04em">
                of income saved
              </text>
            </svg>
          </div>

          <div className="flex justify-center mt-1 mb-3">
            <span className="text-xs font-bold px-3 py-1 rounded-full"
              style={{ color: status.color, background: status.bg, border: `1px solid ${status.border}` }}>
              {status.text}
            </span>
          </div>

          <div className="flex justify-center gap-3 mb-3">
            {([
              { label: '0–10',  color: '#ef4444' },
              { label: '10–20', color: '#f59e0b' },
              { label: '20–35', color: '#34d399' },
              { label: '35%+',  color: '#60d4b4' },
            ] as const).map(b => (
              <div key={b.label} className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: b.color }} />
                <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.35)' }}>{b.label}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/8">
            <div className="text-center">
              <p className="text-xs font-semibold text-white/40 mb-0.5 uppercase tracking-wider">Income</p>
              <p className="text-xs font-mono font-bold" style={{ color: '#34d399' }}>+{formatCurrency(totalIncome)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs font-semibold text-white/40 mb-0.5 uppercase tracking-wider">Spent</p>
              <p className="text-xs font-mono font-bold" style={{ color: '#fb7185' }}>-{formatCurrency(totalExpenses)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs font-semibold text-white/40 mb-0.5 uppercase tracking-wider">Saved</p>
              <p className="text-xs font-mono font-bold"
                style={{ color: netSavings >= 0 ? '#38bdf8' : '#fbbf24' }}>
                {netSavings >= 0 ? '+' : '-'}{formatCurrency(Math.abs(netSavings))}
              </p>
            </div>
          </div>
        </>
      ) : (
        <div className="h-40 flex flex-col items-center justify-center gap-3">
          <p className="text-white/35 text-sm">No income or expenses logged this month</p>
        </div>
      )}
    </div>
  )
}
