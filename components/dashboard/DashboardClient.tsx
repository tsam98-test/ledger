'use client'

import { useState, useMemo, useEffect } from 'react'
import {
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Plus,
  ChevronLeft, ChevronRight, BarChart2,
} from 'lucide-react'
import type { Expense, Income, Investment } from '@/types'
import { formatCurrency } from '@/lib/utils'
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

interface Props {
  expenses: Expense[]
  income: Income[]
  investments: Investment[]
  currentMonth: string
  userId: string
}
function getMonthKey(d: string) { return d.slice(0, 7) }

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function DashboardClient({
  expenses: initExp, income: initInc, investments, currentMonth, userId,
}: Props) {
  const [expenses, setExpenses] = useState(initExp)
  const [income, setIncome]     = useState(initInc)
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

  const monthExpenses = useMemo(() => expenses.filter(e => getMonthKey(e.date) === selectedMonth), [expenses, selectedMonth])
  const monthIncome   = useMemo(() => income.filter(i => getMonthKey(i.date) === selectedMonth), [income, selectedMonth])

  const totalExpenses   = useMemo(() => monthExpenses.reduce((s, e) => s + Number(e.amount), 0), [monthExpenses])
  const totalIncome     = useMemo(() => monthIncome.reduce((s, i) => s + Number(i.amount), 0), [monthIncome])
  const netSavings      = totalIncome - totalExpenses
  const totalInvested   = useMemo(() => investments.reduce((s, i) => s + Number(i.amount_invested), 0), [investments])
  const totalCurrentVal = useMemo(() => investments.reduce((s, i) => s + Number(i.current_value), 0), [investments])
  const totalReturn     = totalCurrentVal - totalInvested
  const returnPct       = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0

  // Deduplicated known income sources for quick-select chips in AddIncomeModal
  const knownSources = useMemo<KnownSource[]>(() => {
    const map = new Map<string, string>()
    ;[...income].forEach(i => {
      if (!map.has(i.source)) map.set(i.source, i.category)
    })
    return Array.from(map.entries()).map(([source, category]) => ({ source, category }))
  }, [income])

  return (
    <div className="space-y-5 animate-fade-in">

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

      {/* ── Filters — month navigator only; the view-mode tabs (Income / Expenses /
          Investments / Budget) are gone now that each of those lives on its own page ── */}
      <div className="card p-3.5">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
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
        </div>
      </div>

      {/* ── KPI Cards — always shown now (no view-mode filter left to hide them) ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

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
      </div>

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
