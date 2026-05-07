'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { INVESTMENT_CATEGORIES } from '@/types'
import type { Investment } from '@/types'
import { validateAmount, cn } from '@/lib/utils'
import { Modal } from '@/components/expenses/AddExpenseModal'

interface Props {
  investment: Investment
  userId: string
  onClose: () => void
  onSaved: (inv: Investment) => void
}

export default function EditInvestmentModal({ investment, userId, onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    name:            investment.name,
    category:        investment.category,
    amount_invested: String(investment.amount_invested),
    current_value:   String(investment.current_value),
    date:            investment.date,
    notes:           investment.notes ?? '',
  })
  const [errors, setErrors]           = useState<Record<string, string>>({})
  const [loading, setLoading]         = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const supabase = createClient()

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!form.name.trim())                     e.name            = 'Enter investment name'
    if (!form.category)                        e.category        = 'Select a category'
    if (!validateAmount(form.amount_invested)) e.amount_invested = 'Enter a valid amount'
    if (!form.current_value || isNaN(parseFloat(form.current_value)) || parseFloat(form.current_value) < 0)
                                               e.current_value   = 'Enter a valid current value'
    if (!form.date)                            e.date            = 'Select a date'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    setServerError(null)

    const { data, error } = await supabase
      .from('investments')
      .update({
        name:            form.name.trim(),
        category:        form.category,
        amount_invested: parseFloat(form.amount_invested),
        current_value:   parseFloat(form.current_value),
        date:            form.date,
        notes:           form.notes.trim() || null,
        updated_at:      new Date().toISOString(),
      })
      .eq('id', investment.id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) { setServerError('Failed to update. Please try again.'); setLoading(false); return }
    onSaved(data as Investment)
  }

  const invested = parseFloat(form.amount_invested) || 0
  const current  = parseFloat(form.current_value) || 0
  const ret      = current - invested
  const pct      = invested > 0 ? (ret / invested) * 100 : 0

  return (
    <Modal title="Edit Investment" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Investment Name</label>
          <input type="text" value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className={cn('input', errors.name && 'border-rose-500/50')}
            maxLength={100} autoFocus />
          {errors.name && <p className="text-rose-400 text-xs mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="label">Category</label>
          <select value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            className={cn('input', errors.category && 'border-rose-500/50')}>
            {INVESTMENT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          {errors.category && <p className="text-rose-400 text-xs mt-1">{errors.category}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Amount Invested</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm">$</span>
              <input type="number" step="0.01" min="0.01" value={form.amount_invested}
                onChange={(e) => setForm((f) => ({ ...f, amount_invested: e.target.value }))}
                className={cn('input pl-7', errors.amount_invested && 'border-rose-500/50')} />
            </div>
            {errors.amount_invested && <p className="text-rose-400 text-xs mt-1">{errors.amount_invested}</p>}
          </div>
          <div>
            <label className="label">Current Value</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm">$</span>
              <input type="number" step="0.01" min="0" value={form.current_value}
                onChange={(e) => setForm((f) => ({ ...f, current_value: e.target.value }))}
                className={cn('input pl-7', errors.current_value && 'border-rose-500/50')} />
            </div>
            {errors.current_value && <p className="text-rose-400 text-xs mt-1">{errors.current_value}</p>}
          </div>
        </div>

        {invested > 0 && (
          <div className="px-3.5 py-2.5 rounded-lg bg-white/[0.03] border text-xs" style={{ borderColor: 'var(--border)' }}>
            <span className={ret >= 0 ? 'text-jade-400' : 'text-rose-400'}>
              Return: {ret >= 0 ? '+' : ''}{ret.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
              {' '}({pct >= 0 ? '+' : ''}{pct.toFixed(2)}%)
            </span>
          </div>
        )}

        <div>
          <label className="label">Date</label>
          <input type="date" value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            className={cn('input', errors.date && 'border-rose-500/50')} />
          {errors.date && <p className="text-rose-400 text-xs mt-1">{errors.date}</p>}
        </div>

        <div>
          <label className="label">Notes <span className="normal-case font-normal text-[var(--text-muted)]">(optional)</span></label>
          <textarea value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            className="input resize-none" rows={2} maxLength={500} />
        </div>

        {serverError && (
          <p className="text-rose-400 text-sm px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-500/20">{serverError}</p>
        )}

        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary flex-1">
            {loading ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
