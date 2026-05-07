'use client'

import { useState, useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import {
  TrendingUp, TrendingDown, Receipt, Target, Wallet, BarChart2,
  ArrowUpRight, ArrowDownRight, SlidersHorizontal, X, Plus,
  LayoutDashboard, Sparkles,
} from 'lucide-react'
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell,
} from 'recharts'
import type { Expense, Income, Investment, Budget } from '@/types'
import { INVESTMENT_CATEGORY_COLORS, INCOME_CATEGORY_COLORS } from '@/types'
import {
  formatCurrency, formatMonth, getLastNMonths,
  getBudgetBarColor, getBudgetStatusColor, calcPercent, getCategoryColor, cn,
} from '@/lib/utils'
import Link from 'next/link'
import AddExpenseModal from '@/components/expenses/AddExpenseModal'
import AddIncomeModal  from '@/components/income/AddIncomeModal'

/* ── Design tokens ── */
const I500  = '#6366F1'
const I400  = '#818CF8'
const I300  = '#A5B4FC'
const CYAN  = '#22D3EE'
const GREEN = '#10B981'
const ROSE  = '#F43F5E'
const GOLD  = '#F59E0B'

type ViewMode = 'all' | 'income' | 'expenses' | 'investments' | 'budget'
type ChartType = 'area' | 'bar'

interface Props {
  expenses:     Expense[]
  income:       Income[]
  investments:  Investment[]
  budgets:      Budget[]
  currentMonth: string
  userId:       string
}

function getMonthKey(d: string) { return d.slice(0, 7) }

function getCategoryEmoji(cat: string): string {
  const m: Record<string, string> = {
    'Food & Dining': '🍽️', Transportation: '🚗', Shopping: '🛍️',
    Entertainment: '🎬', Healthcare: '🏥', Utilities: '💡',
    Housing: '🏠', Education: '📚', 'Personal Care': '💆',
    Travel: '✈️', Subscriptions: '🔄', Other: '📌',
  }
  return m[cat] ?? '💰'
}

