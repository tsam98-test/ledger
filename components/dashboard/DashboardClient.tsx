'use client'

import { useState, useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import {
  TrendingUp, TrendingDown, Receipt, Target, Wallet, BarChart2,
  ArrowUpRight, ArrowDownRight, SlidersHorizontal, X, Plus,
  LayoutDashboard,
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
import AddIncomeModal from '@/components/income/AddIncomeModal'

type ViewMode = 'all' | 'income' | 'expenses' | 'investments' | 'budget'
type ChartType = 'area' | 'bar'

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

export default function DashboardClient({
  expenses: initExp, income: initInc, investments, budgets, currentMonth, userId,
}: Props) {
  const [expenses, setExpenses] = useState(initExp)
  const [income, setIncome]     = useState(initInc)
  const [viewMode, setViewMode] = useState<ViewMode>('all')
  const [chartType, setChartType] = useState<ChartType>('area')
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
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

  const showIncome      = viewMode === 'all' || viewMode === 'income'
  const showExpenses    = viewMode === 'all' || viewMode === 'expenses' || viewMode === 'budget'
  const showInvestments = viewMode === 'all' || viewMode === 'investments'
  const showBudget      = viewMode === 'all' || viewMode === 'budget'
  const showTrend       = viewMode === 'all' || viewMode === 'income' || viewMode === 'expenses'

  const TrendTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div className="custom-tooltip space-y-1 min-w-[140px]">
        <p className="text-[var(--text-muted)] text-xs font-medium mb-1.5">{label}</p>
        {payload.map((p: any) => (
          <div key={p.name} className="flex items-center justify-between gap-4 text-xs">
            <span style={{ color: p.stroke || p.fill }}>{p.name}</span>
            <span className="font-mono">{formatCurrency(p.value)}</span>
          </div>
        ))}
      </div>
    )
  }

  const PieTip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div className="custom-tooltip">
        <p className="text-xs font-medium text-[var(--text-primary)]">{payload[0].name}</p>
        <p className="font-mono text-sm" style={{ color: payload[0].payload.fill }}>{formatCurrency(payload[0].value)}</p>
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

  return (
    <div className="space-y-5 pb-24 lg:pb-8 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl md:text-3xl text-[var(--text-primary)]">Dashboard</h1>
          <p className="text-[var(--text-muted)] text-sm mt-0.5">{formatMonth(selectedMonth)} · Financial Overview</p>
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

      {/* ── Filters / Slicers ── */}
      <div className="card p-3 space-y-2.5">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {/* Month slicer */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1 text-xs text-[var(--text-muted)] whitespace-nowrap">
              <SlidersHorizontal size={11} /> Month
            </span>
            <div className="flex gap-1 flex-wrap">
              {months.map((m) => (
                <button key={m} onClick={() => setSelectedMonth(m)}
                  className={cn('px-2.5 py-1 rounded-md text-xs font-medium transition-all border',
                    selectedMonth === m
                      ? 'bg-amber-400/15 text-amber-400 border-amber-400/30'
                      : 'text-[var(--text-muted)] border-transparent hover:bg-white/5 hover:text-[var(--text-secondary)]'
                  )}>
                  {formatMonth(m).replace(' 20', " '")}
                </button>
              ))}
            </div>
          </div>

          <div className="hidden sm:block h-4 w-px bg-[var(--border)]" />

          {/* View mode slicer */}
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
                {(['area', 'bar'] as const).map((t) => (
                  <button key={t} onClick={() => setChartType(t)}
                    className={cn('px-2.5 py-1 rounded-md text-xs font-medium border transition-all capitalize',
                      chartType === t
                        ? 'bg-amber-400/10 text-amber-400 border-amber-400/20'
                        : 'text-[var(--text-muted)] border-transparent hover:bg-white/5'
                    )}>
                    {t}
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
            <p className="text-xs text-[var(--text-muted)]">{netSavings >= 0 ? 'surplus' : 'deficit'}</p>
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
              <span className="text-sm font-medium text-[var(--text-primary)]">Budget · {formatMonth(selectedMonth)}</span>
            </div>
            <span className={`text-sm font-mono font-medium ${getBudgetStatusColor(totalExpenses, budgetAmt)}`}>
              {budgetRemaining >= 0 ? formatCurrency(budgetRemaining) + ' left' : formatCurrency(Math.abs(budgetRemaining)) + ' over'}
              <span className="text-[var(--text-muted)] font-normal text-xs ml-1">/ {formatCurrency(budgetAmt)}</span>
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-white/5 overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-700 ${getBudgetBarColor(totalExpenses, budgetAmt)}`}
              style={{ width: `${budgetPct}%` }} />
          </div>
          <div className="flex justify-between mt-1.5 text-xs text-[var(--text-muted)]">
            <span>{budgetPct}% used</span>
            {budgetPct >= 80 && (
              <span className={budgetPct >= 100 ? 'text-rose-400' : 'text-amber-400'}>
                {budgetPct >= 100 ? '⚠️ Over budget' : '⚡ Nearing limit'}
              </span>
            )}
          </div>
        </div>
      )}
      {showBudget && !budgetAmt && (
        <div className="card p-4 border-dashed flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
            <Target size={14} /> No budget set for {formatMonth(selectedMonth)}
          </span>
          <Link href="/budgets" className="btn-secondary py-1.5 text-xs">Set Budget →</Link>
        </div>
      )}

      {/* ── Trend Chart ── */}
      {showTrend && (
        <div className="card p-5">
          <div className="mb-4">
            <h2 className="text-sm font-medium text-[var(--text-primary)]">6-Month Trend</h2>
            <p className="text-xs text-[var(--text-muted)]">
              {viewMode === 'income' ? 'Income over time'
                : viewMode === 'expenses' ? 'Expenses over time'
                : 'Income · Expenses · Savings'}
            </p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            {chartType === 'area' ? (
              <AreaChart data={trendData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="ig" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="eg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => `$${v >= 1000 ? `${(v/1000).toFixed(1)}k` : v}`} />
                <Tooltip content={<TrendTooltip />} />
                {(viewMode === 'all' || viewMode === 'income') && (
                  <Area type="monotone" dataKey="income" name="Income" stroke="#10b981" strokeWidth={2}
                    fill="url(#ig)" dot={{ fill: '#10b981', r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
                )}
                {(viewMode === 'all' || viewMode === 'expenses') && (
                  <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#f43f5e" strokeWidth={2}
                    fill="url(#eg)" dot={{ fill: '#f43f5e', r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
                )}
                {viewMode === 'all' && (
                  <Area type="monotone" dataKey="savings" name="Savings" stroke="#38bdf8" strokeWidth={1.5}
                    strokeDasharray="4 2" fill="url(#sg)" dot={false} />
                )}
              </AreaChart>
            ) : (
              <BarChart data={trendData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => `$${v >= 1000 ? `${(v/1000).toFixed(1)}k` : v}`} />
                <Tooltip content={<TrendTooltip />} />
                {(viewMode === 'all' || viewMode === 'income') && (
                  <Bar dataKey="income" name="Income" fill="#10b981" opacity={0.85} radius={[3,3,0,0]} />
                )}
                {(viewMode === 'all' || viewMode === 'expenses') && (
                  <Bar dataKey="expenses" name="Expenses" fill="#f43f5e" opacity={0.85} radius={[3,3,0,0]} />
                )}
              </BarChart>
            )}
          </ResponsiveContainer>
          <div className="flex gap-4 mt-3 text-xs text-[var(--text-muted)]">
            {(viewMode === 'all' || viewMode === 'income') && (
              <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded-sm inline-block" style={{background:'#10b981'}} />Income</span>
            )}
            {(viewMode === 'all' || viewMode === 'expenses') && (
              <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded-sm inline-block" style={{background:'#f43f5e'}} />Expenses</span>
            )}
            {viewMode === 'all' && (
              <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded-sm inline-block" style={{background:'#38bdf8'}} />Savings</span>
            )}
          </div>
        </div>
      )}

      {/* ── Category Breakdowns ── */}
      {(showExpenses || showIncome || showInvestments) && (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {showExpenses && (
            <PieCard title="Expenses by Category" sub={formatMonth(selectedMonth)} data={expByCategory}
              colorFn={(n) => getCategoryColor(n)} empty="No expenses this month"
              onAdd={() => setShowAddExpense(true)} addLabel="+ Add Expense" amountColor="#f43f5e" />
          )}
          {showIncome && (
            <PieCard title="Income by Source" sub={formatMonth(selectedMonth)} data={incByCategory}
              colorFn={(n) => INCOME_CATEGORY_COLORS[n] ?? '#94a3b8'} empty="No income this month"
              onAdd={() => setShowAddIncome(true)} addLabel="+ Add Income" amountColor="#10b981" />
          )}
          {showInvestments && (
            <PieCard title="Portfolio Breakdown" sub="All time · current value" data={invByCategory}
              colorFn={(n) => INVESTMENT_CATEGORY_COLORS[n] ?? '#94a3b8'} empty="No investments yet"
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
            {investments.slice(0, 6).map((inv) => {
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
                  {monthExpenses.slice(0, 5).map((e) => (
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
                  {monthIncome.slice(0, 5).map((i) => (
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
          onSaved={(e) => { setExpenses((p) => [e, ...p]); setShowAddExpense(false) }} />
      )}
      {showAddIncome && (
        <AddIncomeModal userId={userId} onClose={() => setShowAddIncome(false)}
          onSaved={(i) => { setIncome((p) => [i, ...p]); setShowAddIncome(false) }} />
      )}
    </div>
  )
}

// ── PieCard sub-component ────────────────────────────────────
function PieCard({
  title, sub, data, colorFn, empty, onAdd, addLabel, amountColor, addLink, addLinkLabel,
}: {
  title: string; sub: string; data: { name: string; value: number }[]
  colorFn: (name: string) => string; empty: string
  onAdd?: () => void; addLabel: string; amountColor: string
  addLink?: string; addLinkLabel?: string
}) {
  const PieTip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div className="custom-tooltip">
        <p className="text-xs font-medium text-[var(--text-primary)]">{payload[0].name}</p>
        <p className="font-mono text-sm" style={{ color: colorFn(payload[0].name) }}>{formatCurrency(payload[0].value)}</p>
      </div>
    )
  }

  return (
    <div className="card p-5">
      <h2 className="text-sm font-medium text-[var(--text-primary)] mb-0.5">{title}</h2>
      <p className="text-xs text-[var(--text-muted)] mb-3">{sub}</p>
      {data.length > 0 ? (
        <>
          <ResponsiveContainer width="100%" height={130}>
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={32} outerRadius={55} paddingAngle={2} dataKey="value">
                {data.map((e) => <Cell key={e.name} fill={colorFn(e.name)} opacity={0.9} />)}
              </Pie>
              <Tooltip content={<PieTip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {data.slice(0, 4).map((c) => (
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
