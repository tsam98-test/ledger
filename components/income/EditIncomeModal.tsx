'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { INCOME_CATEGORIES } from '@/types'
import type { Income } from '@/types'
import { validateAmount, cn } from '@/lib/utils'
import { Modal } from '@/components/expenses/AddExpenseModal'

interface Props {
  income: Income
  userId: string
  onClose: () => void
  onSaved: (income: Income) => void
}

export default function EditIncomeModal({ income, userId, onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    amount:       String(income.amount),
    source:       income.source,
    category:     income.category,
    date:         income.date,
    notes:        income.notes ?? '',
    is_recurring: income.is_recurring,
  })
  const [errors, setErrors]       = useState<Record<string, string>>({})
  const [loading, setLoading]     = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const supabase = createClient()

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!form.amount || !validateAmount(form.amount)) e.amount = 'Enter a valid amount'
    if (!form.source.trim()) e.source = 'Enter an income source'
    if (!form.category) e.category = 'Select a category'
    if (!form.date) e.date = 'Select a date'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    setServerError(null)

    const { data, error } = await supabase
      .from('income')
      .update({
        amount:       parseFloat(form.amount),
        source:       form.source.trim(),
        category:     form.category,
        date:         form.date,
        notes:        form.notes.trim() || null,
        is_recurring: form.is_recurring,
      })
      .eq('id', income.id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) { setServerError('Failed to update. Please try again.'); setLoading(false); return }
    onSaved(data as Income)
  }

  return (
    <Modal title="Edit Income" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Amount</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm">$</span>
            <input type="number" step="0.01" min="0.01" value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              className={cn('input pl-7', errors.amount && 'border-rose-500/50')} autoFocus />
          </div>
          {errors.amount && <p className="text-rose-400 text-xs mt-1">{errors.amount}</p>}
        </div>

        <div>
          <label className="label">Source</label>
          <input type="text" value={form.source}
            onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
            className={cn('input', errors.source && 'border-rose-500/50')} maxLength={100} />
          {errors.source && <p className="text-rose-400 text-xs mt-1">{errors.source}</p>}
        </div>

        <div>
          <label className="label">Category</label>
          <select value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            className={cn('input', errors.category && 'border-rose-500/50')}>
            {INCOME_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          {errors.category && <p className="text-rose-400 text-xs mt-1">{errors.category}</p>}
        </div>

        <div>
          <label className="label">Date</label>
          <input type="date" value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            className={cn('input', errors.date && 'border-rose-500/50')} />
          {errors.date && <p className="text-rose-400 text-xs mt-1">{errors.date}</p>}
        </div>

        <div className="flex items-center gap-3">
          <input type="checkbox" id="rec" checked={form.is_recurring}
            onChange={(e) => setForm((f) => ({ ...f, is_recurring: e.target.checked }))}
            className="w-4 h-4 rounded accent-amber-400 cursor-pointer" />
          <label htmlFor="rec" className="text-sm text-[var(--text-secondary)] cursor-pointer">Recurring monthly income</label>
        </div>

        <div>
          <label className="label">Notes <span className="normal-case font-normal text-[var(--text-muted)]">(optional)</span></label>
          <textarea value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            className="input resize-none" rows={2} maxLength={500} />
        </div>

        {serverError && <p className="text-rose-400 text-sm px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-500/20">{serverError}</p>}

        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" disabled={loading}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white transition-all disabled:opacity-50"
            style={{ background: '#10b981' }}>
            {loading ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