/* ── Shared styled tooltip ── */
const TooltipBox = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="custom-tooltip space-y-1 min-w-[148px]">
      <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
        {label}
      </p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center justify-between gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.stroke || p.fill }} />
            <span style={{ color: 'var(--text-secondary)' }}>{p.name}</span>
          </span>
          <span className="font-mono font-semibold" style={{ color: p.stroke || p.fill }}>
            {formatCurrency(p.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

const PieTooltipBox = ({ active, payload, colorFn }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="custom-tooltip">
      <p className="text-xs font-semibold mb-0.5" style={{ color: 'var(--text-primary)' }}>{payload[0].name}</p>
      <p className="font-mono text-sm font-bold" style={{ color: colorFn(payload[0].name) }}>
        {formatCurrency(payload[0].value)}
      </p>
    </div>
  )
}

export default function DashboardClient({
  expenses: initExp, income: initInc, investments, budgets, currentMonth, userId,
}: Props) {
  const [expenses,       setExpenses]      = useState(initExp)
  const [income,         setIncome]        = useState(initInc)
  const [viewMode,       setViewMode]      = useState<ViewMode>('all')
  const [chartType,      setChartType]     = useState<ChartType>('area')
  const [selectedMonth,  setSelectedMonth] = useState(currentMonth)
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [showAddIncome,  setShowAddIncome]  = useState(false)
  const months = getLastNMonths(6)

  const budget        = useMemo(() => budgets.find((b) => b.month === selectedMonth) ?? null, [budgets, selectedMonth])
  const monthExpenses = useMemo(() => expenses.filter((e) => getMonthKey(e.date) === selectedMonth), [expenses, selectedMonth])
  const monthIncome   = useMemo(() => income.filter((i) => getMonthKey(i.date) === selectedMonth), [income, selectedMonth])

  const totalExpenses   = useMemo(() => monthExpenses.reduce((s, e) => s + Number(e.amount), 0), [monthExpenses])
  const totalIncome     = useMemo(() => monthIncome.reduce((s, i) => s + Number(i.amount), 0), [monthIncome])
  const netSavings      = totalIncome - totalExpenses
  const totalInvested   = useMemo(() => investments.reduce((s, i) => s + Number(i.amount_invested), 0), [investments])
  const totalCurrentVal = useMemo(() => investments.reduce((s, i) => s + Number(i.current_value), 0), [investments])
  const totalReturn     = totalCurrentVal - totalInvested
  const returnPct       = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0

  const trendData = useMemo(() => {
    const em: Record<string, number> = {}
    const im: Record<string, number> = {}
    expenses.forEach((e) => { em[getMonthKey(e.date)] = (em[getMonthKey(e.date)] ?? 0) + Number(e.amount) })
    income.forEach((i)  => { im[getMonthKey(i.date)] = (im[getMonthKey(i.date)] ?? 0) + Number(i.amount) })
    return months.map((m) => ({
      month:    formatMonth(m).replace(' 20', " '"),
      expenses: em[m] ?? 0,
      income:   im[m] ?? 0,
      savings:  Math.max(0, (im[m] ?? 0) - (em[m] ?? 0)),
    }))
  }, [expenses, income, months])

  const expByCategory = useMemo(() => {
    const map: Record<string, number> = {}
    monthExpenses.forEach((e) => { map[e.category] = (map[e.category] ?? 0) + Number(e.amount) })
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }))
  }, [monthExpenses])

  const incByCategory = useMemo(() => {
    const map: Record<string, number> = {}
    monthIncome.forEach((i) => { map[i.category] = (map[i.category] ?? 0) + Number(i.amount) })
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }))
  }, [monthIncome])

  const invByCategory = useMemo(() => {
    const map: Record<string, number> = {}
    investments.forEach((i) => { map[i.category] = (map[i.category] ?? 0) + Number(i.current_value) })
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }))
  }, [investments])

  const budgetAmt       = budget?.amount ?? 0
  const budgetPct       = budgetAmt > 0 ? Math.min(calcPercent(totalExpenses, budgetAmt), 100) : 0
  const budgetRemaining = budgetAmt - totalExpenses

  const showIncomeV      = viewMode === 'all' || viewMode === 'income'
  const showExpensesV    = viewMode === 'all' || viewMode === 'expenses' || viewMode === 'budget'
  const showInvestmentsV = viewMode === 'all' || viewMode === 'investments'
  const showBudgetV      = viewMode === 'all' || viewMode === 'budget'
  const showTrendV       = viewMode === 'all' || viewMode === 'income' || viewMode === 'expenses'

  const VIEW_OPTIONS: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
    { id: 'all',         label: 'Overview',    icon: <LayoutDashboard size={12} /> },
    { id: 'income',      label: 'Income',      icon: <Wallet size={12} />          },
    { id: 'expenses',    label: 'Expenses',    icon: <Receipt size={12} />         },
    { id: 'investments', label: 'Investments', icon: <BarChart2 size={12} />       },
    { id: 'budget',      label: 'Budget',      icon: <Target size={12} />          },
  ]

  /* ── KPI card helper ── */
  const KpiCard = ({
    label, value, sub, subPositive, icon, iconBg, accentColor,
  }: {
    label: string; value: string; sub?: string; subPositive?: boolean
    icon: React.ReactNode; iconBg: string; accentColor: string
  }) => (
    <div
      className="stat-card animate-slide-up relative overflow-hidden cursor-default"
      style={{ position: 'relative' }}
    >
      {/* Subtle radial glow top-right */}
      <div
        style={{
          position: 'absolute', top: '-30px', right: '-30px',
          width: '120px', height: '120px', borderRadius: '50%',
          background: `radial-gradient(circle, ${accentColor}18 0%, transparent 70%)`,
          pointerEvents: 'none',
        }}
      />
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
          {label}
        </span>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: iconBg }}
        >
          {icon}
        </div>
      </div>
      <p className="text-2xl font-mono font-semibold tracking-tight" style={{ color: accentColor }}>
        {value}
      </p>
      {sub && (
        <p className="text-xs flex items-center gap-1" style={{ color: subPositive ? GREEN : ROSE }}>
          {subPositive ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
          {sub}
        </p>
      )}
    </div>
  )

  return (
    <div className="space-y-5 pb-24 lg:pb-8 animate-fade-in">

      {/* ════════════════════════════════════
          HEADER
      ════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Sparkles size={14} style={{ color: I400 }} />
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: I400 }}>
              Financial Overview
            </span>
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Dashboard
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {formatMonth(selectedMonth)} · Your money at a glance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddIncome(true)}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold font-body transition-all duration-150"
            style={{
              background:  'rgba(16,185,129,0.10)',
              color:       GREEN,
              border:      '1px solid rgba(16,185,129,0.22)',
            }}
          >
            <Plus size={12} /> Income
          </button>
          <button
            onClick={() => setShowAddExpense(true)}
            className="btn-primary text-xs animate-pulse-glow"
          >
            <Plus size={12} /> Expense
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════
          FILTER BAR
      ════════════════════════════════════ */}
      <div
        className="card p-3.5"
        style={{ position: 'relative', overflow: 'hidden' }}
      >
        {/* Top-edge shimmer */}
        <div
          style={{
            position: 'absolute', top: 0, left: '20%', right: '20%', height: '1px',
            background: `linear-gradient(90deg, transparent, ${I500}55, transparent)`,
            pointerEvents: 'none',
          }}
        />
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">

          {/* Month slicer */}
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest whitespace-nowrap"
              style={{ color: 'var(--text-muted)' }}
            >
              <SlidersHorizontal size={10} /> Month
            </span>
            <div className="flex gap-1 flex-wrap">
              {months.map((m) => (
                <button
                  key={m}
                  onClick={() => setSelectedMonth(m)}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border"
                  style={
                    selectedMonth === m
                      ? { background: 'rgba(99,102,241,0.14)', color: I300, border: `1px solid rgba(99,102,241,0.28)` }
                      : { color: 'var(--text-muted)', border: '1px solid transparent' }
                  }
                >
                  {formatMonth(m).replace(' 20', " '")}
                </button>
              ))}
            </div>
          </div>

          <div className="hidden sm:block h-4 w-px" style={{ background: 'var(--border)' }} />

          {/* View mode slicer */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
              View
            </span>
            <div className="flex gap-1 flex-wrap">
              {VIEW_OPTIONS.map(({ id, label, icon }) => (
                <button
                  key={id}
                  onClick={() => setViewMode(id)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border"
                  style={
                    viewMode === id
                      ? { background: 'rgba(99,102,241,0.14)', color: I300, border: `1px solid rgba(99,102,241,0.28)` }
                      : { color: 'var(--text-muted)', border: '1px solid transparent' }
                  }
                >
                  {icon}{label}
                </button>
              ))}
            </div>
          </div>

          {/* Chart type toggle */}
          {showTrendV && (
            <>
              <div className="hidden sm:block h-4 w-px" style={{ background: 'var(--border)' }} />
              <div className="flex gap-1">
                {(['area', 'bar'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setChartType(t)}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all capitalize"
                    style={
                      chartType === t
                        ? { background: 'rgba(34,211,238,0.10)', color: CYAN, border: `1px solid rgba(34,211,238,0.25)` }
                        : { color: 'var(--text-muted)', border: '1px solid transparent' }
                    }
                  >
                    {t}
                  </button>
                ))}
              </div>
            </>
          )}

          {viewMode !== 'all' && (
            <button
              onClick={() => setViewMode('all')}
              className="ml-auto flex items-center gap-1 text-xs transition-colors"
              style={{ color: 'var(--text-muted)' }}
            >
              <X size={11} /> Reset
            </button>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════
          KPI CARDS
      ════════════════════════════════════ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {showIncomeV && (
          <KpiCard
            label="Income"
            value={formatCurrency(totalIncome)}
            sub={totalIncome > 0 ? 'This month' : undefined}
            subPositive
            icon={<ArrowUpRight size={14} style={{ color: GREEN }} />}
            iconBg="rgba(16,185,129,0.12)"
            accentColor={GREEN}
          />
        )}
        {showExpensesV && (
          <KpiCard
            label="Expenses"
            value={formatCurrency(totalExpenses)}
            sub={totalExpenses > 0 ? 'This month' : undefined}
            subPositive={false}
            icon={<ArrowDownRight size={14} style={{ color: ROSE }} />}
            iconBg="rgba(244,63,94,0.10)"
            accentColor={ROSE}
          />
        )}
        {showIncomeV && (
          <KpiCard
            label="Net Savings"
            value={formatCurrency(Math.abs(netSavings))}
            sub={netSavings >= 0 ? 'Surplus' : 'Deficit'}
            subPositive={netSavings >= 0}
            icon={
              netSavings >= 0
                ? <TrendingUp size={14} style={{ color: CYAN }} />
                : <TrendingDown size={14} style={{ color: GOLD }} />
            }
            iconBg={netSavings >= 0 ? 'rgba(34,211,238,0.10)' : 'rgba(245,158,11,0.10)'}
            accentColor={netSavings >= 0 ? CYAN : GOLD}
          />
        )}
        {showInvestmentsV && (
          <KpiCard
            label="Portfolio"
            value={formatCurrency(totalCurrentVal)}
            sub={`${returnPct >= 0 ? '+' : ''}${returnPct.toFixed(1)}% return`}
            subPositive={returnPct >= 0}
            icon={<BarChart2 size={14} style={{ color: I400 }} />}
            iconBg="rgba(99,102,241,0.12)"
            accentColor={I400}
          />
        )}
      </div>

      {/* ════════════════════════════════════
          BUDGET CARD
      ════════════════════════════════════ */}
      {showBudgetV && budgetAmt > 0 && (
        <div
          className="card p-5 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(67,56,202,0.12) 0%, rgba(8,13,26,0.85) 100%)',
            border: '1px solid rgba(99,102,241,0.18)',
          }}
        >
          {/* Decorative glow */}
          <div
            style={{
              position: 'absolute', top: '-60px', right: '-40px',
              width: '200px', height: '200px', borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />
          <div className="flex items-center justify-between mb-3 relative">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(99,102,241,0.14)' }}
              >
                <Target size={14} style={{ color: I400 }} />
              </div>
              <div>
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Monthly Budget
                </span>
                <span className="text-xs ml-1.5" style={{ color: 'var(--text-muted)' }}>
                  · {formatMonth(selectedMonth)}
                </span>
              </div>
            </div>
            <span
              className="text-sm font-mono font-semibold"
              style={{ color: budgetRemaining >= 0 ? GREEN : ROSE }}
            >
              {budgetRemaining >= 0
                ? `${formatCurrency(budgetRemaining)} left`
                : `${formatCurrency(Math.abs(budgetRemaining))} over`}
              <span className="text-xs ml-1 font-normal" style={{ color: 'var(--text-muted)' }}>
                / {formatCurrency(budgetAmt)}
              </span>
            </span>
          </div>

          {/* Progress bar */}
          <div
            className="h-2.5 rounded-full overflow-hidden relative"
            style={{ background: 'rgba(255,255,255,0.05)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${budgetPct}%`,
                background:
                  budgetPct >= 100
                    ? `linear-gradient(90deg, ${ROSE}, #FB7185)`
                    : budgetPct >= 80
                      ? `linear-gradient(90deg, ${GOLD}, #FBBF24)`
                      : `linear-gradient(90deg, ${I500}, ${CYAN})`,
                boxShadow:
                  budgetPct < 80
                    ? `0 0 12px rgba(99,102,241,0.4)`
                    : budgetPct < 100
                      ? `0 0 12px rgba(245,158,11,0.35)`
                      : `0 0 12px rgba(244,63,94,0.4)`,
              }}
            />
          </div>

          <div className="flex justify-between mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
            <span>{budgetPct}% used</span>
            {budgetPct >= 80 && (
              <span style={{ color: budgetPct >= 100 ? ROSE : GOLD }}>
                {budgetPct >= 100 ? '⚠ Over budget' : '⚡ Nearing limit'}
              </span>
            )}
          </div>
        </div>
      )}
      {showBudgetV && !budgetAmt && (
        <div
          className="card p-4 flex items-center justify-between"
          style={{ borderStyle: 'dashed', borderColor: 'rgba(99,102,241,0.15)' }}
        >
          <span className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
            <Target size={14} /> No budget set for {formatMonth(selectedMonth)}
          </span>
          <Link href="/budgets" className="btn-secondary py-1.5 text-xs">Set Budget →</Link>
        </div>
      )}

      {/* ════════════════════════════════════
          TREND CHART
      ════════════════════════════════════ */}
      {showTrendV && (
        <div className="card p-5 relative overflow-hidden">
          {/* Top-edge refraction */}
          <div
            style={{
              position: 'absolute', top: 0, left: '10%', right: '10%', height: '1px',
              background: `linear-gradient(90deg, transparent, ${I500}55, transparent)`,
              pointerEvents: 'none',
            }}
          />
          <div className="mb-5 flex items-start justify-between">
            <div>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                6-Month Trend
              </h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {viewMode === 'income'   ? 'Income over time'
                 : viewMode === 'expenses' ? 'Expenses over time'
                 : 'Income · Expenses · Savings'}
              </p>
            </div>
            {/* Legend */}
            <div className="flex gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
              {(viewMode === 'all' || viewMode === 'income') && (
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-1.5 rounded-sm inline-block" style={{ background: GREEN }} />Income
                </span>
              )}
              {(viewMode === 'all' || viewMode === 'expenses') && (
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-1.5 rounded-sm inline-block" style={{ background: ROSE }} />Expenses
                </span>
              )}
              {viewMode === 'all' && (
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-1.5 rounded-sm inline-block" style={{ background: CYAN }} />Savings
                </span>
              )}
            </div>
          </div>

          <ResponsiveContainer width="100%" height={220}>
            {chartType === 'area' ? (
              <AreaChart data={trendData} margin={{ top: 4, right: 4, bottom: 0, left: -22 }}>
                <defs>
                  <linearGradient id="grad-income" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={GREEN} stopOpacity={0.22} />
                    <stop offset="95%" stopColor={GREEN} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="grad-expenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={ROSE}  stopOpacity={0.22} />
                    <stop offset="95%" stopColor={ROSE}  stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="grad-savings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={CYAN}  stopOpacity={0.18} />
                    <stop offset="95%" stopColor={CYAN}  stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.06)" />
                <XAxis
                  dataKey="month"
                  tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
                  axisLine={false} tickLine={false}
                />
                <YAxis
                  tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
                  axisLine={false} tickLine={false}
                  tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`}
                />
                <Tooltip content={<TooltipBox />} />
                {(viewMode === 'all' || viewMode === 'income') && (
                  <Area type="monotone" dataKey="income" name="Income"
                    stroke={GREEN} strokeWidth={2} fill="url(#grad-income)"
                    dot={{ fill: GREEN, r: 3, strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 0 }} />
                )}
                {(viewMode === 'all' || viewMode === 'expenses') && (
                  <Area type="monotone" dataKey="expenses" name="Expenses"
                    stroke={ROSE} strokeWidth={2} fill="url(#grad-expenses)"
                    dot={{ fill: ROSE, r: 3, strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 0 }} />
                )}
                {viewMode === 'all' && (
                  <Area type="monotone" dataKey="savings" name="Savings"
                    stroke={CYAN} strokeWidth={1.5} strokeDasharray="4 2" fill="url(#grad-savings)"
                    dot={false} />
                )}
              </AreaChart>
            ) : (
              <BarChart data={trendData} margin={{ top: 4, right: 4, bottom: 0, left: -22 }} barGap={3}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.06)" />
                <XAxis
                  dataKey="month"
                  tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
                  axisLine={false} tickLine={false}
                />
                <YAxis
                  tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
                  axisLine={false} tickLine={false}
                  tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`}
                />
                <Tooltip content={<TooltipBox />} />
                {(viewMode === 'all' || viewMode === 'income') && (
                  <Bar dataKey="income" name="Income" fill={GREEN} opacity={0.80} radius={[4, 4, 0, 0]} />
                )}
                {(viewMode === 'all' || viewMode === 'expenses') && (
                  <Bar dataKey="expenses" name="Expenses" fill={ROSE} opacity={0.80} radius={[4, 4, 0, 0]} />
                )}
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      )}

      {/* ════════════════════════════════════
          CATEGORY PIE CHARTS
      ════════════════════════════════════ */}
      {(showExpensesV || showIncomeV || showInvestmentsV) && (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {showExpensesV && (
            <PieCard
              title="Expenses by Category" sub={formatMonth(selectedMonth)}
              data={expByCategory} colorFn={getCategoryColor}
              empty="No expenses this month"
              onAdd={() => setShowAddExpense(true)} addLabel="+ Add Expense"
              accentColor={ROSE}
            />
          )}
          {showIncomeV && (
            <PieCard
              title="Income by Source" sub={formatMonth(selectedMonth)}
              data={incByCategory} colorFn={(n) => INCOME_CATEGORY_COLORS[n] ?? '#94a3b8'}
              empty="No income this month"
              onAdd={() => setShowAddIncome(true)} addLabel="+ Add Income"
              accentColor={GREEN}
            />
          )}
          {showInvestmentsV && (
            <PieCard
              title="Portfolio Breakdown" sub="All time · current value"
              data={invByCategory} colorFn={(n) => INVESTMENT_CATEGORY_COLORS[n] ?? '#94a3b8'}
              empty="No investments yet"
              addLink="/investments" addLinkLabel="+ Add Investment"
              accentColor={I400}
            />
          )}
        </div>
      )}

      {/* ════════════════════════════════════
          INVESTMENT RETURNS
      ════════════════════════════════════ */}
      {showInvestmentsV && investments.length > 0 && (
        <div className="card p-5 relative overflow-hidden">
          <div
            style={{
              position: 'absolute', top: 0, left: '10%', right: '10%', height: '1px',
              background: `linear-gradient(90deg, transparent, ${I500}55, transparent)`,
              pointerEvents: 'none',
            }}
          />
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Investment Returns
            </h2>
            <Link href="/investments" className="text-xs font-medium transition-colors" style={{ color: I400 }}>
              Manage →
            </Link>
          </div>

          {/* Summary row */}
          <div
            className="grid grid-cols-3 gap-4 mb-4 pb-4"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            {[
              { label: 'Invested',      value: formatCurrency(totalInvested),   color: 'var(--text-primary)' },
              { label: 'Current Value', value: formatCurrency(totalCurrentVal), color: 'var(--text-primary)' },
              {
                label: 'Total Return',
                value: `${totalReturn >= 0 ? '+' : ''}${formatCurrency(totalReturn)}`,
                color: totalReturn >= 0 ? GREEN : ROSE,
              },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
                <p className="font-mono font-semibold text-sm" style={{ color }}>
                  {value}
                  {label === 'Total Return' && (
                    <span className="text-xs ml-1 opacity-70">
                      ({returnPct >= 0 ? '+' : ''}{returnPct.toFixed(1)}%)
                    </span>
                  )}
                </p>
              </div>
            ))}
          </div>

          {/* Individual holdings */}
          <div className="space-y-2">
            {investments.slice(0, 6).map((inv) => {
              const ret = Number(inv.current_value) - Number(inv.amount_invested)
              const pct = Number(inv.amount_invested) > 0 ? (ret / Number(inv.amount_invested)) * 100 : 0
              const col = INVESTMENT_CATEGORY_COLORS[inv.category] ?? '#94a3b8'
              return (
                <div
                  key={inv.id}
                  className="flex items-center gap-3 text-xs px-2 py-1.5 rounded-lg transition-colors"
                  style={{ cursor: 'default' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(99,102,241,0.05)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ background: col, boxShadow: `0 0 6px ${col}60` }}
                  />
                  <span className="flex-1 truncate" style={{ color: 'var(--text-secondary)' }}>
                    {inv.name}
                  </span>
                  <span className="font-mono" style={{ color: 'var(--text-muted)' }}>
                    {formatCurrency(Number(inv.current_value))}
                  </span>
                  <span
                    className="font-mono font-semibold w-14 text-right"
                    style={{ color: ret >= 0 ? GREEN : ROSE }}
                  >
                    {ret >= 0 ? '+' : ''}{pct.toFixed(1)}%
                  </span>
                </div>
              )
            })}
          </div>

          {investments.length > 6 && (
            <Link href="/investments" className="text-xs mt-3 inline-block font-medium" style={{ color: I400 }}>
              +{investments.length - 6} more →
            </Link>
          )}
        </div>
      )}

      {/* ════════════════════════════════════
          RECENT TRANSACTIONS
      ════════════════════════════════════ */}
      {(showIncomeV || showExpensesV) && (
        <div className="grid md:grid-cols-2 gap-4">

          {showExpensesV && (
            <div className="card overflow-hidden">
              <div
                className="flex items-center justify-between px-5 py-3.5"
                style={{ borderBottom: '1px solid var(--border)' }}
              >
                <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Recent Expenses
                </h2>
                <Link href="/expenses" className="text-xs font-medium" style={{ color: I400 }}>
                  View all →
                </Link>
              </div>
              {monthExpenses.length > 0 ? (
                <div>
                  {monthExpenses.slice(0, 5).map((e) => (
                    <div
                      key={e.id}
                      className="flex items-center gap-3 px-5 py-3 transition-colors"
                      style={{ borderBottom: '1px solid var(--border)', cursor: 'default' }}
                      onMouseEnter={(el) => (el.currentTarget.style.background = 'rgba(99,102,241,0.04)')}
                      onMouseLeave={(el) => (el.currentTarget.style.background = 'transparent')}
                    >
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0"
                        style={{ background: `${getCategoryColor(e.category)}18` }}
                      >
                        {getCategoryEmoji(e.category)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                          {e.category}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {format(parseISO(e.date), 'MMM d')}
                        </p>
                      </div>
                      <p className="text-sm font-mono font-semibold" style={{ color: ROSE }}>
                        -{formatCurrency(e.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-5 py-8 text-center">
                  <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                    No expenses this month
                  </p>
                  <button onClick={() => setShowAddExpense(true)} className="btn-primary text-xs py-1.5">
                    + Add Expense
                  </button>
                </div>
              )}
            </div>
          )}

          {showIncomeV && (
            <div className="card overflow-hidden">
              <div
                className="flex items-center justify-between px-5 py-3.5"
                style={{ borderBottom: '1px solid var(--border)' }}
              >
                <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Recent Income
                </h2>
                <Link href="/income" className="text-xs font-medium" style={{ color: GREEN }}>
                  View all →
                </Link>
              </div>
              {monthIncome.length > 0 ? (
                <div>
                  {monthIncome.slice(0, 5).map((i) => (
                    <div
                      key={i.id}
                      className="flex items-center gap-3 px-5 py-3 transition-colors"
                      style={{ borderBottom: '1px solid var(--border)', cursor: 'default' }}
                      onMouseEnter={(el) => (el.currentTarget.style.background = 'rgba(16,185,129,0.04)')}
                      onMouseLeave={(el) => (el.currentTarget.style.background = 'transparent')}
                    >
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0"
                        style={{ background: `${INCOME_CATEGORY_COLORS[i.category] ?? '#94a3b8'}18` }}
                      >
                        💵
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                          {i.source}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {format(parseISO(i.date), 'MMM d')}
                          {i.is_recurring && (
                            <span className="ml-1" style={{ color: CYAN }}>↻</span>
                          )}
                        </p>
                      </div>
                      <p className="text-sm font-mono font-semibold" style={{ color: GREEN }}>
                        +{formatCurrency(i.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-5 py-8 text-center">
                  <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                    No income this month
                  </p>
                  <button
                    onClick={() => setShowAddIncome(true)}
                    className="text-xs py-1.5 px-3 rounded-lg font-semibold"
                    style={{ background: 'rgba(16,185,129,0.15)', color: GREEN, border: '1px solid rgba(16,185,129,0.25)' }}
                  >
                    + Add Income
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Modals ── */}
      {showAddExpense && (
        <AddExpenseModal
          userId={userId}
          onClose={() => setShowAddExpense(false)}
          onSaved={(e) => { setExpenses((p) => [e, ...p]); setShowAddExpense(false) }}
        />
      )}
      {showAddIncome && (
        <AddIncomeModal
          userId={userId}
          onClose={() => setShowAddIncome(false)}
          onSaved={(i) => { setIncome((p) => [i, ...p]); setShowAddIncome(false) }}
        />
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════
   PieCard sub-component
══════════════════════════════════════════════════ */
function PieCard({
  title, sub, data, colorFn, empty, onAdd, addLabel,
  accentColor, addLink, addLinkLabel,
}: {
  title: string; sub: string; data: { name: string; value: number }[]
  colorFn: (name: string) => string; empty: string
  onAdd?: () => void; addLabel?: string; accentColor: string
  addLink?: string; addLinkLabel?: string
}) {
  return (
    <div className="card p-5 relative overflow-hidden">
      {/* Top shimmer */}
      <div
        style={{
          position: 'absolute', top: 0, left: '20%', right: '20%', height: '1px',
          background: `linear-gradient(90deg, transparent, ${accentColor}44, transparent)`,
          pointerEvents: 'none',
        }}
      />
      <h2 className="text-sm font-semibold mb-0.5" style={{ color: 'var(--text-primary)' }}>
        {title}
      </h2>
      <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>{sub}</p>

      {data.length > 0 ? (
        <>
          <ResponsiveContainer width="100%" height={130}>
            <PieChart>
              <Pie
                data={data}
                cx="50%" cy="50%"
                innerRadius={32} outerRadius={55}
                paddingAngle={2} dataKey="value"
              >
                {data.map((e) => (
                  <Cell key={e.name} fill={colorFn(e.name)} opacity={0.9} />
                ))}
              </Pie>
              <Tooltip content={<PieTooltipBox colorFn={colorFn} />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {data.slice(0, 4).map((c) => (
              <div key={c.name} className="flex items-center gap-2 text-xs">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: colorFn(c.name), boxShadow: `0 0 4px ${colorFn(c.name)}80` }}
                />
                <span className="flex-1 truncate" style={{ color: 'var(--text-secondary)' }}>
                  {c.name}
                </span>
                <span className="font-mono font-semibold" style={{ color: accentColor }}>
                  {formatCurrency(c.value)}
                </span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="h-32 flex flex-col items-center justify-center gap-3">
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{empty}</p>
          {onAdd && addLabel && (
            <button
              onClick={onAdd}
              className="text-xs py-1.5 px-3 rounded-lg font-semibold transition-all"
              style={{ background: `${accentColor}18`, color: accentColor, border: `1px solid ${accentColor}30` }}
            >
              {addLabel}
            </button>
          )}
          {addLink && addLinkLabel && (
            <Link
              href={addLink}
              className="text-xs py-1.5 px-3 rounded-lg font-semibold transition-all"
              style={{ background: `${accentColor}18`, color: accentColor, border: `1px solid ${accentColor}30` }}
            >
              {addLinkLabel}
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
