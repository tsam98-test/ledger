'use client'

import { useState, useMemo, useRef } from 'react'
import {
  TrendingUp, ShieldCheck, Home, Gift, Lock, RefreshCw,
  Pencil, Check, X, ChevronDown, PartyPopper, BarChart2,
} from 'lucide-react'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, LabelList,
} from 'recharts'
import type { MoneyMonthlyEntry, EmergencyCycle, MoneyBucketKey } from '@/types'
import {
  MONEY_BUCKET_PCTS, MONEY_BUCKET_GOOD_WHEN_OVER,
  EMERGENCY_FUND_MONTHS_MULTIPLIER, EMERGENCY_CYCLE_LENGTH_MONTHS,
  isNeedCategory,
} from '@/types'
import { formatCurrency, monthsSince, cn, parseNonNegativeAmount } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

interface Props {
  userId: string
  currentMonth: string
  investmentsThisMonth: { category: string; amount_invested: number }[]
  investmentsAllTime: { category: string; current_value: number }[]
  expensesThisMonth: { category: string; amount: number }[]
  incomeThisMonth: { amount: number }[]
  monthlyEntry: MoneyMonthlyEntry | null
  cycle: EmergencyCycle
  emergencyFundBalance: number
  trailingAvgExpenses: number
}

type EditKey = 'income' | 'emergency' | 'goal' | null

const NEED_COLOR = '#3C6EE8'
const WANT_COLOR = '#f59e0b'

const BUCKET_META: Record<MoneyBucketKey, { label: string; sub: string; icon: any; color: string; tint: string }> = {
  growth:     { label: 'Growth',         sub: 'ETFs · Stocks · Bonds',   icon: TrendingUp,  color: '#fbbf24', tint: 'rgba(251,191,36,0.15)' },
  emergency:  { label: 'Emergency fund', sub: 'Stability · 6x expenses', icon: ShieldCheck, color: '#00D4AA', tint: 'rgba(0,212,170,0.15)' },
  essentials: { label: 'Essentials',     sub: 'Needs and wants',         icon: Home,        color: '#3C6EE8', tint: 'rgba(60,110,232,0.15)' },
  rewards:    { label: 'Rewards',        sub: 'Vacations · hobbies · gifts', icon: Gift,     color: '#ec4899', tint: 'rgba(236,72,153,0.15)' },
}

