'use client'

import { useState, useMemo, useEffect } from 'react'
import { format, parseISO, getDaysInMonth } from 'date-fns'
import {
  TrendingUp, TrendingDown, Receipt, Target, Wallet, BarChart2,
  ArrowUpRight, ArrowDownRight, X, Plus, ChevronLeft, ChevronRight,
  LayoutDashboard,
} from 'lucide-react'
import {
  ResponsiveContainer, BarChart as ReBarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, LabelList,
} from 'recharts'
import type { Expense, Income, Investment, Budget } from '@/types'
import { INVESTMENT_CATEGORY_COLORS, INCOME_CATEGORY_COLORS } from '@/types'
import {
  formatCurrency,
  getBudgetBarColor, getBudgetStatusColor, calcPercent, getCategoryColor, cn,
} from '@/lib/utils'
import Link from 'next/link'
import AddExpenseModal from '@/components/expenses/AddExpenseModal'
import AddIncomeModal, { type KnownSource } from '@/components/income/AddIncomeModal'

// ── Daily motivational quote ──
const QUOTES = [
  { text: "Do not save what is left after spending, but spend what is left after saving.", author: "Warren Buffett", tag: "Saving" },
  { text: "A budget is telling your money where to go instead of wondering where it went.", author: "Dave Ramsey", tag: "Budgeting" },
  { text: "Financial freedom is available to those who learn about it and work for it.", author: "Robert Kiyosaki", tag: "Freedom" },
  { text: "It's not about how much money you make, but how much money you keep.", author: "Robert Kiyosaki", tag: "Wealth" },
  { text: "The habit of saving is itself an education; it fosters every virtue.", author: "T.T. Munger", tag: "Habits" },
  { text: "Beware of little expenses. A small leak will sink a great ship.", author: "Benjamin Franklin", tag: "Expenses" },
  { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin", tag: "Investing" },
  { text: "Small daily improvements over time lead to stunning results.", author: "Robin Sharma", tag: "Growth" },
]

const todayQuote = QUOTES[new Date().getDate() % QUOTES.length]

// ── Live Clock ──
function useLiveClock() {
  const [time, setTime] = useState('')
  const [date, setDate] = useState('')
  useEffect(() => {
    function tick() {
      const now = new Date()
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
      setDate(now.toLocaleDateString([], { weekday: 'short', month: 'long', day: 'numeric' }))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])
  return { time, date }
}


type ViewMode  = 'all' | 'income' | 'expenses' | 'investments' | 'budget'

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
    'Food & Dining': '🍽️', Transportation: '🚗', Shopping: '🛍️', Entertainment: '🎬',
    Healthcare: '🏥', Utilities: '💡', Housing: '🏠', Education: '📚',
    'Personal Care': '💆', Travel: '✈️', Subscriptions: '🔄', Other: '📌',
  }
  return m[cat] ?? '💰'
}

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const MONTH_FULL  = ['January','February','March','April','May','June','July','August','September','October','November','December']

// ── View option config with accent colors ──
const VIEW_CONFIG: Record<ViewMode, { color: string; bg: string; border: string }> = {
  all:         { color: '#60d4b4', bg: 'rgba(96,212,180,0.12)',  border: 'rgba(96,212,180,0.35)'  },
  income:      { color: '#34d399', bg: 'rgba(52,211,153,0.12)',  border: 'rgba(52,211,153,0.35)'  },
  expenses:    { color: '#fb7185', bg: 'rgba(251,113,133,0.12)', border: 'rgba(251,113,133,0.35)' },
  investments: { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  border: 'rgba(251,191,36,0.35)'  },
  budget:      { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.35)' },
}

