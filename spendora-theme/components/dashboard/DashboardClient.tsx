'use client'

import { useState, useMemo } from 'react'
import { format, parseISO, getDaysInMonth, startOfMonth, getDay } from 'date-fns'
import {
  TrendingUp, TrendingDown, Receipt, Target, Wallet, BarChart2,
  ArrowUpRight, ArrowDownRight, X, Plus, ChevronLeft, ChevronRight,
  LayoutDashboard, CalendarDays, PieChart as PieIcon, BarChart,
} from 'lucide-react'
import {
  ResponsiveContainer, BarChart as ReBarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell,
} from 'recharts'
import type { Expense, Income, Investment, Budget } from '@/types'
import { INVESTMENT_CATEGORY_COLORS, INCOME_CATEGORY_COLORS } from '@/types'
import {
  formatCurrency, formatMonth,
  getBudgetBarColor, getBudgetStatusColor, calcPercent, getCategoryColor, cn,
} from '@/lib/utils'
import Link from 'next/link'
import AddExpenseModal from '@/components/expenses/AddExpenseModal'
import AddIncomeModal from '@/components/income/AddIncomeModal'

type ViewMode  = 'all' | 'income' | 'expenses' | 'investments' | 'budget'
type ChartType = 'daily' | 'heatmap' | 'donut'

interface Props {
  expenses: Expense[]
  income: Income[]
  investments: Investment[]
  budgets: Budget[]
  currentMonth: string
  userId: string
}

function getMonthKey(d: string) { return d.slice(0, 7) }

function getCategoryEmoji(cat: string): string {
  const m: Record<string, string> = {
    'Food & Dining':'🍽️', Transportation:'🚗', Shopping:'🛍️', Entertainment:'🎬',
    Healthcare:'🏥', Utilities:'💡', Housing:'🏠', Education:'📚',
    'Personal Care':'💆', Travel:'✈️', Subscriptions:'🔄', Other:'📌',
  }
  return m[cat] ?? '💰'
}

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const MONTH_FULL  = ['January','February','March','April','May','June','July','August','September','October','November','December']

