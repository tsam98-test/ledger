'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DEFAULT_CATEGORIES, PAYMENT_METHODS } from '@/types'
import type { Expense } from '@/types'
import { validateAmount, cn } from '@/lib/utils'
import { Modal } from './AddExpenseModal'

interface Props {
  expense: Expense
  userId: string
  onClose: () => void
  onSaved: (expense: Expense) => void
}

const CATEGORIES = DEFAULT_CATEGORIES.map((c) => c.name)

export default function EditExpenseModal({ expense, userId, onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    amount: String(expense.amount),
    category: expense.category,
    payment_method: expense.payment_method,
    date: expense.date,
    notes: expense.notes ?? '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const supabase = createClient()

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!form.amount || !validateAmount(form.amount)) e.amount = 'Enter a valid amount'
    if (!form.category) e.category = 'Select a category'
    if (!form.payment_method) e.payment_method = 'Select a payment method'
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
      .from('expenses')
      .update({
        amount: parseFloat(form.amount),
        category: form.category,
        payment_method: form.payment_method,
        date: form.date,
        notes: form.notes.trim() || null,
      })
      .eq('id', expense.id)
      .eq('user_id', userId) // RLS double-check
      .select()
      .single()

    if (error) {
      setServerError('Failed to update expense. Please try again.')
      setLoading(false)
      return
    }

    onSaved(data as Expense)
  }

  return (
    <Modal title="Edit Expense" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Amount</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm">$</span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max="999999.99"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              className={cn('input pl-7', errors.amount && 'border-rose-500/50')}
              autoFocus
            />
          </div>
          {errors.amount && <p className="text-rose-400 text-xs mt-1">{errors.amount}</p>}
        </div>

        <div>
          <label className="label">Category</label>
          <select
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            className={cn('input', errors.category && 'border-rose-500/50')}
          >
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          {errors.category && <p className="text-rose-400 text-xs mt-1">{errors.category}</p>}
        </div>

        <div>
          <label className="label">Payment Method</label>
          <select
            value={form.payment_method}
            onChange={(e) => setForm((f) => ({ ...f, payment_method: e.target.value }))}
            className={cn('input', errors.payment_method && 'border-rose-500/50')}
          >
            {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          {errors.payment_method && <p className="text-rose-400 text-xs mt-1">{errors.payment_method}</p>}
        </div>

        <div>
          <label className="label">Date</label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            className={cn('input', errors.date && 'border-rose-500/50')}
          />
          {errors.date && <p className="text-rose-400 text-xs mt-1">{errors.date}</p>}
        </div>

        <div>
          <label className="label">Notes <span className="normal-case font-normal text-[var(--text-muted)]">(optional)</span></label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            className="input resize-none"
            rows={2}
            maxLength={500}
          />
        </div>

        {serverError && (
          <p className="text-rose-400 text-sm px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
            {serverError}
          </p>
        )}

        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" className="btn-primary flex-1" disabled={loading}>
            {loading ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