export default function MoneyManagementClient({
  userId, currentMonth, investmentsThisMonth, investmentsAllTime, expensesThisMonth, incomeThisMonth,
  monthlyEntry, cycle: initialCycle, emergencyFundBalance: initialBalance, trailingAvgExpenses,
}: Props) {
  const supabase = createClient()

  const autoIncome = useMemo(
    () => incomeThisMonth.reduce((s, i) => s + Number(i.amount), 0),
    [incomeThisMonth]
  )

  const [income, setIncome] = useState(monthlyEntry?.income_override ?? autoIncome)
  const [incomeIsOverride, setIncomeIsOverride] = useState(monthlyEntry?.income_override != null)
  const [emergencyActual, setEmergencyActual] = useState(monthlyEntry?.emergency_actual ?? 0)
  const [emergencyFundBalance, setEmergencyFundBalance] = useState(initialBalance)
  const [cycle, setCycle] = useState(initialCycle)

  const [editing, setEditing] = useState<EditKey>(null)
  const [editValue, setEditValue] = useState('')
  const [editError, setEditError] = useState('')
  const [saving, setSaving] = useState(false)
  const [openBreakdown, setOpenBreakdown] = useState(false) // growth only now

  // Rewards — always-editable, auto-saves on blur (no manual save step)
  const [rewardsInput, setRewardsInput] = useState(String(monthlyEntry?.rewards_actual ?? 0))
  const [rewardsActual, setRewardsActual] = useState(monthlyEntry?.rewards_actual ?? 0)
  const [rewardsSaving, setRewardsSaving] = useState(false)
  const [rewardsSaved, setRewardsSaved] = useState(false)
  const [rewardsError, setRewardsError] = useState('')
  const rewardsSavedTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Derived bucket actuals ────────────────────────────────
  // Growth = new money actually invested THIS month (cash contributed),
  // not the portfolio's total current value — otherwise past months'
  // contributions and market gains would inflate "this month"'s number.
  const growthActual = useMemo(
    () => investmentsThisMonth.reduce((s, i) => s + Number(i.amount_invested), 0),
    [investmentsThisMonth]
  )
  const essentialsActual = useMemo(
    () => expensesThisMonth.reduce((s, e) => s + Number(e.amount), 0),
    [expensesThisMonth]
  )

  // Portfolio diversification is a separate, all-time metric — how your
  // total holdings are split across categories, not just this month's buys.
  const portfolioTotal = useMemo(
    () => investmentsAllTime.reduce((s, i) => s + Number(i.current_value), 0),
    [investmentsAllTime]
  )
  const growthBreakdown = useMemo(() => {
    const map: Record<string, number> = {}
    investmentsAllTime.forEach((i) => { map[i.category] = (map[i.category] ?? 0) + Number(i.current_value) })
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value, pct: portfolioTotal > 0 ? Math.round((value / portfolioTotal) * 100) : 0 }))
  }, [investmentsAllTime, portfolioTotal])

  const essentialsBreakdown = useMemo(() => {
    const map: Record<string, number> = {}
    expensesThisMonth.forEach((e) => { map[e.category] = (map[e.category] ?? 0) + Number(e.amount) })
    const rows = Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value, need: isNeedCategory(name) }))
    const needsTotal = rows.filter((r) => r.need).reduce((s, r) => s + r.value, 0)
    const needsPct = essentialsActual > 0 ? Math.round((needsTotal / essentialsActual) * 100) : 0
    return { rows, needsPct, wantsPct: rows.length ? 100 - needsPct : 0 }
  }, [expensesThisMonth, essentialsActual])

  const buckets: Record<MoneyBucketKey, { actual: number; target: number }> = {
    growth:     { actual: growthActual,     target: income * MONEY_BUCKET_PCTS.growth },
    emergency:  { actual: emergencyActual,  target: income * MONEY_BUCKET_PCTS.emergency },
    essentials: { actual: essentialsActual, target: income * MONEY_BUCKET_PCTS.essentials },
    rewards:    { actual: rewardsActual,    target: income * MONEY_BUCKET_PCTS.rewards },
  }
  const totalTracked = growthActual + emergencyActual + essentialsActual + rewardsActual

  // ── Emergency cycle math (now 12 months) ─────────────────
  const cycleMonthsElapsed = monthsSince(cycle.cycle_start_month, currentMonth)
  const cycleMonthNumber = Math.min(cycleMonthsElapsed + 1, EMERGENCY_CYCLE_LENGTH_MONTHS)
  const cycleComplete = cycleMonthsElapsed >= EMERGENCY_CYCLE_LENGTH_MONTHS
  const cycleMonthsLeft = Math.max(0, EMERGENCY_CYCLE_LENGTH_MONTHS - cycleMonthNumber)
  const fundPct = cycle.locked_goal > 0 ? Math.min(100, Math.round((emergencyFundBalance / cycle.locked_goal) * 100)) : 0
  const fundComplete = fundPct >= 100
  const amountLeftToGoal = Math.max(0, cycle.locked_goal - emergencyFundBalance)

  // ── Upsert helpers ────────────────────────────────────────
  async function upsertMonthlyEntry(patch: Record<string, number | null>) {
    return supabase
      .from('money_monthly_entries')
      .upsert({ user_id: userId, month: currentMonth, ...patch }, { onConflict: 'user_id,month' })
      .select()
      .single()
  }

  function startEdit(key: EditKey, current: number) {
    setEditing(key)
    setEditValue(String(current))
    setEditError('')
  }
  function cancelEdit() {
    setEditing(null)
    setEditValue('')
    setEditError('')
  }

  async function commitIncome() {
    const value = parseNonNegativeAmount(editValue)
    if (value === null) { setEditError('Enter a valid amount (0 or more)'); return }
    setSaving(true)
    const { error } = await upsertMonthlyEntry({ income_override: value })
    setSaving(false)
    if (error) { setEditError('Failed to save. Try again.'); return }
    setIncome(value)
    setIncomeIsOverride(true)
    cancelEdit()
  }

  function resetIncomeToAuto() {
    setIncome(autoIncome)
    setIncomeIsOverride(false)
    upsertMonthlyEntry({ income_override: null })
  }

  async function commitEmergencyActual() {
    const value = parseNonNegativeAmount(editValue)
    if (value === null) { setEditError('Enter a valid amount (0 or more)'); return }
    setSaving(true)
    const { error } = await upsertMonthlyEntry({ emergency_actual: value })
    setSaving(false)
    if (error) { setEditError('Failed to save. Try again.'); return }
    setEmergencyFundBalance((prev) => prev + (value - emergencyActual))
    setEmergencyActual(value)
    cancelEdit()
  }

  // Rewards auto-saves on blur — no pencil/confirm step
  async function commitRewards() {
    const value = parseNonNegativeAmount(rewardsInput)
    if (value === null) { setRewardsError('Enter a valid amount (0 or more)'); return }
    setRewardsError('')
    if (value === rewardsActual) return // nothing changed, skip the write
    setRewardsSaving(true)
    const { error } = await upsertMonthlyEntry({ rewards_actual: value })
    setRewardsSaving(false)
    if (error) { setRewardsError('Failed to save. Try again.'); return }
    setRewardsActual(value)
    setRewardsSaved(true)
    if (rewardsSavedTimeout.current) clearTimeout(rewardsSavedTimeout.current)
    rewardsSavedTimeout.current = setTimeout(() => setRewardsSaved(false), 1500)
  }

  async function commitGoalOverride() {
    const value = parseNonNegativeAmount(editValue)
    if (value === null) { setEditError('Enter a valid amount (0 or more)'); return }
    setSaving(true)
    const { error } = await supabase
      .from('money_emergency_cycle')
      .update({ locked_goal: value, goal_source: 'manual' })
      .eq('user_id', userId)
    setSaving(false)
    if (error) { setEditError('Failed to save. Try again.'); return }
    setCycle((prev) => ({ ...prev, locked_goal: value, goal_source: 'manual' }))
    cancelEdit()
  }

  async function recalculateCycle() {
    const newGoal = Math.round(trailingAvgExpenses * EMERGENCY_FUND_MONTHS_MULTIPLIER)
    const { error } = await supabase
      .from('money_emergency_cycle')
      .update({ cycle_start_month: currentMonth, locked_goal: newGoal, goal_source: 'auto' })
      .eq('user_id', userId)
    if (!error) {
      setCycle((prev) => ({ ...prev, cycle_start_month: currentMonth, locked_goal: newGoal, goal_source: 'auto' }))
    }
  }

  function bucketStatus(key: MoneyBucketKey) {
    const { actual, target } = buckets[key]
    const pctRaw = target > 0 ? (actual / target) * 100 : 0
    const pct = Math.min(100, Math.round(pctRaw))
    const over = pctRaw >= 100
    const goodWhenOver = MONEY_BUCKET_GOOD_WHEN_OVER[key]
    const diff = Math.abs(actual - target)
    let label: string
    if (goodWhenOver) label = over ? `${Math.round(pctRaw)}% of target · target met` : `${Math.round(pctRaw)}% of target · ${formatCurrency(diff)} to go`
    else label = over ? `${Math.round(pctRaw)}% of target · ${formatCurrency(diff)} over` : `${Math.round(pctRaw)}% of target · ${formatCurrency(diff)} left`
    const barColor = over ? (goodWhenOver ? '#10b981' : '#f43f5e') : BUCKET_META[key].color
    const labelColor = !goodWhenOver && over ? 'text-rose-400' : 'text-[var(--text-muted)]'
    return { pct, label, barColor, labelColor }
  }

  const EssentialsTip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null
    const row = payload[0].payload
    return (
      <div className="custom-tooltip">
        <p className="text-xs font-medium text-[var(--text-primary)]">{row.name}</p>
        <p className="text-[10px] mb-1" style={{ color: row.need ? NEED_COLOR : WANT_COLOR }}>{row.need ? 'Need' : 'Want'}</p>
        <p className="font-mono text-sm text-[var(--text-primary)]">{formatCurrency(row.value)}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-24 lg:pb-8 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl text-[var(--text-primary)]">Money management</h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">Allocate this month&apos;s income across your four buckets</p>
        </div>
        <div className="text-right">
          <label className="label mb-1">Monthly income</label>
          {editing === 'income' ? (
            <div className="flex items-center gap-2">
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)]">$</span>
                <input
                  type="number" min="0" step="0.01" autoFocus
                  value={editValue}
                  onChange={(e) => { setEditValue(e.target.value); setEditError('') }}
                  onKeyDown={(e) => { if (e.key === 'Enter') commitIncome(); if (e.key === 'Escape') cancelEdit() }}
                  className="input pl-6 w-32 text-sm py-1.5 font-mono"
                />
              </div>
              <button onClick={commitIncome} disabled={saving} className="btn-primary py-1.5 px-2.5"><Check size={14} /></button>
              <button onClick={cancelEdit} className="btn-secondary py-1.5 px-2.5"><X size={14} /></button>
            </div>
          ) : (
            <div className="flex items-center gap-2 justify-end">
              <span className="font-mono text-base text-[var(--text-primary)]">{formatCurrency(income)}</span>
              <button onClick={() => startEdit('income', income)} className="btn-ghost p-1.5"><Pencil size={13} /></button>
            </div>
          )}
          {editError && editing === 'income' && <p className="text-rose-400 text-xs mt-1">{editError}</p>}
          {incomeIsOverride && editing !== 'income' && (
            <button onClick={resetIncomeToAuto} className="text-[10px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] mt-1">
              manual · reset to this month&apos;s income ({formatCurrency(autoIncome)})
            </button>
          )}
        </div>
      </div>

      {/* Allocation bar */}
      <div className="flex h-2 rounded-full overflow-hidden">
        <div style={{ width: '50%', background: BUCKET_META.essentials.color }} />
        <div style={{ width: '15%', background: BUCKET_META.emergency.color }} />
        <div style={{ width: '25%', background: BUCKET_META.growth.color }} />
        <div style={{ width: '10%', background: BUCKET_META.rewards.color }} />
      </div>

      {/* Row 1 — Growth, Emergency fund, Rewards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

        {/* Growth */}
        <div className="card p-4" style={{ borderColor: 'rgba(251,191,36,0.2)' }}>
          <BucketHeader bucketKey="growth" pct={MONEY_BUCKET_PCTS.growth} />
          <BucketBody bucketKey="growth" target={buckets.growth.target} actual={growthActual} status={bucketStatus('growth')} />
          {growthBreakdown.length > 0 && (
            <>
              <button onClick={() => setOpenBreakdown((v) => !v)} className="flex items-center gap-1 text-xs font-medium mt-2" style={{ color: BUCKET_META.growth.color }} aria-expanded={openBreakdown}>
                Portfolio diversification (all-time) <ChevronDown size={13} className={cn('transition-transform', openBreakdown && 'rotate-180')} />
              </button>
              {openBreakdown && (
                <div className="mt-2 pt-2 border-t space-y-1.5" style={{ borderColor: 'var(--border)' }}>
                  {growthBreakdown.map((row) => (
                    <div key={row.name} className="flex justify-between items-center text-xs">
                      <span className="text-[var(--text-secondary)]">{row.name}</span>
                      <span className="flex gap-2">
                        <span className="text-[var(--text-muted)]">{row.pct}%</span>
                        <span className="font-mono text-[var(--text-secondary)]">{formatCurrency(row.value)}</span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Emergency fund */}
        <div className="card p-4" style={{ borderColor: 'rgba(0,212,170,0.2)' }}>
          <BucketHeader bucketKey="emergency" pct={MONEY_BUCKET_PCTS.emergency} />
          <div className="flex justify-between mb-1"><span className="text-xs text-[var(--text-muted)]">Target</span><span className="font-mono text-xs text-[var(--text-muted)]">{formatCurrency(buckets.emergency.target)}</span></div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-[var(--text-muted)]">This month <span className="text-[var(--text-secondary)]">· manual</span></span>
            {editing === 'emergency' ? (
              <EditRow value={editValue} onChange={(v) => { setEditValue(v); setEditError('') }} onCommit={commitEmergencyActual} onCancel={cancelEdit} saving={saving} />
            ) : (
              <span className="flex items-center gap-1">
                <span className="font-mono text-sm font-medium text-[var(--text-primary)]">{formatCurrency(emergencyActual)}</span>
                <button onClick={() => startEdit('emergency', emergencyActual)} className="btn-ghost p-1"><Pencil size={12} /></button>
              </span>
            )}
          </div>
          {editError && editing === 'emergency' && <p className="text-rose-400 text-xs mb-1">{editError}</p>}
          <ProgressBar pct={bucketStatus('emergency').pct} color={bucketStatus('emergency').barColor} />
          <p className={cn('text-xs mt-1.5 mb-2', bucketStatus('emergency').labelColor)}>{bucketStatus('emergency').label}</p>

          <div className="border-t pt-2.5 mt-1" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Lock size={11} className="text-[var(--text-muted)]" />
              <span className="text-[10px] text-[var(--text-muted)]">
                {cycleComplete ? 'Cycle complete' : `Month ${cycleMonthNumber} of ${EMERGENCY_CYCLE_LENGTH_MONTHS} · resets in ${cycleMonthsLeft} ${cycleMonthsLeft === 1 ? 'month' : 'months'}`}
              </span>
            </div>
            <div className="h-1 rounded-full overflow-hidden mb-2" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div className="h-full rounded-full" style={{ width: `${Math.round((cycleMonthNumber / EMERGENCY_CYCLE_LENGTH_MONTHS) * 100)}%`, background: '#00D4AA' }} />
            </div>

            <div className="flex justify-between items-center text-xs text-[var(--text-muted)] mb-0.5">
              <span>Fixed goal (locked this cycle)</span>
              {editing === 'goal' ? (
                <EditRow value={editValue} onChange={(v) => { setEditValue(v); setEditError('') }} onCommit={commitGoalOverride} onCancel={cancelEdit} saving={saving} width="w-24" />
              ) : (
                <span className="flex items-center gap-1">
                  <span className="font-mono text-[var(--text-primary)]">{formatCurrency(emergencyFundBalance)}</span> of <span className="font-mono">{formatCurrency(cycle.locked_goal)}</span>
                  <button onClick={() => startEdit('goal', cycle.locked_goal)} className="btn-ghost p-1"><Pencil size={11} /></button>
                </span>
              )}
            </div>
            {editError && editing === 'goal' && <p className="text-rose-400 text-xs mb-1">{editError}</p>}
            <p className="text-[10px] text-[var(--text-muted)] mb-1.5">
              {cycle.goal_source === 'auto' ? `Based on 6-mo avg expenses (${formatCurrency(trailingAvgExpenses)}/mo)` : 'Manually set for this cycle'}
            </p>
            <ProgressBar pct={fundPct} color={BUCKET_META.emergency.color} />
            <p className="text-xs text-[var(--text-muted)] mt-1 mb-2">{fundPct}% funded</p>

            {/* Collected / left / months-left breakdown */}
            <div className="grid grid-cols-3 gap-1 text-center rounded-lg py-2 mb-2" style={{ background: 'var(--bg-secondary)' }}>
              <div>
                <p className="font-mono text-xs text-[var(--text-primary)]">{formatCurrency(emergencyFundBalance)}</p>
                <p className="text-[9px] text-[var(--text-muted)] mt-0.5">collected</p>
              </div>
              <div>
                <p className="font-mono text-xs text-[var(--text-primary)]">{formatCurrency(amountLeftToGoal)}</p>
                <p className="text-[9px] text-[var(--text-muted)] mt-0.5">left to goal</p>
              </div>
              <div>
                <p className="font-mono text-xs text-[var(--text-primary)]">{cycleMonthsLeft}</p>
                <p className="text-[9px] text-[var(--text-muted)] mt-0.5">{cycleMonthsLeft === 1 ? 'month left' : 'months left'}</p>
              </div>
            </div>

            {fundComplete && (
              <div className="flex items-center gap-2 rounded-lg p-2 mb-2" style={{ background: 'rgba(0,212,170,0.1)', border: '1px solid rgba(0,212,170,0.25)' }}>
                <PartyPopper size={15} style={{ color: BUCKET_META.emergency.color }} />
                <span className="text-xs text-[var(--text-secondary)]">Fund complete — consider redirecting this 15% into Growth</span>
              </div>
            )}
            {cycleComplete && (
              <div className="flex items-center justify-between gap-2 rounded-lg p-2" style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)' }}>
                <span className="flex items-center gap-2 text-xs text-[var(--text-secondary)]"><RefreshCw size={14} className="text-amber-400" /> {EMERGENCY_CYCLE_LENGTH_MONTHS}-month cycle complete</span>
                <button onClick={recalculateCycle} className="text-xs font-medium text-amber-400 whitespace-nowrap">Recalculate goal →</button>
              </div>
            )}
          </div>
        </div>

        {/* Rewards — auto-saves, no manual confirm step */}
        <div className="card p-4" style={{ borderColor: 'rgba(236,72,153,0.2)' }}>
          <BucketHeader bucketKey="rewards" pct={MONEY_BUCKET_PCTS.rewards} />
          <div className="flex justify-between mb-1"><span className="text-xs text-[var(--text-muted)]">Target</span><span className="font-mono text-xs text-[var(--text-muted)]">{formatCurrency(buckets.rewards.target)}</span></div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-[var(--text-muted)]">
              This month <span className="text-[var(--text-secondary)]">· {rewardsSaving ? 'saving…' : rewardsSaved ? 'saved ✓' : 'auto-saves'}</span>
            </span>
            <div className="relative">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)]">$</span>
              <input
                type="number" min="0" step="0.01"
                value={rewardsInput}
                onChange={(e) => { setRewardsInput(e.target.value); setRewardsError('') }}
                onBlur={commitRewards}
                onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
                className="input pl-5 w-24 text-sm py-1 font-mono text-right"
              />
            </div>
          </div>
          {rewardsError && <p className="text-rose-400 text-xs mb-1">{rewardsError}</p>}
          <ProgressBar pct={bucketStatus('rewards').pct} color={bucketStatus('rewards').barColor} />
          <p className={cn('text-xs mt-1.5', bucketStatus('rewards').labelColor)}>{bucketStatus('rewards').label}</p>
        </div>
      </div>

      {/* Row 2 — Essentials, full width, with expense breakdown chart */}
      <div className="card p-5" style={{ borderColor: 'rgba(60,110,232,0.25)' }}>
        <div className="grid md:grid-cols-[260px_1fr] gap-6">
          <div>
            <BucketHeader bucketKey="essentials" pct={MONEY_BUCKET_PCTS.essentials} />
            <BucketBody bucketKey="essentials" target={buckets.essentials.target} actual={essentialsActual} status={bucketStatus('essentials')} readOnlyNote="auto" />
            {essentialsBreakdown.rows.length > 0 && (
              <div className="flex items-center gap-3 mt-3 text-[10px] text-[var(--text-muted)]">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full inline-block" style={{ background: NEED_COLOR }} /> Needs {essentialsBreakdown.needsPct}%</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full inline-block" style={{ background: WANT_COLOR }} /> Wants {essentialsBreakdown.wantsPct}%</span>
              </div>
            )}
          </div>

          <div>
            <p className="text-xs font-medium text-[var(--text-secondary)] mb-2">Expense breakdown by category</p>
            {essentialsBreakdown.rows.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-10">
                <BarChart2 className="w-8 h-8 mb-2 opacity-20 text-[var(--text-muted)]" />
                <p className="text-xs text-[var(--text-muted)]">No expenses logged yet this month</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(160, essentialsBreakdown.rows.length * 38)}>
                <BarChart data={essentialsBreakdown.rows} layout="vertical" margin={{ top: 4, right: 64, bottom: 4, left: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={110} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<EssentialsTip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16}>
                    {essentialsBreakdown.rows.map((row, i) => (
                      <Cell key={i} fill={row.need ? NEED_COLOR : WANT_COLOR} />
                    ))}
                    <LabelList dataKey="value" position="right" formatter={(v: number) => formatCurrency(v)} style={{ fill: 'var(--text-secondary)', fontSize: 10, fontFamily: 'monospace' }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Total */}
      <div className="flex justify-between items-center px-4 py-2.5 rounded-lg" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
        <span className="text-xs text-[var(--text-muted)]">Total tracked this month</span>
        <span className="font-mono text-xs text-[var(--text-primary)]">
          {formatCurrency(totalTracked)} of {formatCurrency(income)} · {formatCurrency(Math.max(0, income - totalTracked))} unassigned
        </span>
      </div>
    </div>
  )
}

// ── Small presentational helpers ─────────────────────────────

function BucketHeader({ bucketKey, pct }: { bucketKey: MoneyBucketKey; pct: number }) {
  const meta = BUCKET_META[bucketKey]
  const Icon = meta.icon
  return (
    <div className="flex items-center justify-between mb-2.5">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: meta.tint }}>
          <Icon size={15} style={{ color: meta.color }} />
        </div>
        <div>
          <p className="text-sm font-medium text-[var(--text-primary)]">{meta.label}</p>
          <p className="text-[11px] text-[var(--text-muted)]">{meta.sub}</p>
        </div>
      </div>
      <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ color: meta.color, background: meta.tint }}>
        {Math.round(pct * 100)}%
      </span>
    </div>
  )
}