export default function DashboardClient({
  expenses: initExp, income: initInc, investments, budgets, currentMonth, userId,
}: Props) {
  const [expenses, setExpenses] = useState(initExp)
  const [income, setIncome]     = useState(initInc)
  const [viewMode, setViewMode] = useState<ViewMode>('all')
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [showAddIncome,  setShowAddIncome]  = useState(false)

  const { time, date } = useLiveClock()

  function fmt(amount: number): string {
    return formatCurrency(amount)
  }

  const selectedYear     = selectedMonth.slice(0, 4)
  const selectedMonthNum = selectedMonth.slice(5, 7)

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

  function handleYearChange(y: string)  { setSelectedMonth(`${y}-${selectedMonthNum}`) }
  function handleMonthChange(m: string) { setSelectedMonth(`${selectedYear}-${m}`) }

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

  // ── Projected spend calculation ──
  const projectedSpendData = useMemo(() => {
    const now = new Date()
    const selYear  = parseInt(selectedYear)
    const selMonth = parseInt(selectedMonthNum) - 1 // 0-indexed
    const daysInMonth = getDaysInMonth(new Date(selYear, selMonth, 1))

    let daysElapsed: number
    const isCurrentMonth =
      now.getFullYear() === selYear && now.getMonth() === selMonth
    const isPastMonth =
      new Date(selYear, selMonth, 1) < new Date(now.getFullYear(), now.getMonth(), 1)

    if (isCurrentMonth) {
      daysElapsed = now.getDate()
    } else if (isPastMonth) {
      daysElapsed = daysInMonth
    } else {
      // future month — no projection
      daysElapsed = 0
    }

    const projectedSpend =
      daysElapsed > 0 ? (totalExpenses / daysElapsed) * daysInMonth : 0

    return { projectedSpend, daysElapsed, daysInMonth, isCurrentMonth }
  }, [selectedYear, selectedMonthNum, totalExpenses])

  // Income grouped by source name (e.g. "Jack Astor", "McDonald's")
  const incBySource = useMemo(() => {
    const map: Record<string, number> = {}
    monthIncome.forEach(i => { map[i.source] = (map[i.source] ?? 0) + Number(i.amount) })
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }))
  }, [monthIncome])

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

  const expByPaymentMethod = useMemo(() => {
    const map: Record<string, number> = {}
    monthExpenses.forEach(e => { map[e.payment_method] = (map[e.payment_method] ?? 0) + Number(e.amount) })
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }))
  }, [monthExpenses])

  const savingsRate = totalIncome > 0 ? Math.max(0, Math.min(100, (netSavings / totalIncome) * 100)) : 0

  const invByCategory = useMemo(() => {
    const map: Record<string, number> = {}
    investments.forEach(i => { map[i.category] = (map[i.category] ?? 0) + Number(i.current_value) })
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }))
  }, [investments])

  const budgetAmt       = budget?.amount ?? 0
  const budgetPct       = budgetAmt > 0 ? Math.min(calcPercent(totalExpenses, budgetAmt), 100) : 0
  const budgetRemaining = budgetAmt - totalExpenses

  // Deduplicated known income sources for quick-select chips in AddIncomeModal
  const knownSources = useMemo<KnownSource[]>(() => {
    const map = new Map<string, string>()
    // income is sorted date desc — first occurrence per source = most recent category
    ;[...income].forEach(i => {
      if (!map.has(i.source)) map.set(i.source, i.category)
    })
    return Array.from(map.entries()).map(([source, category]) => ({ source, category }))
  }, [income])

  // Projected bar percentages (capped at 100 for the bar, raw for the label)
  const projectedPct = budgetAmt > 0
    ? Math.min((projectedSpendData.projectedSpend / budgetAmt) * 100, 100)
    : 0
  const projectedOverBudget = projectedSpendData.projectedSpend > budgetAmt
  // The dashed extension starts at current spend % and goes to projected %
  const dashedStart  = budgetPct
  const dashedWidth  = Math.max(projectedPct - budgetPct, 0)

  const showIncome      = viewMode === 'all' || viewMode === 'income'
  const showExpenses    = viewMode === 'all' || viewMode === 'expenses' || viewMode === 'budget'
  const showInvestments = viewMode === 'all' || viewMode === 'investments'
  const showBudget      = viewMode === 'all' || viewMode === 'budget'

  const VIEW_OPTIONS: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
    { id: 'all',         label: 'Overview',    icon: <LayoutDashboard size={13} /> },
    { id: 'income',      label: 'Income',      icon: <Wallet size={13} />          },
    { id: 'expenses',    label: 'Expenses',    icon: <Receipt size={13} />         },
    { id: 'investments', label: 'Investments', icon: <BarChart2 size={13} />       },
    { id: 'budget',      label: 'Budget',      icon: <Target size={13} />          },
  ]

  return (
    <div className="space-y-5 pb-24 lg:pb-8 animate-fade-in">

      {/* ── Header — quote + clock on one compact line ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">

        {/* Left — Quote compressed to single line */}
        <div className="flex items-center gap-2 min-w-0">
          <p
            className="text-sm font-semibold italic truncate"
            style={{ color: '#60d4b4' }}
          >
            "{todayQuote.text}"
          </p>
          <span
            className="text-xs font-medium whitespace-nowrap flex-shrink-0"
            style={{ color: 'rgba(96,212,180,0.45)' }}
          >
            — {todayQuote.author}
          </span>
        </div>

        {/* Right — Clock + Buttons */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Clock */}
          <p className="font-mono text-xs font-semibold hidden md:block"
            style={{ color: 'rgba(96,212,180,0.6)' }}>
            🕐 {time} · {date}
          </p>

          {/* Buttons */}
          <button
            onClick={() => setShowAddIncome(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border transition-all
              hover:scale-[1.03] active:scale-[0.97]"
            style={{
              color: '#34d399',
              borderColor: 'rgba(52,211,153,0.35)',
              background: 'rgba(52,211,153,0.08)',
            }}
          >
            <Plus size={14} /> Income
          </button>
          <button
            onClick={() => setShowAddExpense(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white
              transition-all hover:scale-[1.03] active:scale-[0.97]"
            style={{ background: 'linear-gradient(135deg, #00c9a7, #00a896)' }}
          >
            <Plus size={14} /> Expense
          </button>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="card p-3.5">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">

          {/* Month Navigator */}
          <div className="flex items-center gap-1.5">
            <button onClick={() => changeMonth(-1)} className="p-1.5 rounded-lg hover:bg-white/8 transition-colors text-white/60 hover:text-white">
              <ChevronLeft size={15} />
            </button>
            <select
              value={selectedYear}
              onChange={e => handleYearChange(e.target.value)}
              className="appearance-none bg-white/8 text-white text-sm font-semibold
                border border-white/12 rounded-lg px-3 py-1.5 cursor-pointer
                focus:outline-none focus:border-white/25 hover:border-white/20 transition-colors"
              style={{ colorScheme: 'dark' }}
            >
              {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <select
              value={selectedMonthNum}
              onChange={e => handleMonthChange(e.target.value)}
              className="appearance-none bg-white/8 text-sm font-semibold
                border border-white/12 rounded-lg px-3 py-1.5 cursor-pointer
                focus:outline-none focus:border-white/25 hover:border-white/20 transition-colors"
              style={{ color: '#60d4b4', colorScheme: 'dark' }}
            >
              {MONTH_NAMES.map((m, i) => (
                <option key={m} value={String(i + 1).padStart(2, '0')}>{m}</option>
              ))}
            </select>
            <button onClick={() => changeMonth(1)} className="p-1.5 rounded-lg hover:bg-white/8 transition-colors text-white/60 hover:text-white">
              <ChevronRight size={15} />
            </button>
          </div>

          <div className="hidden sm:block h-5 w-px bg-white/10" />

          {/* View mode */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex gap-1 flex-wrap">
              {VIEW_OPTIONS.map(({ id, label, icon }) => {
                const cfg = VIEW_CONFIG[id]
                const isActive = viewMode === id
                return (
                  <button
                    key={id}
                    onClick={() => setViewMode(id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border"
                    style={isActive
                      ? { color: cfg.color, background: cfg.bg, borderColor: cfg.border }
                      : { color: 'rgba(255,255,255,0.55)', background: 'transparent', borderColor: 'transparent' }
                    }
                  >
                    {icon}{label}
                  </button>
                )
              })}
            </div>
          </div>

          {viewMode !== 'all' && (
            <button
              onClick={() => setViewMode('all')}
              className="ml-auto flex items-center gap-1 text-xs font-medium text-white/40 hover:text-rose-400 transition-colors"
            >
              <X size={11} /> Reset
            </button>
          )}
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

        {showIncome && (
          <div className="stat-card animate-slide-up group hover:scale-[1.02] transition-transform cursor-default"
            style={{ borderColor: 'rgba(52,211,153,0.2)', background: 'linear-gradient(135deg, rgba(52,211,153,0.06) 0%, transparent 60%)' }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-white/50 uppercase tracking-widest">Income</span>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.25)' }}>
                <ArrowUpRight size={16} style={{ color: '#34d399' }} />
              </div>
            </div>
            <p className="text-3xl font-mono font-bold mb-1" style={{ color: '#34d399' }}>
              {fmt(totalIncome)}
            </p>
            <p className="text-xs font-medium text-white/45">This month</p>
          </div>
        )}

        {showExpenses && (
          <div className="stat-card animate-slide-up group hover:scale-[1.02] transition-transform cursor-default"
            style={{ borderColor: 'rgba(251,113,133,0.2)', background: 'linear-gradient(135deg, rgba(251,113,133,0.06) 0%, transparent 60%)' }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-white/50 uppercase tracking-widest">Expenses</span>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(251,113,133,0.15)', border: '1px solid rgba(251,113,133,0.25)' }}>
                <ArrowDownRight size={16} style={{ color: '#fb7185' }} />
              </div>
            </div>
            <p className="text-3xl font-mono font-bold mb-1" style={{ color: '#fb7185' }}>
              {fmt(totalExpenses)}
            </p>
            <p className="text-xs font-medium text-white/45">This month</p>
          </div>
        )}

        {showIncome && (
          <div className="stat-card animate-slide-up group hover:scale-[1.02] transition-transform cursor-default"
            style={{
              borderColor: netSavings >= 0 ? 'rgba(56,189,248,0.2)' : 'rgba(251,191,36,0.2)',
              background: netSavings >= 0
                ? 'linear-gradient(135deg, rgba(56,189,248,0.06) 0%, transparent 60%)'
                : 'linear-gradient(135deg, rgba(251,191,36,0.06) 0%, transparent 60%)',
            }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-white/50 uppercase tracking-widest">Net Savings</span>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{
                  background: netSavings >= 0 ? 'rgba(56,189,248,0.15)' : 'rgba(251,191,36,0.15)',
                  border: `1px solid ${netSavings >= 0 ? 'rgba(56,189,248,0.25)' : 'rgba(251,191,36,0.25)'}`,
                }}>
                {netSavings >= 0
                  ? <TrendingUp size={16} style={{ color: '#38bdf8' }} />
                  : <TrendingDown size={16} style={{ color: '#fbbf24' }} />}
              </div>
            </div>
            <p className="text-3xl font-mono font-bold mb-1" style={{ color: netSavings >= 0 ? '#38bdf8' : '#fbbf24' }}>
              {fmt(Math.abs(netSavings))}
            </p>
            <p className="text-xs font-medium text-white/45">{netSavings >= 0 ? 'Surplus' : 'Deficit'}</p>
          </div>
        )}

        {showInvestments && (
          <div className="stat-card animate-slide-up group hover:scale-[1.02] transition-transform cursor-default"
            style={{ borderColor: 'rgba(251,191,36,0.2)', background: 'linear-gradient(135deg, rgba(251,191,36,0.06) 0%, transparent 60%)' }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-white/50 uppercase tracking-widest">Portfolio</span>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.25)' }}>
                <BarChart2 size={16} style={{ color: '#fbbf24' }} />
              </div>
            </div>
            <p className="text-3xl font-mono font-bold text-white mb-1">
              {fmt(totalCurrentVal)}
            </p>
            <p className="text-xs font-semibold" style={{ color: returnPct >= 0 ? '#34d399' : '#fb7185' }}>
              {returnPct >= 0 ? '+' : ''}{returnPct.toFixed(1)}% return
            </p>
          </div>
        )}
      </div>

      {/* ── Budget Bar ── */}
      {showBudget && budgetAmt > 0 && (
        <div className="card p-5" style={{ borderColor: 'rgba(167,139,250,0.2)', background: 'linear-gradient(135deg, rgba(167,139,250,0.04) 0%, transparent 60%)' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.25)' }}>
                <Target size={13} style={{ color: '#a78bfa' }} />
              </div>
              <span className="text-sm font-semibold text-white">
                Monthly Budget · {MONTH_FULL[parseInt(selectedMonthNum) - 1]}
              </span>
            </div>
            <span className={`text-base font-mono font-bold ${getBudgetStatusColor(totalExpenses, budgetAmt)}`}>
              {budgetRemaining >= 0
                ? fmt(budgetRemaining) + ' left'
                : fmt(Math.abs(budgetRemaining)) + ' over'}
              <span className="text-white/35 font-normal text-xs ml-1.5">/ {fmt(budgetAmt)}</span>
            </span>
          </div>

          {/* Bar track — position:relative to anchor the projected overlay */}
          <div className="h-3 rounded-full bg-white/8 overflow-hidden relative">
            {/* Solid spend bar */}
            <div
  className="h-full rounded-full transition-all duration-700"
  style={{
    width: `${budgetPct}%`,
    background: budgetPct >= 100 ? '#ef4444' : budgetPct >= 80 ? '#f97316' : '#a78bfa',
  }}
/>
          </div>

          <div className="flex justify-between mt-2 text-xs font-medium">
            <span className="text-white/40">{budgetPct}% used</span>
            <div className="flex items-center gap-3">
              {budgetPct >= 80 && (
                <span className={budgetPct >= 100 ? 'text-rose-400' : 'text-orange-400'}>
                  {budgetPct >= 100 ? '⚠️ Over budget' : '⚡ Nearing limit'}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
      {showBudget && !budgetAmt && (
        <div className="card p-4 border-dashed flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm font-medium text-white/45">
            <Target size={14} style={{ color: '#a78bfa' }} />
            No budget set for {MONTH_FULL[parseInt(selectedMonthNum) - 1]}
          </span>
          <Link href="/budgets" className="btn-secondary py-1.5 text-xs font-semibold">Set Budget →</Link>
        </div>
      )}

      {/* ── Monthly Breakdown — dual charts ── */}
      {(showIncome || showExpenses) && (
        <div className="grid md:grid-cols-2 gap-4">

          {/* ── Income by Source — horizontal bars ── */}
          {showIncome && (
            <div className="card p-5" style={{ borderColor: 'rgba(52,211,153,0.15)', background: 'linear-gradient(135deg, rgba(52,211,153,0.04) 0%, transparent 60%)' }}>
              <h2 className="text-sm font-bold text-white mb-0.5">Income by Source</h2>
              <p className="text-xs font-medium text-white/40 mb-4">
                {MONTH_FULL[parseInt(selectedMonthNum) - 1]} {selectedYear} · all shifts combined
              </p>
              {incBySource.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={Math.max(incBySource.length * 52, 80)}>
                    <ReBarChart
                      layout="vertical"
                      data={incBySource}
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
                                +{fmt(Number(payload[0].value))}
                              </p>
                            </div>
                          )
                        }}
                      />
                      <Bar dataKey="value" name="Income" radius={[0, 4, 4, 0]} maxBarSize={32}>
                        {incBySource.map((_, i) => (
                          <Cell
                            key={i}
                            fill={`rgba(52,211,153,${0.9 - i * 0.15})`}
                          />
                        ))}
                      </Bar>
                    </ReBarChart>
                  </ResponsiveContainer>
                  {/* Source totals legend */}
                  <div className="space-y-2 mt-4 pt-4 border-t border-white/8">
                    {incBySource.map((s, i) => (
                      <div key={s.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                            style={{ background: `rgba(52,211,153,${0.9 - i * 0.15})` }} />
                          <span className="text-white/70 font-medium truncate max-w-[140px]">{s.name}</span>
                        </div>
                        <span className="font-mono font-bold" style={{ color: '#34d399' }}>+{fmt(s.value)}</span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-white/8 mt-1">
                      <span className="text-white/45 font-semibold uppercase tracking-wider">Total</span>
                      <span className="font-mono font-bold text-sm" style={{ color: '#34d399' }}>+{fmt(totalIncome)}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-32 flex flex-col items-center justify-center gap-3">
                  <p className="text-sm text-white/35">No income recorded this month</p>
                  <button onClick={() => setShowAddIncome(true)}
                    className="text-xs font-semibold py-1.5 px-3 rounded-xl text-white"
                    style={{ background: '#10b981' }}>
                    + Add Income
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Expenses by Category — vertical bars ── */}
          {showExpenses && (
            <div className="card p-5" style={{ borderColor: 'rgba(251,113,133,0.15)', background: 'linear-gradient(135deg, rgba(251,113,133,0.04) 0%, transparent 60%)' }}>
              <h2 className="text-sm font-bold text-white mb-0.5">Expenses by Category</h2>
              <p className="text-xs font-medium text-white/40 mb-4">
                {MONTH_FULL[parseInt(selectedMonthNum) - 1]} {selectedYear} · spending breakdown
              </p>
              {expByCategory.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <ReBarChart
                      data={expByCategory}
                      margin={{ top: 24, right: 4, bottom: 32, left: -10 }}
                    >
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
                                {fmt(Number(payload[0].value))}
                              </p>
                            </div>
                          )
                        }}
                      />
                      <Bar dataKey="value" name="Spent" radius={[4, 4, 0, 0]} maxBarSize={36}>
                        {expByCategory.map(e => (
                          <Cell key={e.name} fill={getCategoryColor(e.name)} opacity={0.85} />
                        ))}
                        <LabelList
                          dataKey="value"
                          position="top"
                          content={({ x, y, width, value }) => {
                            if (value == null || totalExpenses === 0) return null
                            const pct = ((Number(value) / totalExpenses) * 100).toFixed(1)
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
                    </ReBarChart>
                  </ResponsiveContainer>
                  {/* Top categories legend */}
                  <div className="space-y-2 mt-2 pt-4 border-t border-white/8">
                    {expByCategory.slice(0, 4).map(c => (
                      <div key={c.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                            style={{ background: getCategoryColor(c.name) }} />
                          <span className="text-white/70 font-medium truncate max-w-[140px]">{c.name}</span>
                        </div>
                        <span className="font-mono font-bold" style={{ color: '#fb7185' }}>{fmt(c.value)}</span>
                      </div>
                    ))}
                    {expByCategory.length > 4 && (
                      <p className="text-xs text-white/30 text-right">+{expByCategory.length - 4} more categories</p>
                    )}
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-white/8 mt-1">
                      <span className="text-white/45 font-semibold uppercase tracking-wider">Total</span>
                      <span className="font-mono font-bold text-sm" style={{ color: '#fb7185' }}>{fmt(totalExpenses)}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-32 flex flex-col items-center justify-center gap-3">
                  <p className="text-sm text-white/35">No expenses this month</p>
                  <button onClick={() => setShowAddExpense(true)}
                    className="text-xs font-semibold py-1.5 px-3 rounded-xl text-white"
                    style={{ background: 'linear-gradient(135deg, #fb7185, #e11d48)' }}>
                    + Add Expense
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* ── Category Breakdowns ── */}
      {(showExpenses || showIncome || showInvestments) && (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {(showIncome || showExpenses) && (
            <SavingsGaugeCard
              totalIncome={totalIncome}
              totalExpenses={totalExpenses}
              netSavings={netSavings}
              savingsRate={savingsRate}
              fmt={fmt}
              selectedMonthName={`${MONTH_FULL[parseInt(selectedMonthNum) - 1]} ${selectedYear}`}
              onAddIncome={() => setShowAddIncome(true)}
              onAddExpense={() => setShowAddExpense(true)}
            />
          )}
          {showExpenses && (
            <PaymentMethodCard
              data={expByPaymentMethod}
              totalExpenses={totalExpenses}
              fmt={fmt}
              selectedMonthName={`${MONTH_FULL[parseInt(selectedMonthNum) - 1]} ${selectedYear}`}
              onAdd={() => setShowAddExpense(true)}
            />
          )}
          {showInvestments && (
            <PieCard title="Portfolio Breakdown" sub="All time · current value" data={invByCategory}
              colorFn={n => INVESTMENT_CATEGORY_COLORS[n] ?? '#94a3b8'} empty="No investments yet"
              onAdd={undefined} addLabel="" amountColor="#fbbf24"
              addLink="/investments" addLinkLabel="+ Add Investment"
              accentColor="rgba(251,191,36,0.15)" borderColor="rgba(251,191,36,0.2)"
              fmt={fmt} />
          )}
        </div>
      )}

      {/* ── Investment Returns ── */}
      {showInvestments && investments.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white">Investment Returns</h2>
            <Link href="/investments" className="text-xs font-semibold hover:opacity-75 transition-opacity" style={{ color: '#fbbf24' }}>
              Manage →
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4 pb-4 border-b border-white/8">
            <div>
              <p className="text-xs font-semibold text-white/45 mb-1 uppercase tracking-wider">Invested</p>
              <p className="font-mono font-bold text-white text-lg">{fmt(totalInvested)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-white/45 mb-1 uppercase tracking-wider">Current</p>
              <p className="font-mono font-bold text-white text-lg">{fmt(totalCurrentVal)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-white/45 mb-1 uppercase tracking-wider">Return</p>
              <p className={`font-mono font-bold text-lg ${totalReturn >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {totalReturn >= 0 ? '+' : ''}{fmt(totalReturn)}
                <span className="text-xs ml-1 opacity-70">({returnPct >= 0 ? '+' : ''}{returnPct.toFixed(1)}%)</span>
              </p>
            </div>
          </div>
          <div className="space-y-3">
            {investments.slice(0, 6).map(inv => {
              const ret = Number(inv.current_value) - Number(inv.amount_invested)
              const pct = Number(inv.amount_invested) > 0 ? (ret / Number(inv.amount_invested)) * 100 : 0
              return (
                <div key={inv.id} className="flex items-center gap-3 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ background: INVESTMENT_CATEGORY_COLORS[inv.category] ?? '#94a3b8' }} />
                  <span className="text-white/70 flex-1 truncate font-medium">{inv.name}</span>
                  <span className="font-mono text-white/50">{fmt(Number(inv.current_value))}</span>
                  <span className={`font-mono font-bold w-14 text-right ${ret >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {ret >= 0 ? '+' : ''}{pct.toFixed(1)}%
                  </span>
                </div>
              )
            })}
          </div>
          {investments.length > 6 && (
            <Link href="/investments" className="text-xs font-semibold mt-3 inline-block hover:opacity-75" style={{ color: '#fbbf24' }}>
              +{investments.length - 6} more →
            </Link>
          )}
        </div>
      )}

      {/* ── Recent Transactions ── */}
      {(showIncome || showExpenses) && (
        <div className="grid md:grid-cols-2 gap-4">
          {showExpenses && (
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
                <h2 className="text-sm font-bold text-white">Recent Expenses</h2>
                <Link href="/expenses" className="text-xs font-semibold hover:opacity-75" style={{ color: '#fb7185' }}>View all →</Link>
              </div>
              {monthExpenses.length > 0 ? (
                <div className="divide-y divide-white/5">
                  {monthExpenses.slice(0, 5).map(e => (
                    <div key={e.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/[0.025] transition-colors">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                        style={{ background: `${getCategoryColor(e.category)}20` }}>
                        {getCategoryEmoji(e.category)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{e.category}</p>
                        <p className="text-xs text-white/40 font-medium">{format(parseISO(e.date), 'MMM d')}</p>
                      </div>
                      <p className="text-sm font-mono font-bold" style={{ color: '#fb7185' }}>
                        -{fmt(Number(e.amount))}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-5 py-10 text-center">
                  <p className="text-white/35 text-sm mb-3">No expenses this month</p>
                  <button onClick={() => setShowAddExpense(true)}
                    className="text-xs font-semibold py-2 px-4 rounded-xl text-white"
                    style={{ background: 'linear-gradient(135deg, #fb7185, #e11d48)' }}>
                    + Add Expense
                  </button>
                </div>
              )}
            </div>
          )}
          {showIncome && (
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
                <h2 className="text-sm font-bold text-white">Recent Income</h2>
                <Link href="/income" className="text-xs font-semibold hover:opacity-75" style={{ color: '#34d399' }}>View all →</Link>
              </div>
              {monthIncome.length > 0 ? (
                <div className="divide-y divide-white/5">
                  {monthIncome.slice(0, 5).map(i => (
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
                        +{fmt(Number(i.amount))}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-5 py-10 text-center">
                  <p className="text-white/35 text-sm mb-3">No income this month</p>
                  <button onClick={() => setShowAddIncome(true)}
                    className="text-xs font-semibold py-2 px-4 rounded-xl text-white"
                    style={{ background: 'linear-gradient(135deg, #34d399, #059669)' }}>
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
          onSaved={i => { setIncome(p => [i, ...p]); setShowAddIncome(false) }}
          knownSources={knownSources} />
      )}
    </div>
  )
}

// ── SavingsGaugeCard ─────────────────────────────────────────
const GAUGE_R          = 72
const GAUGE_CX         = 90
const GAUGE_CY         = 95
const GAUGE_CIRCUMFERENCE = Math.PI * GAUGE_R   // semicircle = π × r

function gaugeNeedle(rate: number) {
  const angle = Math.PI * (1 - rate / 100)
  return { x: GAUGE_CX + GAUGE_R * Math.cos(angle), y: GAUGE_CY - GAUGE_R * Math.sin(angle) }
}

function gaugeColor(rate: number): string {
  if (rate < 10)  return '#ef4444'
  if (rate < 20)  return '#f59e0b'
  if (rate < 35)  return '#34d399'
  return '#60d4b4'
}

function SavingsGaugeCard({
  totalIncome, totalExpenses, netSavings, savingsRate, fmt, selectedMonthName, onAddIncome, onAddExpense,
}: {
  totalIncome: number; totalExpenses: number; netSavings: number; savingsRate: number
  fmt: (n: number) => string; selectedMonthName: string
  onAddIncome: () => void; onAddExpense: () => void
}) {
  const dashoffset = GAUGE_CIRCUMFERENCE * (1 - savingsRate / 100)
  const needle     = gaugeNeedle(savingsRate)
  const color      = gaugeColor(savingsRate)
  const hasData    = totalIncome > 0 || totalExpenses > 0

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
      <p className="text-xs font-medium text-white/40 mb-3">{selectedMonthName} · income kept vs spent</p>

      {hasData ? (
        <>
          {/* ── Gauge arc ── */}
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
              {/* Track */}
              <path d="M 18 95 A 72 72 0 0 1 162 95" fill="none"
                stroke="rgba(255,255,255,0.07)" strokeWidth="12" strokeLinecap="round" />
              {/* Filled arc */}
              <path d="M 18 95 A 72 72 0 0 1 162 95" fill="none"
                stroke="url(#sgGrad)" strokeWidth="12" strokeLinecap="round"
                strokeDasharray={GAUGE_CIRCUMFERENCE}
                strokeDashoffset={dashoffset} />
              {/* Needle dot */}
              <circle cx={needle.x} cy={needle.y} r="6"
                fill={color} stroke="rgba(0,0,0,0.45)" strokeWidth="2" />
              {/* Scale labels */}
              <text x="11"  y="108" fontSize="8" fill="rgba(255,255,255,0.25)" fontWeight="700" textAnchor="middle">0%</text>
              <text x="90"  y="20"  fontSize="8" fill="rgba(255,255,255,0.25)" fontWeight="700" textAnchor="middle">50%</text>
              <text x="169" y="108" fontSize="8" fill="rgba(255,255,255,0.25)" fontWeight="700" textAnchor="middle">100%</text>
              {/* Center value */}
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

          {/* Status badge */}
          <div className="flex justify-center mt-1 mb-3">
            <span className="text-xs font-bold px-3 py-1 rounded-full"
              style={{ color: status.color, background: status.bg, border: `1px solid ${status.border}` }}>
              {status.text}
            </span>
          </div>

          {/* Color legend */}
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

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/8">
            <div className="text-center">
              <p className="text-xs font-semibold text-white/40 mb-0.5 uppercase tracking-wider">Income</p>
              <p className="text-xs font-mono font-bold" style={{ color: '#34d399' }}>+{fmt(totalIncome)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs font-semibold text-white/40 mb-0.5 uppercase tracking-wider">Spent</p>
              <p className="text-xs font-mono font-bold" style={{ color: '#fb7185' }}>-{fmt(totalExpenses)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs font-semibold text-white/40 mb-0.5 uppercase tracking-wider">Saved</p>
              <p className="text-xs font-mono font-bold"
                style={{ color: netSavings >= 0 ? '#38bdf8' : '#fbbf24' }}>
                {netSavings >= 0 ? '+' : '-'}{fmt(Math.abs(netSavings))}
              </p>
            </div>
          </div>
        </>
      ) : (
        <div className="h-40 flex flex-col items-center justify-center gap-3">
          <p className="text-white/35 text-sm">No data this month</p>
          <div className="flex gap-2">
            <button onClick={onAddIncome}
              className="text-xs font-semibold py-1.5 px-3 rounded-xl text-white"
              style={{ background: '#10b981' }}>+ Income</button>
            <button onClick={onAddExpense}
              className="text-xs font-semibold py-1.5 px-3 rounded-xl text-white"
              style={{ background: 'linear-gradient(135deg, #fb7185, #e11d48)' }}>+ Expense</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── PaymentMethodCard ─────────────────────────────────────────
const PM_ICONS: Record<string, string> = {
  'Cash':           '💵',
  'Credit Card':    '💳',
  'Debit Card':     '🏧',
  'Bank Transfer':  '🏦',
  'Digital Wallet': '📱',
  'Other':          '💰',
}

const PM_COLORS: Record<string, { bar: string; bg: string }> = {
  'Credit Card':    { bar: 'linear-gradient(90deg,#6366f1,#818cf8)', bg: 'rgba(99,102,241,0.18)'  },
  'Debit Card':     { bar: 'linear-gradient(90deg,#3b82f6,#60a5fa)', bg: 'rgba(59,130,246,0.18)'  },
  'Bank Transfer':  { bar: 'linear-gradient(90deg,#fb7185,#f43f5e)', bg: 'rgba(251,113,133,0.18)' },
  'Cash':           { bar: 'linear-gradient(90deg,#f59e0b,#fbbf24)', bg: 'rgba(245,158,11,0.18)'  },
  'Digital Wallet': { bar: 'linear-gradient(90deg,#34d399,#10b981)', bg: 'rgba(52,211,153,0.18)'  },
  'Other':          { bar: 'linear-gradient(90deg,#94a3b8,#cbd5e1)', bg: 'rgba(148,163,184,0.18)' },
}

function PaymentMethodCard({
  data, totalExpenses, fmt, selectedMonthName, onAdd,
}: {
  data: { name: string; value: number }[]
  totalExpenses: number; fmt: (n: number) => string
  selectedMonthName: string; onAdd: () => void
}) {
  return (
    <div className="card p-5" style={{
      borderColor: 'rgba(251,113,133,0.2)',
      background: 'linear-gradient(135deg, rgba(251,113,133,0.04) 0%, transparent 60%)',
    }}>
      <h2 className="text-sm font-bold text-white mb-0.5">Spending by Method</h2>
      <p className="text-xs font-medium text-white/40 mb-4">{selectedMonthName} · how you paid</p>

      {data.length > 0 ? (
        <div className="space-y-3">
          {data.map(item => {
            const pct    = totalExpenses > 0 ? (item.value / totalExpenses) * 100 : 0
            const colors = PM_COLORS[item.name] ?? PM_COLORS['Other']
            const icon   = PM_ICONS[item.name]  ?? '💰'
            return (
              <div key={item.name}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                      style={{ background: colors.bg }}>
                      {icon}
                    </div>
                    <span className="text-xs font-bold text-white/80">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-semibold text-white/30">{pct.toFixed(1)}%</span>
                    <span className="text-xs font-mono font-bold" style={{ color: '#fb7185' }}>
                      {fmt(item.value)}
                    </span>
                  </div>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: colors.bar }} />
                </div>
              </div>
            )
          })}
          <div className="flex items-center justify-between pt-3 border-t border-white/8">
            <span className="text-xs font-bold text-white/40 uppercase tracking-wider">Total</span>
            <span className="text-sm font-mono font-bold" style={{ color: '#fb7185' }}>{fmt(totalExpenses)}</span>
          </div>
        </div>
      ) : (
        <div className="h-40 flex flex-col items-center justify-center gap-3">
          <p className="text-sm text-white/35">No expenses this month</p>
          <button onClick={onAdd}
            className="text-xs font-semibold py-1.5 px-3 rounded-xl text-white"
            style={{ background: 'linear-gradient(135deg, #fb7185, #e11d48)' }}>
            + Add Expense
          </button>
        </div>
      )}
    </div>
  )
}

// ── PieCard ──────────────────────────────────────────────────
function PieCard({
  title, sub, data, colorFn, empty, onAdd, addLabel, amountColor,
  addLink, addLinkLabel, accentColor, borderColor, fmt,
}: {
  title: string; sub: string; data: { name: string; value: number }[]
  colorFn: (name: string) => string; empty: string
  onAdd?: () => void; addLabel: string; amountColor: string
  addLink?: string; addLinkLabel?: string
  accentColor?: string; borderColor?: string
  fmt: (amount: number) => string
}) {
  return (
    <div className="card p-5" style={{
      borderColor: borderColor ?? 'var(--border)',
      background: accentColor ? `linear-gradient(135deg, ${accentColor} 0%, transparent 60%)` : undefined,
    }}>
      <h2 className="text-sm font-bold text-white mb-0.5">{title}</h2>
      <p className="text-xs font-medium text-white/40 mb-4">{sub}</p>
      {data.length > 0 ? (
        <>
          <ResponsiveContainer width="100%" height={130}>
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={32} outerRadius={55} paddingAngle={2} dataKey="value">
                {data.map(e => <Cell key={e.name} fill={colorFn(e.name)} opacity={0.9} />)}
              </Pie>
              <Tooltip content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                return (
                  <div className="custom-tooltip">
                    <p className="text-xs font-semibold text-white">{payload[0].name}</p>
                    <p className="font-mono text-sm font-bold" style={{ color: colorFn(String(payload[0].name)) }}>
                      {fmt(Number(payload[0].value))}
                    </p>
                  </div>
                )
              }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-1">
            {data.slice(0, 4).map(c => (
              <div key={c.name} className="flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: colorFn(c.name) }} />
                <span className="text-white/60 flex-1 truncate font-medium">{c.name}</span>
                <span className="font-mono font-bold" style={{ color: amountColor }}>{fmt(c.value)}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="h-32 flex flex-col items-center justify-center gap-2.5">
          <p className="text-white/35 text-sm">{empty}</p>
          {onAdd && (
            <button onClick={onAdd}
              className="text-xs font-semibold py-1.5 px-3 rounded-xl text-white"
              style={{ background: amountColor }}>
              {addLabel}
            </button>
          )}
          {addLink && addLinkLabel && (
            <Link href={addLink} className="btn-secondary py-1 text-xs font-semibold">{addLinkLabel}</Link>
          )}
        </div>
      )}
    </div>
  )
}
