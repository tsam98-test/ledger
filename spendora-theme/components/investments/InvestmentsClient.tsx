'use client'

import { useState, useMemo, useCallback } from 'react'
import { format, parseISO } from 'date-fns'
import {
  Plus, Search, Filter, Download, Pencil, Trash2,
  ChevronUp, ChevronDown, X, TrendingUp, TrendingDown, BarChart2,
} from 'lucide-react'
import type { Investment } from '@/types'
import { INVESTMENT_CATEGORIES, INVESTMENT_CATEGORY_COLORS } from '@/types'
import { formatCurrency, exportToCSV, cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import AddInvestmentModal from './AddInvestmentModal'
import EditInvestmentModal from './EditInvestmentModal'
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'

type SF = 'date' | 'name' | 'amount_invested' | 'current_value' | 'return'
type SO = 'asc' | 'desc'

interface Filters { search: string; category: string }
const EMPTY: Filters = { search: '', category: '' }

export default function InvestmentsClient({
  initialInvestments,
  userId,
}: {
  initialInvestments: Investment[]
  userId: string
}) {
  const [investments, setInvestments] = useState<Investment[]>(initialInvestments)
  const [filters, setFilters]         = useState<Filters>(EMPTY)
  const [showFilters, setShowFilters] = useState(false)
  const [sortField, setSortField]     = useState<SF>('date')
  const [sortOrder, setSortOrder]     = useState<SO>('desc')
  const [showAdd, setShowAdd]         = useState(false)
  const [editing, setEditing]         = useState<Investment | null>(null)
  const [deletingId, setDeletingId]   = useState<string | null>(null)
  const supabase = createClient()

  const filtered = useMemo(() => {
    let list = [...investments]
    if (filters.search) { const q = filters.search.toLowerCase(); list = list.filter((i) => i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q) || (i.notes?.toLowerCase().includes(q) ?? false)) }
    if (filters.category) list = list.filter((i) => i.category === filters.category)
    list.sort((a, b) => {
      const retA = Number(a.current_value) - Number(a.amount_invested)
      const retB = Number(b.current_value) - Number(b.amount_invested)
      let cmp = 0
      if (sortField === 'date')            cmp = a.date.localeCompare(b.date)
      if (sortField === 'name')            cmp = a.name.localeCompare(b.name)
      if (sortField === 'amount_invested') cmp = Number(a.amount_invested) - Number(b.amount_invested)
      if (sortField === 'current_value')   cmp = Number(a.current_value) - Number(b.current_value)
      if (sortField === 'return')          cmp = retA - retB
      return sortOrder === 'asc' ? cmp : -cmp
    })
    return list
  }, [investments, filters, sortField, sortOrder])

  const totalInvested   = useMemo(() => filtered.reduce((s, i) => s + Number(i.amount_invested), 0), [filtered])
  const totalCurrent    = useMemo(() => filtered.reduce((s, i) => s + Number(i.current_value), 0), [filtered])
  const totalReturn     = totalCurrent - totalInvested
  const totalReturnPct  = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0

  const byCategory = useMemo(() => {
    const map: Record<string, { invested: number; current: number }> = {}
    filtered.forEach((i) => {
      if (!map[i.category]) map[i.category] = { invested: 0, current: 0 }
      map[i.category].invested += Number(i.amount_invested)
      map[i.category].current  += Number(i.current_value)
    })
    return Object.entries(map)
      .sort((a, b) => b[1].current - a[1].current)
      .map(([name, v]) => ({ name, invested: v.invested, current: v.current, ret: v.current - v.invested }))
  }, [filtered])

  const pieData = byCategory.map(({ name, current }) => ({ name, value: current }))

  const hasFilters = Object.values(filters).some(Boolean)

  function toggleSort(field: SF) { if (sortField === field) setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc')); else { setSortField(field); setSortOrder('desc') } }
  function SortIcon({ field }: { field: SF }) {
    if (sortField !== field) return <ChevronDown size={12} className="opacity-30" />
    return sortOrder === 'asc' ? <ChevronUp size={12} className="text-amber-400" /> : <ChevronDown size={12} className="text-amber-400" />
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this investment?')) return
    setDeletingId(id)
    const { error } = await supabase.from('investments').delete().eq('id', id).eq('user_id', userId)
    if (!error) setInvestments((prev) => prev.filter((i) => i.id !== id))
    setDeletingId(null)
  }

  const handleAdded   = useCallback((item: Investment) => { setInvestments((p) => [item, ...p]); setShowAdd(false) }, [])
  const handleUpdated = useCallback((item: Investment) => { setInvestments((p) => p.map((i) => (i.id === item.id ? item : i))); setEditing(null) }, [])

  function handleExport() {
    exportToCSV(
      filtered.map((i) => {
        const ret = Number(i.current_value) - Number(i.amount_invested)
        const pct = Number(i.amount_invested) > 0 ? (ret / Number(i.amount_invested)) * 100 : 0
        return {
          Date: i.date, Name: i.name, Category: i.category,
          'Amount Invested': i.amount_invested, 'Current Value': i.current_value,
          'Return ($)': ret.toFixed(2), 'Return (%)': pct.toFixed(2) + '%',
          Notes: i.notes ?? '',
        }
      }),
      `investments-${format(new Date(), 'yyyy-MM-dd')}.csv`
    )
  }

  const PieTip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div className="custom-tooltip">
        <p className="text-xs font-medium text-[var(--text-primary)]">{payload[0].name}</p>
        <p className="font-mono text-sm text-amber-400">{formatCurrency(payload[0].value)}</p>
      </div>
    )
  }

  const BarTip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div className="custom-tooltip space-y-1">
        <p className="text-xs font-medium text-[var(--text-muted)] mb-1">{label}</p>
        {payload.map((p: any) => (
          <div key={p.name} className="flex justify-between gap-4 text-xs">
            <span style={{ color: p.fill }}>{p.name}</span>
            <span className="font-mono">{formatCurrency(p.value)}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-5 pb-24 lg:pb-8 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl text-[var(--text-primary)]">Investments</h1>
          <p className="text-[var(--text-muted)] text-sm mt-0.5">{filtered.length} holding{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="btn-secondary hidden sm:flex"><Download size={15} /> Export</button>
          <button onClick={() => setShowAdd(true)} className="btn-primary"><Plus size={15} /> Add Investment</button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="stat-card">
          <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Total Invested</span>
          <p className="text-xl font-mono font-semibold text-[var(--text-primary)]">{formatCurrency(totalInvested)}</p>
        </div>
        <div className="stat-card">
          <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Current Value</span>
          <p className="text-xl font-mono font-semibold text-amber-400">{formatCurrency(totalCurrent)}</p>
        </div>
        <div className="stat-card">
          <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Total Return</span>
          <p className={`text-xl font-mono font-semibold ${totalReturn >= 0 ? 'text-jade-400' : 'text-rose-400'}`}>
            {totalReturn >= 0 ? '+' : ''}{formatCurrency(totalReturn)}
          </p>
        </div>
        <div className="stat-card">
          <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Return %</span>
          <p className={`text-xl font-mono font-semibold ${totalReturnPct >= 0 ? 'text-jade-400' : 'text-rose-400'}`}>
            {totalReturnPct >= 0 ? '+' : ''}{totalReturnPct.toFixed(2)}%
          </p>
          <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
            {totalReturnPct >= 0 ? <TrendingUp size={11} className="text-jade-400" /> : <TrendingDown size={11} className="text-rose-400" />}
            overall
          </div>
        </div>
      </div>

      {/* Charts */}
      {filtered.length > 0 && (
        <div className="grid lg:grid-cols-2 gap-4">
          {/* Pie — portfolio composition */}
          <div className="card p-5">
            <h2 className="text-sm font-medium text-[var(--text-primary)] mb-1">Portfolio Composition</h2>
            <p className="text-xs text-[var(--text-muted)] mb-3">By current value</p>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={68} paddingAngle={2} dataKey="value">
                  {pieData.map((e) => <Cell key={e.name} fill={INVESTMENT_CATEGORY_COLORS[e.name] ?? '#94a3b8'} opacity={0.9} />)}
                </Pie>
                <Tooltip content={<PieTip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 mt-1">
              {byCategory.slice(0, 4).map((c) => (
                <div key={c.name} className="flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: INVESTMENT_CATEGORY_COLORS[c.name] ?? '#94a3b8' }} />
                  <span className="text-[var(--text-secondary)] flex-1 truncate">{c.name}</span>
                  <span className={`font-mono font-medium ${c.ret >= 0 ? 'text-jade-400' : 'text-rose-400'}`}>
                    {c.ret >= 0 ? '+' : ''}{c.invested > 0 ? ((c.ret / c.invested) * 100).toFixed(1) : '0.0'}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Bar — invested vs current by category */}
          <div className="card p-5">
            <h2 className="text-sm font-medium text-[var(--text-primary)] mb-1">Invested vs Current</h2>
            <p className="text-xs text-[var(--text-muted)] mb-3">By category</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={byCategory} margin={{ top: 4, right: 4, bottom: 20, left: -20 }} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 9 }} axisLine={false} tickLine={false} angle={-30} textAnchor="end" />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                <Tooltip content={<BarTip />} />
                <Bar dataKey="invested" name="Invested" fill="rgba(0,212,170,0.3)" radius={[3, 3, 0, 0]} />
                <Bar dataKey="current"  name="Current"  fill="#f59e0b"               radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Search + filters */}
      <div className="card p-4 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input type="text" placeholder="Search investments…" value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              className="input pl-9" />
          </div>
          <button onClick={() => setShowFilters((s) => !s)}
            className={cn('btn-secondary', showFilters && 'border-amber-400/30 text-amber-400')}>
            <Filter size={14} /><span className="hidden sm:inline">Filters</span>
            {hasFilters && <span className="w-2 h-2 rounded-full bg-amber-400 -mr-1" />}
          </button>
          {hasFilters && <button onClick={() => setFilters(EMPTY)} className="btn-ghost text-xs"><X size={13} /> Clear</button>}
        </div>
        {showFilters && (
          <div className="pt-2 border-t animate-slide-up" style={{ borderColor: 'var(--border)' }}>
            <label className="label">Category</label>
            <select value={filters.category}
              onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
              className="input max-w-xs">
              <option value="">All categories</option>
              {INVESTMENT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                {([
                  { field: 'date'            as SF, label: 'Date'      },
                  { field: 'name'            as SF, label: 'Name'      },
                  { field: 'amount_invested' as SF, label: 'Invested'  },
                  { field: 'current_value'   as SF, label: 'Value'     },
                  { field: 'return'          as SF, label: 'Return'    },
                ] as const).map(({ field, label }) => (
                  <th key={field} onClick={() => toggleSort(field)}
                    className="table-cell text-left cursor-pointer select-none group">
                    <div className="flex items-center gap-1 text-xs font-medium tracking-wider uppercase text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]">
                      {label}<SortIcon field={field} />
                    </div>
                  </th>
                ))}
                <th className="table-cell hidden md:table-cell">
                  <span className="text-xs font-medium tracking-wider uppercase text-[var(--text-muted)]">Category</span>
                </th>
                <th className="table-cell w-20" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <BarChart2 className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    <p className="text-[var(--text-muted)] text-sm">
                      {hasFilters ? 'No investments match your filters.' : 'No investments yet. Start tracking your portfolio!'}
                    </p>
                    {!hasFilters && (
                      <button onClick={() => setShowAdd(true)} className="btn-primary mt-3 text-xs">
                        + Add Investment
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filtered.map((inv) => {
                  const ret    = inv.current_value != null ? Number(inv.current_value) - Number(inv.amount_invested) : 0
                  const pct    = inv.current_value != null && Number(inv.amount_invested) > 0 ? (ret / Number(inv.amount_invested)) * 100 : 0
                  const isPos  = ret >= 0
                  return (
                    <tr key={inv.id} className="table-row">
                      <td className="table-cell text-sm text-[var(--text-muted)] font-mono">
                        {format(parseISO(inv.date), 'MMM d, yy')}
                      </td>
                      <td className="table-cell">
                        <div>
                          <p className="text-sm font-medium text-[var(--text-primary)]">{inv.name}</p>
                          {inv.notes && <p className="text-xs text-[var(--text-muted)] truncate max-w-[160px]">{inv.notes}</p>}
                        </div>
                      </td>
                      <td className="table-cell text-sm font-mono text-[var(--text-muted)]">
                        {formatCurrency(inv.amount_invested)}
                      </td>
                      <td className="table-cell text-sm font-mono font-medium text-amber-400">
                        {inv.current_value != null ? formatCurrency(inv.current_value) : <span className="text-[var(--text-muted)] text-xs">Not set</span>}
                      </td>
                      <td className="table-cell">
                        {inv.current_value != null ? (
                          <>
                            <div className={`flex items-center gap-1 text-sm font-mono font-semibold ${isPos ? 'text-jade-400' : 'text-rose-400'}`}>
                              {isPos ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                              <span>{isPos ? '+' : ''}{pct.toFixed(2)}%</span>
                            </div>
                            <p className={`text-xs font-mono ${isPos ? 'text-jade-400' : 'text-rose-400'} opacity-70`}>
                              {isPos ? '+' : ''}{formatCurrency(ret)}
                            </p>
                          </>
                        ) : (
                          <span className="text-[var(--text-muted)] text-xs">—</span>
                        )}
                      </td>
                      <td className="table-cell hidden md:table-cell">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ background: INVESTMENT_CATEGORY_COLORS[inv.category] ?? '#94a3b8' }} />
                          <span className="text-xs text-[var(--text-secondary)]">{inv.category}</span>
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-1 justify-end">
                          <button onClick={() => setEditing(inv)} className="btn-ghost p-1.5 hover:text-amber-400"><Pencil size={13} /></button>
                          <button onClick={() => handleDelete(inv.id)} disabled={deletingId === inv.id} className="btn-ghost p-1.5 hover:text-rose-400"><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {filtered.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t text-sm" style={{ borderColor: 'var(--border)' }}>
            <span className="text-[var(--text-muted)]">{filtered.length} holding{filtered.length !== 1 ? 's' : ''}</span>
            <span className={`font-mono font-semibold ${totalReturnPct >= 0 ? 'text-jade-400' : 'text-rose-400'}`}>
              {totalReturnPct >= 0 ? '+' : ''}{totalReturnPct.toFixed(2)}% overall
            </span>
          </div>
        )}
      </div>

      <div className="sm:hidden">
        <button onClick={handleExport} className="btn-secondary w-full"><Download size={14} /> Export CSV</button>
      </div>

      {showAdd  && <AddInvestmentModal   userId={userId} onClose={() => setShowAdd(false)}  onSaved={handleAdded}   />}
      {editing  && <EditInvestmentModal  investment={editing} userId={userId} onClose={() => setEditing(null)} onSaved={handleUpdated} />}
    </div>
  )
}