function BucketBody({
  bucketKey, target, actual, status, readOnlyNote = 'auto',
}: {
  bucketKey: MoneyBucketKey; target: number; actual: number
  status: { pct: number; label: string; barColor: string; labelColor: string }
  readOnlyNote?: string
}) {
  return (
    <>
      <div className="flex justify-between mb-1"><span className="text-xs text-[var(--text-muted)]">Target</span><span className="font-mono text-xs text-[var(--text-muted)]">{formatCurrency(target)}</span></div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs text-[var(--text-muted)]">This month <span style={{ color: BUCKET_META[bucketKey].color }}>· {readOnlyNote}</span></span>
        <span className="font-mono text-sm font-medium text-[var(--text-primary)]">{formatCurrency(actual)}</span>
      </div>
      <ProgressBar pct={status.pct} color={status.barColor} />
      <p className={cn('text-xs mt-1.5', status.labelColor)}>{status.label}</p>
    </>
  )
}

function ProgressBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}

function EditRow({
  value, onChange, onCommit, onCancel, saving, width = 'w-20',
}: {
  value: string; onChange: (v: string) => void; onCommit: () => void; onCancel: () => void
  saving: boolean; width?: string
}) {
  return (
    <span className="flex items-center gap-1.5">
      <input
        type="number" min="0" step="0.01" autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') onCommit(); if (e.key === 'Escape') onCancel() }}
        className={cn('input py-1 text-xs font-mono', width)}
      />
      <button onClick={onCommit} disabled={saving} className="btn-primary p-1"><Check size={12} /></button>
      <button onClick={onCancel} className="btn-secondary p-1"><X size={12} /></button>
    </span>
  )
}
