'use client'

import { useState, useMemo, useCallback } from 'react'
import { format, parseISO } from 'date-fns'
import {
  Search, Filter, Download, Upload, Plus, Pencil, Trash2,
  ChevronUp, ChevronDown, X
} from 'lucide-react'
import type { Expense, ExpenseFilters, SortField, SortOrder } from '@/types'
import { PAYMENT_METHODS, DEFAULT_CATEGORIES } from '@/types'
import { formatCurrency, formatDate, exportToCSV, getCategoryColor, cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import AddExpenseModal from './AddExpenseModal'
import EditExpenseModal from './EditExpenseModal'
import ImportCSVModal from './ImportCSVModal'

const EMPTY_FILTERS: ExpenseFilters = {
  dateFrom: '',
  dateTo: '',
  category: '',
  paymentMethod: '',
  search: '',
}

const CATEGORIES = DEFAULT_CATEGORIES.map((c) => c.name)

export default function ExpensesClient({
  initialExpenses,
  userId,
}: {
  initialExpenses: Expense[]
  userId: string
}) {
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses)
  const [filters, setFilters] = useState<ExpenseFilters>(EMPTY_FILTERS)
  const [showFilters, setShowFilters] = useState(false)
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [showImport, setShowImport] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const supabase = createClient()

  const filtered = useMemo(() => {
    let list = [...expenses]

    if (filters.search) {
      const q = filters.search.toLowerCase()
      list = list.filter(
        (e) =>
          e.category.toLowerCase().includes(q) ||
          e.payment_method.toLowerCase().includes(q) ||
          (e.notes?.toLowerCase().includes(q) ?? false)
      )
    }
    if (filters.dateFrom) list = list.filter((e) => e.date >= filters.dateFrom)
    if (filters.dateTo) list = list.filter((e) => e.date <= filters.dateTo)
    if (filters.category) list = list.filter((e) => e.category === filters.category)
    if (filters.paymentMethod) list = list.filter((e) => e.payment_method === filters.paymentMethod)

    list.sort((a, b) => {
      let cmp = 0
      if (sortField === 'date') cmp = a.date.localeCompare(b.date)
      else if (sortField === 'amount') cmp = a.amount - b.amount
      else if (sortField === 'category') cmp = a.category.localeCompare(b.category)
      return sortOrder === 'asc' ? cmp : -cmp
    })

    return list
  }, [expenses, filters, sortField, sortOrder])

  const total = useMemo(
    () => filtered.reduce((sum, e) => sum + Number(e.amount), 0),
    [filtered]
  )

  const hasActiveFilters = Object.values(filters).some(Boolean)

  function toggleSort(field: SortField) {
    if (sortField === field) setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))
    else { setSortField(field); setSortOrder('desc') }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ChevronDown size={13} className="text-[var(--text-muted)] opacity-40" />
    return sortOrder === 'asc'
      ? <ChevronUp size={13} className="text-amber-400" />
      : <ChevronDown size={13} className="text-amber-400" />
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this expense? This cannot be undone.')) return
    setDeletingId(id)
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)
      .eq('user_id', userId) // Extra safety check

    if (!error) {
      setExpenses((prev) => prev.filter((e) => e.id !== id))
    }
    setDeletingId(null)
  }

  function handleExport() {
    const rows = filtered.map((e) => ({
      Date: e.date,
      Amount: e.amount,
      Category: e.category,
      'Payment Method': e.payment_method,
      Notes: e.notes ?? '',
    }))
    exportToCSV(rows, `expenses-${format(new Date(), 'yyyy-MM-dd')}.csv`)
  }

  const handleExpenseAdded = useCallback((expense: Expense) => {
    setExpenses((prev) => [expense, ...prev])
    setShowAddModal(false)
  }, [])

  const handleExpenseUpdated = useCallback((updated: Expense) => {
    setExpenses((prev) => prev.map((e) => (e.id === updated.id ? updated : e)))
    setEditingExpense(null)
  }, [])

  const handleImported = useCallback((imported: Expense[]) => {
    setExpenses((prev) => [...imported, ...prev])
    setShowImport(false)
  }, [])

  return (
    <div className="space-y-5 pb-24 lg:pb-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl text-[var(--text-primary)]">Expenses</h1>
          <p className="text-[var(--text-muted)] text-sm mt-0.5">
            {filtered.length} record{filtered.length !== 1 ? 's' : ''} · {formatCurrency(total)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowImport(true)} className="btn-secondary hidden sm:flex">
            <Upload size={15} /> Import
          </button>
          <button onClick={handleExport} className="btn-secondary hidden sm:flex">
            <Download size={15} /> Export
          </button>
          <button onClick={() => setShowAddModal(true)} className="btn-primary">
            <Plus size={15} /> Add
          </button>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="card p-4 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search expenses…"
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              className="input pl-9"
            />
          </div>
          <button
            onClick={() => setShowFilters((s) => !s)}
            className={cn('btn-secondary gap-2', showFilters && 'border-amber-400/30 text-amber-400')}
          >
            <Filter size={15} />
            <span className="hidden sm:inline">Filters</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-amber-400 -mr-1" />
            )}
          </button>
          {hasActiveFilters && (
            <button onClick={() => setFilters(EMPTY_FILTERS)} className="btn-ghost text-xs">
              <X size={14} /> Clear
            </button>
          )}
        </div>

        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t animate-slide-up" style={{ borderColor: 'var(--border)' }}>
            <div>
              <label className="label">From</label>
              <input type="date" value={filters.dateFrom}
                onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))}
                className="input" />
            </div>
            <div>
              <label className="label">To</label>
              <input type="date" value={filters.dateTo}
                onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))}
                className="input" />
            </div>
            <div>
              <label className="label">Category</label>
              <select value={filters.category}
                onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
                className="input">
                <option value="">All categories</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Payment</label>
              <select value={filters.paymentMethod}
                onChange={(e) => setFilters((f) => ({ ...f, paymentMethod: e.target.value }))}
                className="input">
                <option value="">All methods</option>
                {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                {[
                  { field: 'date' as SortField, label: 'Date', w: 'w-28' },
                  { field: 'amount' as SortField, label: 'Amount', w: 'w-28' },
                  { field: 'category' as SortField, label: 'Category', w: '' },
                ].map(({ field, label, w }) => (
                  <th
                    key={field}
                    onClick={() => toggleSort(field)}
                    className={`table-cell text-left cursor-pointer select-none ${w} group`}
                  >
                    <div className="flex items-center gap-1 text-xs font-medium tracking-wider uppercase text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]">
                      {label}
                      <SortIcon field={field} />
                    </div>
                  </th>
                ))}
                <th className="table-cell text-left hidden md:table-cell">
                  <span className="text-xs font-medium tracking-wider uppercase text-[var(--text-muted)]">Payment</span>
                </th>
                <th className="table-cell text-left hidden lg:table-cell">
                  <span className="text-xs font-medium tracking-wider uppercase text-[var(--text-muted)]">Notes</span>
                </th>
                <th className="table-cell w-20" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-[var(--text-muted)] text-sm">
                    {hasActiveFilters ? 'No expenses match your filters.' : 'No expenses yet. Add one to get started!'}
                  </td>
                </tr>
              ) : (
                filtered.map((expense) => (
                  <tr key={expense.id} className="table-row">
                    <td className="table-cell text-sm text-[var(--text-muted)] font-mono">
                      {format(parseISO(expense.date), 'MMM d, yy')}
                    </td>
                    <td className="table-cell text-sm font-mono font-medium text-[var(--text-primary)]">
                      {formatCurrency(expense.amount)}
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ background: getCategoryColor(expense.category) }}
                        />
                        <span className="text-sm text-[var(--text-primary)]">{expense.category}</span>
                      </div>
                    </td>
                    <td className="table-cell hidden md:table-cell">
                      <span className="badge bg-white/5 text-[var(--text-secondary)]">
                        {expense.payment_method}
                      </span>
                    </td>
                    <td className="table-cell hidden lg:table-cell text-sm text-[var(--text-muted)] max-w-xs truncate">
                      {expense.notes ?? '—'}
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => setEditingExpense(expense)}
                          className="btn-ghost p-1.5 hover:text-amber-400"
                          aria-label="Edit"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(expense.id)}
                          disabled={deletingId === expense.id}
                          className="btn-ghost p-1.5 hover:text-rose-400"
                          aria-label="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer total */}
        {filtered.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t text-sm"
               style={{ borderColor: 'var(--border)' }}>
            <span className="text-[var(--text-muted)]">{filtered.length} expenses</span>
            <span className="font-mono font-semibold text-[var(--text-primary)]">
              Total: {formatCurrency(total)}
            </span>
          </div>
        )}
      </div>

      {/* Mobile export buttons */}
      <div className="flex gap-2 sm:hidden">
        <button onClick={() => setShowImport(true)} className="btn-secondary flex-1">
          <Upload size={14} /> Import CSV
        </button>
        <button onClick={handleExport} className="btn-secondary flex-1">
          <Download size={14} /> Export CSV
        </button>
      </div>

      {showAddModal && (
        <AddExpenseModal userId={userId} onClose={() => setShowAddModal(false)} onSaved={handleExpenseAdded} />
      )}
      {editingExpense && (
        <EditExpenseModal
          expense={editingExpense}
          userId={userId}
          onClose={() => setEditingExpense(null)}
          onSaved={handleExpenseUpdated}
        />
      )}
      {showImport && (
        <ImportCSVModal userId={userId} onClose={() => setShowImport(false)} onImported={handleImported} />
      )}
    </div>
  )
}
