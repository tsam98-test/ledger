'use client'

import { useState, useRef } from 'react'
import { Upload, CheckCircle, AlertCircle, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Expense } from '@/types'
import { DEFAULT_CATEGORIES, PAYMENT_METHODS } from '@/types'
import { validateAmount, cn } from '@/lib/utils'
import { Modal } from './AddExpenseModal'
import { format } from 'date-fns'

interface Props {
  userId: string
  onClose: () => void
  onImported: (expenses: Expense[]) => void
}

interface ParsedRow {
  amount: string
  category: string
  payment_method: string
  date: string
  notes: string
  valid: boolean
  error?: string
}

const VALID_CATEGORIES = new Set(DEFAULT_CATEGORIES.map((c) => c.name))
const VALID_PAYMENTS = new Set(PAYMENT_METHODS)

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
      else inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current.trim())
  return result
}

export default function ImportCSVModal({ userId, onClose, onImported }: Props) {
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [fileName, setFileName] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'upload' | 'preview' | 'done'>('upload')
  const [importedCount, setImportedCount] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  function handleFile(file: File) {
    if (!file.name.endsWith('.csv')) {
      alert('Please upload a CSV file.')
      return
    }
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const lines = text.split(/\r?\n/).filter((l) => l.trim())
      if (lines.length < 2) { alert('CSV appears empty.'); return }

      const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase().replace(/\s+/g, '_'))

      const idxAmount = headers.findIndex((h) => h.includes('amount'))
      const idxCategory = headers.findIndex((h) => h.includes('category'))
      const idxPayment = headers.findIndex((h) => h.includes('payment'))
      const idxDate = headers.findIndex((h) => h.includes('date'))
      const idxNotes = headers.findIndex((h) => h.includes('note'))

      const parsed: ParsedRow[] = []

      for (let i = 1; i < Math.min(lines.length, 501); i++) {
        const cols = parseCSVLine(lines[i])
        const amount = idxAmount >= 0 ? cols[idxAmount] ?? '' : ''
        const category = idxCategory >= 0 ? cols[idxCategory] ?? '' : 'Other'
        const payment = idxPayment >= 0 ? cols[idxPayment] ?? '' : 'Other'
        const date = idxDate >= 0 ? cols[idxDate] ?? '' : ''
        const notes = idxNotes >= 0 ? cols[idxNotes] ?? '' : ''

        let error: string | undefined
        const cleanAmount = amount.replace(/[$,]/g, '')
        if (!validateAmount(cleanAmount)) error = 'Invalid amount'
        else if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) error = 'Date must be YYYY-MM-DD'

        parsed.push({
          amount: cleanAmount,
          category: VALID_CATEGORIES.has(category) ? category : 'Other',
          payment_method: (VALID_PAYMENTS as Set<string>).has(payment) ? payment as PaymentMethod : 'Other',
          date,
          notes: notes.slice(0, 500),
          valid: !error,
          error,
        })
      }

      setRows(parsed)
      setStep('preview')
    }
    reader.readAsText(file)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  async function handleImport() {
    const validRows = rows.filter((r) => r.valid)
    if (validRows.length === 0) return
    setLoading(true)

    const inserts = validRows.map((r) => ({
      user_id: userId,
      amount: parseFloat(r.amount),
      category: r.category,
      payment_method: r.payment_method,
      date: r.date,
      notes: r.notes || null,
    }))

    // Batch insert in chunks of 100
    const imported: Expense[] = []
    for (let i = 0; i < inserts.length; i += 100) {
      const chunk = inserts.slice(i, i + 100)
      const { data, error } = await supabase
        .from('expenses')
        .insert(chunk)
        .select()
      if (!error && data) imported.push(...(data as Expense[]))
    }

    setImportedCount(imported.length)
    setStep('done')
    setLoading(false)
    if (imported.length > 0) onImported(imported)
  }

  const validCount = rows.filter((r) => r.valid).length
  const invalidCount = rows.length - validCount

  return (
    <Modal title="Import CSV" onClose={onClose}>
      {step === 'upload' && (
        <div>
          <p className="text-sm text-[var(--text-muted)] mb-4">
            Upload a CSV file with columns: <span className="font-mono text-xs text-amber-400">Date, Amount, Category, Payment Method, Notes</span>
          </p>
          <div
            onDrop={onDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors hover:border-amber-400/40 hover:bg-amber-400/5"
            style={{ borderColor: 'var(--border)' }}
          >
            <Upload className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-2" />
            <p className="text-sm text-[var(--text-secondary)]">Drop CSV here or <span className="text-amber-400">browse</span></p>
            <p className="text-xs text-[var(--text-muted)] mt-1">Max 500 rows</p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <div className="mt-4 p-3 rounded-lg bg-white/[0.03] border text-xs text-[var(--text-muted)] space-y-1">
            <p className="font-medium text-[var(--text-secondary)] mb-1">Expected format:</p>
            <p className="font-mono">Date,Amount,Category,Payment Method,Notes</p>
            <p className="font-mono">2024-01-15,45.50,Food &amp; Dining,Credit Card,Lunch</p>
          </div>
        </div>
      )}

      {step === 'preview' && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <FileText size={16} className="text-[var(--text-muted)]" />
            <span className="text-sm text-[var(--text-secondary)] truncate">{fileName}</span>
          </div>
          <div className="flex gap-3 mb-4">
            <div className="flex items-center gap-1.5 text-sm text-jade-400">
              <CheckCircle size={14} />
              {validCount} valid
            </div>
            {invalidCount > 0 && (
              <div className="flex items-center gap-1.5 text-sm text-rose-400">
                <AlertCircle size={14} />
                {invalidCount} will be skipped
              </div>
            )}
          </div>

          <div className="max-h-52 overflow-y-auto rounded-lg border text-xs font-mono" style={{ borderColor: 'var(--border)' }}>
            <table className="w-full">
              <thead className="sticky top-0" style={{ background: 'var(--bg-card)' }}>
                <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                  <th className="px-2 py-1.5 text-left text-[var(--text-muted)]">Date</th>
                  <th className="px-2 py-1.5 text-left text-[var(--text-muted)]">Amount</th>
                  <th className="px-2 py-1.5 text-left text-[var(--text-muted)]">Category</th>
                  <th className="px-2 py-1.5 text-left text-[var(--text-muted)]">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 20).map((row, i) => (
                  <tr key={i} className={cn('border-b', !row.valid && 'opacity-50')} style={{ borderColor: 'var(--border)' }}>
                    <td className="px-2 py-1.5 text-[var(--text-secondary)]">{row.date}</td>
                    <td className="px-2 py-1.5 text-[var(--text-primary)]">${row.amount}</td>
                    <td className="px-2 py-1.5 text-[var(--text-secondary)] truncate max-w-[100px]">{row.category}</td>
                    <td className="px-2 py-1.5">
                      {row.valid
                        ? <span className="text-jade-400">✓</span>
                        : <span className="text-rose-400" title={row.error}>✗</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 20 && (
              <p className="px-2 py-1.5 text-[var(--text-muted)] text-center">
                …and {rows.length - 20} more rows
              </p>
            )}
          </div>

          <div className="flex gap-2 mt-4">
            <button onClick={() => setStep('upload')} className="btn-secondary flex-1">Back</button>
            <button onClick={handleImport} disabled={loading || validCount === 0} className="btn-primary flex-1">
              {loading ? 'Importing…' : `Import ${validCount} rows`}
            </button>
          </div>
        </div>
      )}

      {step === 'done' && (
        <div className="text-center py-6">
          <CheckCircle className="w-12 h-12 text-jade-400 mx-auto mb-3" />
          <p className="text-lg font-semibold text-[var(--text-primary)]">Import Complete</p>
          <p className="text-[var(--text-muted)] text-sm mt-1">
            Successfully imported {importedCount} expense{importedCount !== 1 ? 's' : ''}.
          </p>
          <button onClick={onClose} className="btn-primary mt-5">Done</button>
        </div>
      )}
    </Modal>
  )
}
