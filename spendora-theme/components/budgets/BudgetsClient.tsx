'use client'

import { useState, useMemo } from 'react'
import { Target, Plus, Pencil, Check, X, TrendingUp, AlertTriangle } from 'lucide-react'
import type { Budget } from '@/types'
import {
  formatCurrency, formatMonth, getLastNMonths, getCurrentMonth,
  getBudgetBarColor, getBudgetStatusColor, calcPercent, validateAmount, cn
} from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Cell
} from 'recharts'

interface Props {
  initialBudgets: Budget[]
  expenses: { amount: number; date: string }[]
  userId: string
}

export default function BudgetsClient({ initialBudgets, expenses, userId }: Props) {
  const [budgets, setBudgets] = useState<Budget[]>(initialBudgets)
  const [editingMonth, setEditingMonth] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [editError, setEditError] = useState('')
  const [saving, setSaving] = useState(false)
  const supabase = createClient()
  const months = getLastNMonths(6)
  const currentMonth = getCurrentMonth()

  // Build expense totals per month
  const spendByMonth = useMemo(() => {
    const map: Record<string, number> = {}
    expenses.forEach((e) => {
      const m = e.date.slice(0, 7)
      map[m] = (map[m] ?? 0) + Number(e.amount)
    })
    return map
  }, [expenses])

  // Build budget map
  const budgetMap = useMemo(() => {
    const map: Record<string, Budget> = {}
    budgets.forEach((b) => { map[b.month] = b })
    return map
  }, [budgets])

  // Chart data
  const chartData = useMemo(() =>
    months.map((m) => ({
      month: formatMonth(m).replace(' 20', " '"),
      spent: spendByMonth[m] ?? 0,
      budget: budgetMap[m]?.amount ?? 0,
    })),
    [months, spendByMonth, budgetMap]
  )

  function startEdit(month: string) {
    setEditingMonth(month)
    setEditValue(budgetMap[month] ? String(budgetMap[month].amount) : '')
    setEditError('')
  }

  function cancelEdit() {
    setEditingMonth(null)
    setEditValue('')
    setEditError('')
  }

  async function saveBudget(month: string) {
    if (!validateAmount(editValue)) {
      setEditError('Enter a valid amount (e.g. 2000)')
      return
    }
    setSaving(true)
    const amount = parseFloat(editValue)
    const existing = budgetMap[month]

    let data: Budget | null = null
    let error: unknown = null

    if (existing) {
      const res = await supabase
        .from('budgets')
        .update({ amount })
        .eq('id', existing.id)
        .eq('user_id', userId)
        .select()
        .single()
      data = res.data as Budget
      error = res.error
    } else {
      const res = await supabase
        .from('budgets')
        .insert({ user_id: userId, month, amount })
        .select()
        .single()
      data = res.data as Budget
      error = res.error
    }

    setSaving(false)
    if (error || !data) { setEditError('Failed to save. Try again.'); return }

    setBudgets((prev) => {
      const withoutOld = prev.filter((b) => b.month !== month)
      return [...withoutOld, data!].sort((a, b) => b.month.localeCompare(a.month))
    })
    cancelEdit()
  }

  async function deleteBudget(month: string) {
    const existing = budgetMap[month]
    if (!existing) return
    if (!confirm(`Remove budget for ${formatMonth(month)}?`)) return
    await supabase
      .from('budgets')
      .delete()
      .eq('id', existing.id)
      .eq('user_id', userId)
    setBudgets((prev) => prev.filter((b) => b.month !== month))
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
      return (
        <div className="custom-tooltip space-y-1">
          <p className="text-[var(--text-muted)] text-xs font-medium">{label}</p>
          {payload.map((p: any) => (
            <p key={p.name} style={{ color: p.fill }} className="text-xs">
              {p.name === 'spent' ? 'Spent' : 'Budget'}: {formatCurrency(p.value)}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6 pb-24 lg:pb-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl md:text-3xl text-[var(--text-primary)]">Budgets</h1>
        <p className="text-[var(--text-muted)] text-sm mt-1">Set and track monthly spending limits</p>
      </div>

      {/* Overview chart */}
      <div className="card p-5">
        <h2 className="text-sm font-medium text-[var(--text-primary)] mb-1">Budget vs Actual</h2>
        <p className="text-xs text-[var(--text-muted)] mb-4">Last 6 months</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }} barGap={3}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis
              dataKey="month"
              tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="budget" name="budget" fill="rgba(0,212,170,0.2)" radius={[3, 3, 0, 0]} />
            <Bar dataKey="spent" name="spent" radius={[3, 3, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={
                    entry.budget > 0 && entry.spent > entry.budget
                      ? '#f43f5e'
                      : entry.budget > 0 && entry.spent / entry.budget > 0.8
                      ? '#f59e0b'
                      : '#10b981'
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-4 mt-3 text-xs text-[var(--text-muted)]">
          <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded-sm bg-[rgba(0,212,170,0.2)] inline-block" />Budget</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded-sm bg-jade-500 inline-block" />Spent</span>
        </div>
      </div>

      {/* Month cards */}
      <div className="space-y-3">
        {months
          .slice()
          .reverse()
          .reverse()
          .map((month) => {
            const budget = budgetMap[month]
            const spent = spendByMonth[month] ?? 0
            const budgetAmt = budget?.amount ?? 0
            const pct = budgetAmt > 0 ? calcPercent(spent, budgetAmt) : 0
            const isEditing = editingMonth === month
            const isOver = budgetAmt > 0 && spent > budgetAmt
            const isNear = budgetAmt > 0 && pct >= 80 && !isOver
            const isCurrent = month === currentMonth

            return (
              <div
                key={month}
                className={cn(
                  'card p-5 transition-all',
                  isCurrent && 'border-[rgba(0,212,170,0.15)]',
                  isOver && 'border-rose-500/20'
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Target
                      size={15}
                      className={isOver ? 'text-rose-400' : isNear ? 'text-orange-400' : 'text-[var(--text-muted)]'}
                    />
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">
                        {formatMonth(month)}
                        {isCurrent && (
                          <span className="ml-2 text-[10px] badge bg-[rgba(0,212,170,0.1)] text-[#00D4AA] border border-[rgba(0,212,170,0.2)]">
                            Current
                          </span>
                        )}
                      </p>
                      {(isOver || isNear) && (
                        <p className={`text-xs flex items-center gap-1 mt-0.5 ${isOver ? 'text-rose-400' : 'text-orange-400'}`}>
                          <AlertTriangle size={11} />
                          {isOver
                            ? `Over by ${formatCurrency(spent - budgetAmt)}`
                            : `${100 - pct}% remaining`}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Edit controls */}
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)]">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="1"
                          value={editValue}
                          onChange={(e) => { setEditValue(e.target.value); setEditError('') }}
                          className="input pl-6 w-28 text-sm py-1.5"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveBudget(month)
                            if (e.key === 'Escape') cancelEdit()
                          }}
                        />
                      </div>
                      <button onClick={() => saveBudget(month)} disabled={saving} className="btn-primary py-1.5 px-2.5">
                        <Check size={14} />
                      </button>
                      <button onClick={cancelEdit} className="btn-secondary py-1.5 px-2.5">
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <div className="text-right mr-1">
                        <p className="text-sm font-mono font-medium text-[var(--text-primary)]">
                          {formatCurrency(spent)}
                          {budgetAmt > 0 && (
                            <span className="text-[var(--text-muted)] font-normal">
                              {' '}/ {formatCurrency(budgetAmt)}
                            </span>
                          )}
                        </p>
                        {!budgetAmt && (
                          <p className="text-xs text-[var(--text-muted)]">No budget set</p>
                        )}
                      </div>
                      <button
                        onClick={() => startEdit(month)}
                        className="btn-ghost p-1.5 hover:text-[#00D4AA]"
                        title={budget ? 'Edit budget' : 'Set budget'}
                      >
                        {budget ? <Pencil size={13} /> : <Plus size={13} />}
                      </button>
                      {budget && (
                        <button
                          onClick={() => deleteBudget(month)}
                          className="btn-ghost p-1.5 hover:text-rose-400"
                          title="Remove budget"
                        >
                          <X size={13} />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {editError && isEditing && (
                  <p className="text-rose-400 text-xs mt-2">{editError}</p>
                )}

                {/* Progress bar */}
                {budgetAmt > 0 && !isEditing && (
                  <div className="mt-3">
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${getBudgetBarColor(spent, budgetAmt)}`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                    <p className="text-[var(--text-muted)] text-xs mt-1">{Math.min(pct, 100)}% used</p>
                  </div>
                )}
              </div>
            )
          })}
      </div>

      {/* Tips */}
      <div className="card p-5 border-dashed">
        <div className="flex items-start gap-3">
          <TrendingUp size={16} style={{color:"#00D4AA"}} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)] mb-1">Budget Tips</p>
            <ul className="text-xs text-[var(--text-muted)] space-y-1 list-disc list-inside">
              <li>Click the <span style={{color:"#00D4AA"}}>pencil</span> icon next to any month to set a budget</li>
              <li>Teal bar = over 80% spent · Red bar = over budget</li>
              <li>Budgets are monthly and reset automatically each month</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
