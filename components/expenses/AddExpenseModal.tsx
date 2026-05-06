'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { DEFAULT_CATEGORIES, PAYMENT_METHODS } from '@/types'
import type { Expense } from '@/types'
import { validateAmount, cn } from '@/lib/utils'
import { format } from 'date-fns'

interface Props {
  userId: string
  onClose: () => void
  onSaved: (expense: Expense) => void
}

const CATEGORIES = DEFAULT_CATEGORIES.map((c) => c.name)

export default function AddExpenseModal({ userId, onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    amount: '',
    category: '',
    payment_method: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    notes: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const supabase = createClient()

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!form.amount || !validateAmount(form.amount)) e.amount = 'Enter a valid amount (e.g. 12.50)'
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
      .insert({
        user_id: userId,
        amount: parseFloat(form.amount),
        category: form.category,
        payment_method: form.payment_method,
        date: form.date,
        notes: form.notes.trim() || null,
      })
      .select()
      .single()

    if (error) {
      setServerError('Failed to save expense. Please try again.')
      setLoading(false)
      return
    }

    onSaved(data as Expense)
  }

  return (
    <Modal title="Add Expense" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Amount */}
        <div>
          <label className="label">Amount</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm">$</span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max="999999.99"
              placeholder="0.00"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              className={cn('input pl-7', errors.amount && 'border-rose-500/50 focus:border-rose-500/50 focus:ring-rose-500/30')}
              autoFocus
            />
          </div>
          {errors.amount && <p className="text-rose-400 text-xs mt-1">{errors.amount}</p>}
        </div>

        {/* Category */}
        <div>
          <label className="label">Category</label>
          <select
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            className={cn('input', errors.category && 'border-rose-500/50')}
          >
            <option value="">Select category…</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          {errors.category && <p className="text-rose-400 text-xs mt-1">{errors.category}</p>}
        </div>

        {/* Payment method */}
        <div>
          <label className="label">Payment Method</label>
          <select
            value={form.payment_method}
            onChange={(e) => setForm((f) => ({ ...f, payment_method: e.target.value }))}
            className={cn('input', errors.payment_method && 'border-rose-500/50')}
          >
            <option value="">Select method…</option>
            {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          {errors.payment_method && <p className="text-rose-400 text-xs mt-1">{errors.payment_method}</p>}
        </div>

        {/* Date */}
        <div>
          <label className="label">Date</label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            className={cn('input', errors.date && 'border-rose-500/50')}
            max={format(new Date(), 'yyyy-MM-dd')}
          />
          {errors.date && <p className="text-rose-400 text-xs mt-1">{errors.date}</p>}
        </div>

        {/* Notes */}
        <div>
          <label className="label">Notes <span className="normal-case font-normal text-[var(--text-muted)]">(optional)</span></label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            className="input resize-none"
            rows={2}
            placeholder="Add a note…"
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
            {loading ? 'Saving…' : 'Add Expense'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export function Modal({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="card w-full max-w-md p-6 shadow-glow-lg animate-scale-in"
        style={{ borderColor: 'rgba(251,191,36,0.12)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h2>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
