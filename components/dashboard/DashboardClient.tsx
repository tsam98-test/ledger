'use client'

import { useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import {
  TrendingUp, TrendingDown, DollarSign, Receipt,
  ArrowUpRight, Calendar, Target
} from 'lucide-react'
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Area, AreaChart
} from 'recharts'
import type { Expense, Budget } from '@/types'
import {
  formatCurrency, formatMonth, getLastNMonths,
  getCategoryColor, getBudgetBarColor, getBudgetStatusColor, calcPercent
} from '@/lib/utils'
import Link from 'next/link'
import AddExpenseModal from '@/components/expenses/AddExpenseModal'
import { useState } from 'react'

interface Props {
  currentExpenses: Expense[]
  trendExpenses: { amount: number; date: string }[]
  budget: Budget | null
  currentMonth: string
  userId: string
}

export default function DashboardClient({
  currentExpenses,
  trendExpenses,
  budget,
  currentMonth,
  userId,
}: Props) {
  const [showAddModal, setShowAddModal] = useState(false)
  const [expenses, setExpenses] = useState(currentExpenses)

  // Total this month
  const totalThisMonth = useMemo(
    () => expenses.reduce((sum, e) => sum + Number(e.amount), 0),
    [expenses]
  )

  // Category breakdown
  const byCategory = useMemo(() => {
    const map: Record<string, number> = {}
    expenses.forEach((e) => {
      map[e.category] = (map[e.category] ?? 0) + Number(e.amount)
    })
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }))
  }, [expenses])

  // Monthly trend data (last 6 months)
  const trendData = useMemo(() => {
    const months = getLastNMonths(6)
    const map: Record<string, number> = {}
    trendExpenses.forEach((e) => {
      const month = e.date.slice(0, 7)
      map[month] = (map[month] ?? 0) + Number(e.amount)
    })
    // Also include current month live expenses
    expenses.forEach((e) => {
      const month = e.date.slice(0, 7)
      map[month] = (map[month] ?? 0) + Number(e.amount)
    })
    return months.map((m) => ({
      month: formatMonth(m),
      total: map[m] ?? 0,
    }))
  }, [trendExpenses, expenses])

  // Budget info
  const budgetAmount = budget?.amount ?? 0
  const budgetPct = budgetAmount > 0 ? Math.min(calcPercent(totalThisMonth, budgetAmount), 100) : 0
  const budgetRemaining = budgetAmount - totalThisMonth

  // Recent expenses (top 5)
  const recentExpenses = expenses.slice(0, 5)

  // Top category
  const topCategory = byCategory[0]

  function handleExpenseAdded(expense: Expense) {
    setExpenses((prev) => [expense, ...prev])
    setShowAddModal(false)
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
      return (
        <div className="custom-tooltip">
          <p className="text-[var(--text-muted)] text-xs mb-1">{label}</p>
          <p className="text-amber-400 font-mono font-medium">
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      )
    }
    return null
  }

  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload?.length) {
      return (
        <div className="custom-tooltip">
          <p className="text-[var(--text-primary)] text-xs font-medium mb-0.5">{payload[0].name}</p>
          <p className="text-amber-400 font-mono text-sm">{formatCurrency(payload[0].value)}</p>
          <p className="text-[var(--text-muted)] text-xs">
            {calcPercent(payload[0].value, totalThisMonth)}% of total
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6 pb-24 lg:pb-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl text-[var(--text-primary)]">
            {format(new Date(), 'MMMM yyyy')}
          </h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">
            Your financial overview
          </p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary flex-shrink-0">
          + Add Expense
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="This Month"
          value={formatCurrency(totalThisMonth)}
          icon={<DollarSign size={16} className="text-amber-400" />}
          accent="amber"
        />
        <StatCard
          title="Transactions"
          value={String(expenses.length)}
          icon={<Receipt size={16} className="text-sky-400" />}
          accent="sky"
        />
        <StatCard
          title="Daily Average"
          value={formatCurrency(totalThisMonth / new Date().getDate())}
          icon={<Calendar size={16} className="text-jade-400" />}
          accent="jade"
        />
        <StatCard
          title="Top Category"
          value={topCategory?.name ?? '—'}
          sub={topCategory ? formatCurrency(topCategory.value) : ''}
          icon={<ArrowUpRight size={16} className="text-rose-400" />}
          accent="rose"
          small
        />
      </div>

      {/* Budget Progress */}
      {budgetAmount > 0 && (
        <div className="card p-5 animate-slide-up" style={{ animationDelay: '0.05s' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target size={15} className="text-[var(--text-muted)]" />
              <span className="text-sm font-medium text-[var(--text-primary)]">
                Monthly Budget
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-sm font-mono font-medium ${getBudgetStatusColor(totalThisMonth, budgetAmount)}`}>
                {budgetRemaining >= 0 ? formatCurrency(budgetRemaining) + ' left' : formatCurrency(Math.abs(budgetRemaining)) + ' over'}
              </span>
              <span className="text-[var(--text-muted)] text-xs">
                / {formatCurrency(budgetAmount)}
              </span>
            </div>
          </div>
          <div className="h-2 rounded-full bg-white/5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${getBudgetBarColor(totalThisMonth, budgetAmount)}`}
              style={{ width: `${budgetPct}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[var(--text-muted)] text-xs">{budgetPct}% used</span>
            {budgetPct >= 80 && (
              <span className="text-xs text-amber-400">
                {budgetPct >= 100 ? '⚠️ Over budget' : '⚡ Nearing limit'}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid lg:grid-cols-5 gap-4">
        {/* Trend Chart */}
        <div className="lg:col-span-3 card p-5 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-sm font-medium text-[var(--text-primary)] mb-1">
            6-Month Trend
          </h2>
          <p className="text-xs text-[var(--text-muted)] mb-4">Monthly spending overview</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trendData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="amberGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
                </linearGradient>
              </defs>
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
                tickFormatter={(v) => `$${v >= 1000 ? `${(v/1000).toFixed(1)}k` : v}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="total"
                stroke="#fbbf24"
                strokeWidth={2}
                fill="url(#amberGrad)"
                dot={{ fill: '#fbbf24', strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5, fill: '#fbbf24' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Category Pie */}
        <div className="lg:col-span-2 card p-5 animate-slide-up" style={{ animationDelay: '0.15s' }}>
          <h2 className="text-sm font-medium text-[var(--text-primary)] mb-1">By Category</h2>
          <p className="text-xs text-[var(--text-muted)] mb-3">This month</p>
          {byCategory.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie
                    data={byCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={65}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {byCategory.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={getCategoryColor(entry.name)}
                        opacity={0.9}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {byCategory.slice(0, 4).map((cat) => (
                  <div key={cat.name} className="flex items-center gap-2 text-xs">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: getCategoryColor(cat.name) }}
                    />
                    <span className="text-[var(--text-secondary)] truncate flex-1">{cat.name}</span>
                    <span className="text-[var(--text-primary)] font-mono">
                      {formatCurrency(cat.value)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[150px] flex items-center justify-center text-[var(--text-muted)] text-sm">
              No expenses yet
            </div>
          )}
        </div>
      </div>

      {/* Recent Expenses */}
      <div className="card animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-sm font-medium text-[var(--text-primary)]">Recent Expenses</h2>
          <Link href="/expenses" className="text-xs text-amber-400 hover:text-amber-300 transition-colors">
            View all →
          </Link>
        </div>
        {recentExpenses.length > 0 ? (
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {recentExpenses.map((expense) => (
              <div key={expense.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm"
                  style={{ background: `${getCategoryColor(expense.category)}20` }}
                >
                  {getCategoryEmoji(expense.category)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[var(--text-primary)] truncate">
                    {expense.category}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {format(parseISO(expense.date), 'MMM d')} · {expense.payment_method}
                  </p>
                </div>
                <p className="text-sm font-mono font-medium text-[var(--text-primary)]">
                  {formatCurrency(expense.amount)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-5 py-12 text-center">
            <p className="text-[var(--text-muted)] text-sm">No expenses this month.</p>
            <button onClick={() => setShowAddModal(true)} className="btn-primary mt-3 text-xs">
              Add your first expense
            </button>
          </div>
        )}
      </div>

      {showAddModal && (
        <AddExpenseModal
          userId={userId}
          onClose={() => setShowAddModal(false)}
          onSaved={handleExpenseAdded}
        />
      )}
    </div>
  )
}

function StatCard({
  title, value, sub, icon, accent, small,
}: {
  title: string
  value: string
  sub?: string
  icon: React.ReactNode
  accent: string
  small?: boolean
}) {
  return (
    <div className="stat-card animate-slide-up">
      <div className="flex items-center justify-between">
        <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">{title}</span>
        <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center">{icon}</div>
      </div>
      <p className={`font-mono font-semibold text-[var(--text-primary)] ${small ? 'text-base truncate' : 'text-xl'}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-[var(--text-muted)]">{sub}</p>}
    </div>
  )
}

function getCategoryEmoji(category: string): string {
  const map: Record<string, string> = {
    'Food & Dining': '🍽️',
    Transportation: '🚗',
    Shopping: '🛍️',
    Entertainment: '🎬',
    Healthcare: '🏥',
    Utilities: '💡',
    Housing: '🏠',
    Education: '📚',
    'Personal Care': '💆',
    Travel: '✈️',
    Subscriptions: '🔄',
    Other: '📌',
  }
  return map[category] ?? '💰'
}