export default function DashboardClient({
  expenses: initExp, income: initInc, investments, budgets, currentMonth, userId,
}: Props) {
  const [expenses, setExpenses] = useState(initExp)
  const [income, setIncome]     = useState(initInc)
  const [viewMode, setViewMode] = useState<ViewMode>('all')
  const [chartType, setChartType] = useState<ChartType>('daily')
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [showAddIncome,  setShowAddIncome]  = useState(false)

  const selectedYear     = selectedMonth.slice(0, 4)
  const selectedMonthNum = selectedMonth.slice(5, 7)

  // Available years from data
  const availableYears = useMemo(() => {
    const years = new Set<string>()
    expenses.forEach(e => years.add(e.date.slice(0, 4)))
    income.forEach(i  => years.add(i.date.slice(0, 4)))
    years.add(new Date().getFullYear().toString())
    return Array.from(years).sort().reverse()
  }, [expenses, income])

  function changeMonth(dir: 1 | -1) {
    const d = new Date(selectedMonth + '-15')
    d.setMonth(d.getMonth() + dir)
    setSelectedMonth(d.toISOString().slice(0, 7))
  }

  function handleYearChange(y: string) {
    setSelectedMonth(`${y}-${selectedMonthNum}`)
  }

  function handleMonthChange(m: string) {
    setSelectedMonth(`${selectedYear}-${m}`)
  }

  const budget        = useMemo(() => budgets.find(b => b.month === selectedMonth) ?? null, [budgets, selectedMonth])
  const monthExpenses = useMemo(() => expenses.filter(e => getMonthKey(e.date) === selectedMonth), [expenses, selectedMonth])
  const monthIncome   = useMemo(() => income.filter(i => getMonthKey(i.date) === selectedMonth), [income, selectedMonth])

  const totalExpenses   = useMemo(() => monthExpenses.reduce((s, e) => s + Number(e.amount), 0), [monthExpenses])
  const totalIncome     = useMemo(() => monthIncome.reduce((s, i) => s + Number(i.amount), 0), [monthIncome])
  const netSavings      = totalIncome - totalExpenses
  const totalInvested   = useMemo(() => investments.reduce((s, i) => s + Number(i.amount_invested), 0), [investments])
  const totalCurrentVal = useMemo(() => investments.reduce((s, i) => s + Number(i.current_value), 0), [investments])
  const totalReturn     = totalCurrentVal - totalInvested
  const returnPct       = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0

  // Daily breakdown for selected month
  const dailyData = useMemo(() => {
    const base = new Date(selectedMonth + '-01')
    const days = getDaysInMonth(base)
    return Array.from({ length: days }, (_, i) => {
      const dayStr = String(i + 1).padStart(2, '0')
      const dateStr = `${selectedMonth}-${dayStr}`
      const exp = monthExpenses.filter(e => e.date.startsWith(dateStr)).reduce((s, e) => s + Number(e.amount), 0)
      const inc = monthIncome.filter(i => i.date.startsWith(dateStr)).reduce((s, i) => s + Number(i.amount), 0)
      return { day: i + 1, label: String(i + 1), expenses: exp, income: inc }
    })
  }, [monthExpenses, monthIncome, selectedMonth])

  // Heatmap data — spending per day
  const heatmapData = useMemo(() => {
    const base = new Date(selectedMonth + '-01')
    const days = getDaysInMonth(base)
    const startDay = getDay(startOfMonth(base)) // 0=Sun
    const maxSpend = Math.max(...dailyData.map(d => d.expenses), 1)
    return { days, startDay, maxSpend, dailyData }
  }, [dailyData, selectedMonth])

  // Donut data — expenses by category
  const expByCategory = useMemo(() => {
    const map: Record<string, number> = {}
    monthExpenses.forEach(e => { map[e.category] = (map[e.category] ?? 0) + Number(e.amount) })
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }))
  }, [monthExpenses])

  const incByCategory = useMemo(() => {
    const map: Record<string, number> = {}
    monthIncome.forEach(i => { map[i.category] = (map[i.category] ?? 0) + Number(i.amount) })
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }))
  }, [monthIncome])

  const invByCategory = useMemo(() => {
    const map: Record<string, number> = {}
    investments.forEach(i => { map[i.category] = (map[i.category] ?? 0) + Number(i.current_value) })
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }))
  }, [investments])

  const budgetAmt       = budget?.amount ?? 0
  const budgetPct       = budgetAmt > 0 ? Math.min(calcPercent(totalExpenses, budgetAmt), 100) : 0
  const budgetRemaining = budgetAmt - totalExpenses

  const showIncome      = viewMode === 'all' || viewMode === 'income'
  const showExpenses    = viewMode === 'all' || viewMode === 'expenses' || viewMode === 'budget'
  const showInvestments = viewMode === 'all' || viewMode === 'investments'
  const showBudget      = viewMode === 'all' || viewMode === 'budget'
  const showTrend       = viewMode === 'all' || viewMode === 'income' || viewMode === 'expenses'

  const DailyTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div className="custom-tooltip space-y-1 min-w-[130px]">
        <p className="text-[var(--text-muted)] text-xs font-medium mb-1.5">
          {MONTH_FULL[parseInt(selectedMonthNum) - 1]} {label}
        </p>
        {payload.map((p: any) => (
          <div key={p.name} className="flex items-center justify-between gap-4 text-xs">
            <span style={{ color: p.fill }}>{p.name}</span>
            <span className="font-mono">{formatCurrency(p.value)}</span>
          </div>
        ))}
      </div>
    )
  }

  const VIEW_OPTIONS: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
    { id: 'all',         label: 'Overview',    icon: <LayoutDashboard size={13} /> },
    { id: 'income',      label: 'Income',      icon: <Wallet size={13} />          },
    { id: 'expenses',    label: 'Expenses',    icon: <Receipt size={13} />         },
    { id: 'investments', label: 'Investments', icon: <BarChart2 size={13} />       },
    { id: 'budget',      label: 'Budget',      icon: <Target size={13} />          },
  ]

  const CHART_OPTIONS: { id: ChartType; label: string; icon: React.ReactNode }[] = [
    { id: 'daily',   label: 'Daily',   icon: <BarChart size={13} />       },
    { id: 'heatmap', label: 'Heatmap', icon: <CalendarDays size={13} />   },
    { id: 'donut',   label: 'Donut',   icon: <PieIcon size={13} />        },
  ]

  return (
    <div className="space-y-5 pb-24 lg:pb-8 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl md:text-3xl text-[var(--text-primary)]">Dashboard</h1>
          <p className="text-[var(--text-muted)] text-sm mt-0.5">
            {MONTH_FULL[parseInt(selectedMonthNum) - 1]} {selectedYear} · Your money at a glance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddIncome(true)}
            className="btn-secondary text-xs"
            style={{ color: '#10b981', borderColor: 'rgba(16,185,129,0.2)' }}
          >
            <Plus size={13} /> Income
          </button>
          <button onClick={() => setShowAddExpense(true)} className="btn-primary text-xs">
            <Plus size={13} /> Expense
          </button>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="card p-3 space-y-2.5">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">

          {/* Year + Month Picker */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => changeMonth(-1)}
              className="btn-ghost p-1.5 rounded-lg"
              aria-label="Previous month"
            >
              <ChevronLeft size={14} />
            </button>

            {/* Year dropdown */}
            <select
              value={selectedYear}
              onChange={e => handleYearChange(e.target.value)}
              className="appearance-none bg-[var(--bg-card)] text-[var(--text-primary)] text-xs font-medium
                border border-[var(--border)] rounded-lg px-2.5 py-1.5 cursor-pointer
                focus:outline-none focus:border-[rgba(0,212,170,0.4)]
                hover:border-[rgba(255,255,255,0.12)] transition-colors"
            >
              {availableYears.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>

            {/* Month dropdown */}
            <select
              value={selectedMonthNum}
              onChange={e => handleMonthChange(e.target.value)}
              className="appearance-none bg-[var(--bg-card)] text-xs font-medium
                border border-[var(--border)] rounded-lg px-2.5 py-1.5 cursor-pointer
                focus:outline-none focus:border-[rgba(0,212,170,0.4)]
                hover:border-[rgba(255,255,255,0.12)] transition-colors"
              style={{ color: '#00D4AA' }}
            >
              {MONTH_NAMES.map((m, i) => (
                <option key={m} value={String(i + 1).padStart(2, '0')}>{m}</option>
              ))}
            </select>

            <button
              onClick={() => changeMonth(1)}
              className="btn-ghost p-1.5 rounded-lg"
              aria-label="Next month"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="hidden sm:block h-4 w-px bg-[var(--border)]" />

          {/* View mode */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-[var(--text-muted)]">View</span>
            <div className="flex gap-1 flex-wrap">
              {VIEW_OPTIONS.map(({ id, label, icon }) => (
                <button key={id} onClick={() => setViewMode(id)}
                  className={cn('flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all border',
                    viewMode === id
                      ? 'bg-amber-400/15 text-amber-400 border-amber-400/30'
                      : 'text-[var(--text-muted)] border-transparent hover:bg-white/5 hover:text-[var(--text-secondary)]'
                  )}>
                  {icon}{label}
                </button>
              ))}
            </div>
          </div>

          {/* Chart type */}
          {showTrend && (
            <>
              <div className="hidden sm:block h-4 w-px bg-[var(--border)]" />
              <div className="flex gap-1">
                {CHART_OPTIONS.map(({ id, label, icon }) => (
                  <button key={id} onClick={() => setChartType(id)}
                    className={cn('flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border transition-all',
                      chartType === id
                        ? 'bg-amber-400/10 text-amber-400 border-amber-400/20'
                        : 'text-[var(--text-muted)] border-transparent hover:bg-white/5'
                    )}>
                    {icon}{label}
                  </button>
                ))}
              </div>
            </>
          )}

          {viewMode !== 'all' && (
            <button onClick={() => setViewMode('all')}
              className="ml-auto flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-rose-400 transition-colors">
              <X size={11} /> Reset
            </button>
          )}
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {showIncome && (
          <div className="stat-card animate-slide-up">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Income</span>
              <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center">
                <ArrowUpRight size={15} className="text-jade-400" />
              </div>
            </div>
            <p className="text-xl font-mono font-semibold text-jade-400">{formatCurrency(totalIncome)}</p>
            <p className="text-xs text-[var(--text-muted)]">This month</p>
          </div>
        )}
        {showExpenses && (
          <div className="stat-card animate-slide-up">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Expenses</span>
              <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center">
                <ArrowDownRight size={15} className="text-rose-400" />
              </div>
            </div>
            <p className="text-xl font-mono font-semibold text-rose-400">{formatCurrency(totalExpenses)}</p>
            <p className="text-xs text-[var(--text-muted)]">This month</p>
          </div>
        )}
        {showIncome && (
          <div className="stat-card animate-slide-up">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Net Savings</span>
              <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center">
                {netSavings >= 0
                  ? <TrendingUp size={15} className="text-sky-400" />
                  : <TrendingDown size={15} className="text-amber-400" />}
              </div>
            </div>
            <p className={`text-xl font-mono font-semibold ${netSavings >= 0 ? 'text-sky-400' : 'text-amber-400'}`}>
              {formatCurrency(Math.abs(netSavings))}
            </p>
            <p className="text-xs text-[var(--text-muted)]">{netSavings >= 0 ? 'Surplus' : 'Deficit'}</p>
          </div>
        )}
        {showInvestments && (
          <div className="stat-card animate-slide-up">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Portfolio</span>
              <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center">
                <BarChart2 size={15} className="text-amber-400" />
              </div>
            </div>
            <p className="text-xl font-mono font-semibold text-[var(--text-primary)]">{formatCurrency(totalCurrentVal)}</p>
            <p className={`text-xs ${returnPct >= 0 ? 'text-jade-400' : 'text-rose-400'}`}>
              {returnPct >= 0 ? '+' : ''}{returnPct.toFixed(1)}% return
            </p>
          </div>
        )}
      </div>

      {/* ── Budget ── */}
      {showBudget && budgetAmt > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target size={14} className="text-[var(--text-muted)]" />
              <span className="text-sm font-medium text-[var(--text-primary)]">
                Monthly Budget · {MONTH_FULL[parseInt(selectedMonthNum) - 1]}
              </span>
            </div>
            <span className={`text-sm font-mono font-medium ${getBudgetStatusColor(totalExpenses, budgetAmt)}`}>
              {budgetRemaining >= 0
                ? formatCurrency(budgetRemaining) + ' left'
                : formatCurrency(Math.abs(budgetRemaining)) + ' over'}
              <span className="text-[var(--text-muted)] font-normal text-xs ml-1">/ {formatCurrency(budgetAmt)}</span>
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-white/5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${getBudgetBarColor(totalExpenses, budgetAmt)}`}
              style={{ width: `${budgetPct}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5 text-xs text-[var(--text-muted)]">
            <span>{budgetPct}% used</span>
            {budgetPct >= 80 && (
              <span className={budgetPct >= 100 ? 'text-rose-400' : 'text-orange-400'}>
                {budgetPct >= 100 ? '⚠️ Over budget' : '⚡ Nearing limit'}
              </span>
            )}
          </div>
        </div>
      )}
      {showBudget && !budgetAmt && (
        <div className="card p-4 border-dashed flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
            <Target size={14} /> No budget set for {MONTH_FULL[parseInt(selectedMonthNum) - 1]}
          </span>
          <Link href="/budgets" className="btn-secondary py-1.5 text-xs">Set Budget →</Link>
        </div>
      )}

      {/* ── Monthly Chart ── */}
      {showTrend && (
        <div className="card p-5">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h2 className="text-sm font-medium text-[var(--text-primary)]">Monthly Breakdown</h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {MONTH_FULL[parseInt(selectedMonthNum) - 1]} {selectedYear} · daily view
              </p>
            </div>
          </div>

          {/* ── DAILY BAR CHART ── */}
          {chartType === 'daily' && (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <ReBarChart data={dailyData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }} barGap={1}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
                    axisLine={false} tickLine={false}
                    interval={4}
                  />
                  <YAxis
                    tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                    axisLine={false} tickLine={false}
                    tickFormatter={v => `$${v >= 1000 ? `${(v/1000).toFixed(1)}k` : v}`}
                  />
                  <Tooltip content={<DailyTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  {(viewMode === 'all' || viewMode === 'income') && (
                    <Bar dataKey="income" name="Income" fill="#10b981" opacity={0.85} radius={[3,3,0,0]} />
                  )}
                  {(viewMode === 'all' || viewMode === 'expenses') && (
                    <Bar dataKey="expenses" name="Expenses" fill="#f43f5e" opacity={0.85} radius={[3,3,0,0]} />
                  )}
                </ReBarChart>
              </ResponsiveContainer>
              <div className="flex gap-4 mt-3 text-xs text-[var(--text-muted)]">
                {(viewMode === 'all' || viewMode === 'income') && (
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-1.5 rounded-sm inline-block" style={{background:'#10b981'}} />Income
                  </span>
                )}
                {(viewMode === 'all' || viewMode === 'expenses') && (
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-1.5 rounded-sm inline-block" style={{background:'#f43f5e'}} />Expenses
                  </span>
                )}
              </div>
            </>
          )}

          {/* ── SPENDING HEATMAP ── */}
          {chartType === 'heatmap' && (
            <div>
              <div className="grid grid-cols-7 gap-1 mb-1">
                {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
                  <div key={d} className="text-center text-[10px] text-[var(--text-muted)]">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {/* Empty cells for offset */}
                {Array.from({ length: heatmapData.startDay }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {/* Day cells */}
                {heatmapData.dailyData.map(d => {
                  const intensity = heatmapData.maxSpend > 0 ? d.expenses / heatmapData.maxSpend : 0
                  const hasActivity = d.expenses > 0 || d.income > 0
                  return (
                    <div
                      key={d.day}
                      className="aspect-square rounded-md flex items-center justify-center text-[10px] font-medium relative group cursor-default transition-all"
                      style={{
                        background: d.expenses > 0
                          ? `rgba(244,63,94,${0.1 + intensity * 0.75})`
                          : d.income > 0
                            ? 'rgba(16,185,129,0.15)'
                            : 'rgba(255,255,255,0.03)',
                        color: hasActivity ? 'var(--text-primary)' : 'var(--text-muted)',
                        border: `1px solid ${d.expenses > 0 ? `rgba(244,63,94,${0.15 + intensity * 0.3})` : 'transparent'}`,
                      }}
                    >
                      {d.day}
                      {/* Tooltip on hover */}
                      {hasActivity && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-10
                          bg-[var(--bg-card)] border border-[var(--border)] rounded-lg px-2.5 py-1.5
                          text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
                          <p className="text-[var(--text-muted)] mb-0.5">{MONTH_NAMES[parseInt(selectedMonthNum)-1]} {d.day}</p>
                          {d.expenses > 0 && <p className="text-rose-400">-{formatCurrency(d.expenses)}</p>}
                          {d.income  > 0 && <p className="text-jade-400">+{formatCurrency(d.income)}</p>}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
              <div className="flex items-center gap-4 mt-3 text-xs text-[var(--text-muted)]">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm inline-block" style={{background:'rgba(244,63,94,0.6)'}} />
                  Spending (darker = more)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm inline-block" style={{background:'rgba(16,185,129,0.3)'}} />
                  Income
                </span>
              </div>
            </div>
          )}

          {/* ── DONUT CHART ── */}
          {chartType === 'donut' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Expenses donut */}
              <div>
                <p className="text-xs font-medium text-[var(--text-secondary)] mb-2 text-center">Expenses by Category</p>
                {expByCategory.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={160}>
                      <PieChart>
                        <Pie
                          data={expByCategory} cx="50%" cy="50%"
                          innerRadius={45} outerRadius={70}
                          paddingAngle={2} dataKey="value"
                        >
                          {expByCategory.map(e => (
                            <Cell key={e.name} fill={getCategoryColor(e.name)} opacity={0.9} />
                          ))}
                        </Pie>
                        <Tooltip
                          content={({ active, payload }) => {
                            if (!active || !payload?.length) return null
                            return (
                              <div className="custom-tooltip">
                                <p className="text-xs text-[var(--text-primary)]">{payload[0].name}</p>
                                <p className="font-mono text-sm text-rose-400">{formatCurrency(Number(payload[0].value))}</p>
                              </div>
                            )
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-1.5">
                      {expByCategory.slice(0, 4).map(c => (
                        <div key={c.name} className="flex items-center gap-2 text-xs">
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: getCategoryColor(c.name) }} />
                          <span className="text-[var(--text-secondary)] flex-1 truncate">{c.name}</span>
                          <span className="font-mono text-rose-400">{formatCurrency(c.value)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="h-32 flex items-center justify-center">
                    <p className="text-xs text-[var(--text-muted)]">No expenses this month</p>
                  </div>
                )}
              </div>

              {/* Income donut */}
              <div>
                <p className="text-xs font-medium text-[var(--text-secondary)] mb-2 text-center">Income by Source</p>
                {incByCategory.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={160}>
                      <PieChart>
                        <Pie
                          data={incByCategory} cx="50%" cy="50%"
                          innerRadius={45} outerRadius={70}
                          paddingAngle={2} dataKey="value"
                        >
                          {incByCategory.map(e => (
                            <Cell key={e.name} fill={INCOME_CATEGORY_COLORS[e.name] ?? '#94a3b8'} opacity={0.9} />
                          ))}
                        </Pie>
                        <Tooltip
                          content={({ active, payload }) => {
                            if (!active || !payload?.length) return null
                            return (
                              <div className="custom-tooltip">
                                <p className="text-xs text-[var(--text-primary)]">{payload[0].name}</p>
                                <p className="font-mono text-sm text-jade-400">{formatCurrency(Number(payload[0].value))}</p>
                              </div>
                            )
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-1.5">
                      {incByCategory.slice(0, 4).map(c => (
                        <div key={c.name} className="flex items-center gap-2 text-xs">
                          <span className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ background: INCOME_CATEGORY_COLORS[c.name] ?? '#94a3b8' }} />
                          <span className="text-[var(--text-secondary)] flex-1 truncate">{c.name}</span>
                          <span className="font-mono text-jade-400">{formatCurrency(c.value)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="h-32 flex items-center justify-center">
                    <p className="text-xs text-[var(--text-muted)]">No income this month</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Category Breakdowns ── */}
      {(showExpenses || showIncome || showInvestments) && (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {showExpenses && (
            <PieCard title="Expenses by Category" sub={`${MONTH_FULL[parseInt(selectedMonthNum)-1]} ${selectedYear}`}
              data={expByCategory} colorFn={getCategoryColor} empty="No expenses this month"
              onAdd={() => setShowAddExpense(true)} addLabel="+ Add Expense" amountColor="#f43f5e" />
          )}
          {showIncome && (
            <PieCard title="Income by Source" sub={`${MONTH_FULL[parseInt(selectedMonthNum)-1]} ${selectedYear}`}
              data={incByCategory} colorFn={n => INCOME_CATEGORY_COLORS[n] ?? '#94a3b8'} empty="No income this month"
              onAdd={() => setShowAddIncome(true)} addLabel="+ Add Income" amountColor="#10b981" />
          )}
          {showInvestments && (
            <PieCard title="Portfolio Breakdown" sub="All time · current value" data={invByCategory}
              colorFn={n => INVESTMENT_CATEGORY_COLORS[n] ?? '#94a3b8'} empty="No investments yet"
              onAdd={undefined} addLabel="" amountColor="#f59e0b"
              addLink="/investments" addLinkLabel="+ Add Investment" />
          )}
        </div>
      )}

      {/* ── Investment Returns ── */}
      {showInvestments && investments.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-[var(--text-primary)]">Investment Returns</h2>
            <Link href="/investments" className="text-xs text-amber-400 hover:text-amber-300">Manage →</Link>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4 pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
            <div>
              <p className="text-xs text-[var(--text-muted)] mb-1">Invested</p>
              <p className="font-mono font-semibold text-[var(--text-primary)]">{formatCurrency(totalInvested)}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--text-muted)] mb-1">Current Value</p>
              <p className="font-mono font-semibold text-[var(--text-primary)]">{formatCurrency(totalCurrentVal)}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--text-muted)] mb-1">Total Return</p>
              <p className={`font-mono font-semibold ${totalReturn >= 0 ? 'text-jade-400' : 'text-rose-400'}`}>
                {totalReturn >= 0 ? '+' : ''}{formatCurrency(totalReturn)}
                <span className="text-xs ml-1 opacity-75">({returnPct >= 0 ? '+' : ''}{returnPct.toFixed(1)}%)</span>
              </p>
            </div>
          </div>
          <div className="space-y-2.5">
            {investments.slice(0, 6).map(inv => {
              const ret = Number(inv.current_value) - Number(inv.amount_invested)
              const pct = Number(inv.amount_invested) > 0 ? (ret / Number(inv.amount_invested)) * 100 : 0
              return (
                <div key={inv.id} className="flex items-center gap-3 text-xs">
                  <span className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: INVESTMENT_CATEGORY_COLORS[inv.category] ?? '#94a3b8' }} />
                  <span className="text-[var(--text-secondary)] flex-1 truncate">{inv.name}</span>
                  <span className="font-mono text-[var(--text-muted)]">{formatCurrency(Number(inv.current_value))}</span>
                  <span className={`font-mono font-semibold w-14 text-right ${ret >= 0 ? 'text-jade-400' : 'text-rose-400'}`}>
                    {ret >= 0 ? '+' : ''}{pct.toFixed(1)}%
                  </span>
                </div>
              )
            })}
          </div>
          {investments.length > 6 && (
            <Link href="/investments" className="text-xs text-amber-400 hover:text-amber-300 mt-3 inline-block">
              +{investments.length - 6} more →
            </Link>
          )}
        </div>
      )}

      {/* ── Recent Transactions ── */}
      {(showIncome || showExpenses) && (
        <div className="grid md:grid-cols-2 gap-4">
          {showExpenses && (
            <div className="card">
              <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: 'var(--border)' }}>
                <h2 className="text-sm font-medium text-[var(--text-primary)]">Recent Expenses</h2>
                <Link href="/expenses" className="text-xs text-amber-400 hover:text-amber-300">View all →</Link>
              </div>
              {monthExpenses.length > 0 ? (
                <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                  {monthExpenses.slice(0, 5).map(e => (
                    <div key={e.id} className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                        style={{ background: `${getCategoryColor(e.category)}20` }}>
                        {getCategoryEmoji(e.category)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[var(--text-primary)] truncate">{e.category}</p>
                        <p className="text-xs text-[var(--text-muted)]">{format(parseISO(e.date), 'MMM d')}</p>
                      </div>
                      <p className="text-sm font-mono text-rose-400">-{formatCurrency(e.amount)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-5 py-8 text-center">
                  <p className="text-[var(--text-muted)] text-xs mb-2">No expenses this month</p>
                  <button onClick={() => setShowAddExpense(true)} className="btn-primary text-xs py-1.5">+ Add Expense</button>
                </div>
              )}
            </div>
          )}
          {showIncome && (
            <div className="card">
              <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: 'var(--border)' }}>
                <h2 className="text-sm font-medium text-[var(--text-primary)]">Recent Income</h2>
                <Link href="/income" className="text-xs hover:opacity-75 transition-opacity" style={{ color: '#10b981' }}>View all →</Link>
              </div>
              {monthIncome.length > 0 ? (
                <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                  {monthIncome.slice(0, 5).map(i => (
                    <div key={i.id} className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                        style={{ background: `${INCOME_CATEGORY_COLORS[i.category] ?? '#94a3b8'}20` }}>
                        💵
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[var(--text-primary)] truncate">{i.source}</p>
                        <p className="text-xs text-[var(--text-muted)]">
                          {format(parseISO(i.date), 'MMM d')}
                          {i.is_recurring && <span className="ml-1" style={{ color: '#38bdf8' }}>↻</span>}
                        </p>
                      </div>
                      <p className="text-sm font-mono" style={{ color: '#10b981' }}>+{formatCurrency(i.amount)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-5 py-8 text-center">
                  <p className="text-[var(--text-muted)] text-xs mb-2">No income this month</p>
                  <button onClick={() => setShowAddIncome(true)}
                    className="text-xs py-1.5 px-3 rounded-lg font-medium text-white"
                    style={{ background: '#10b981' }}>
                    + Add Income
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {showAddExpense && (
        <AddExpenseModal userId={userId} onClose={() => setShowAddExpense(false)}
          onSaved={e => { setExpenses(p => [e, ...p]); setShowAddExpense(false) }} />
      )}
      {showAddIncome && (
        <AddIncomeModal userId={userId} onClose={() => setShowAddIncome(false)}
          onSaved={i => { setIncome(p => [i, ...p]); setShowAddIncome(false) }} />
      )}
    </div>
  )
}

// ── PieCard ──────────────────────────────────────────────────
function PieCard({
  title, sub, data, colorFn, empty, onAdd, addLabel, amountColor, addLink, addLinkLabel,
}: {
  title: string; sub: string; data: { name: string; value: number }[]
  colorFn: (name: string) => string; empty: string
  onAdd?: () => void; addLabel: string; amountColor: string
  addLink?: string; addLinkLabel?: string
}) {
  return (
    <div className="card p-5">
      <h2 className="text-sm font-medium text-[var(--text-primary)] mb-0.5">{title}</h2>
      <p className="text-xs text-[var(--text-muted)] mb-3">{sub}</p>
      {data.length > 0 ? (
        <>
          <ResponsiveContainer width="100%" height={130}>
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={32} outerRadius={55} paddingAngle={2} dataKey="value">
                {data.map(e => <Cell key={e.name} fill={colorFn(e.name)} opacity={0.9} />)}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  return (
                    <div className="custom-tooltip">
                      <p className="text-xs font-medium text-[var(--text-primary)]">{payload[0].name}</p>
                      <p className="font-mono text-sm" style={{ color: colorFn(String(payload[0].name)) }}>
                        {formatCurrency(Number(payload[0].value))}
                      </p>
                    </div>
                  )
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {data.slice(0, 4).map(c => (
              <div key={c.name} className="flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: colorFn(c.name) }} />
                <span className="text-[var(--text-secondary)] flex-1 truncate">{c.name}</span>
                <span className="font-mono" style={{ color: amountColor }}>{formatCurrency(c.value)}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="h-32 flex flex-col items-center justify-center gap-2">
          <p className="text-[var(--text-muted)] text-xs">{empty}</p>
          {onAdd && (
            <button onClick={onAdd} className="text-xs py-1 px-3 rounded-lg font-medium text-white"
              style={{ background: amountColor }}>
              {addLabel}
            </button>
          )}
          {addLink && addLinkLabel && (
            <Link href={addLink} className="btn-secondary py-1 text-xs">{addLinkLabel}</Link>
          )}
        </div>
      )}
    </div>
  )
}
