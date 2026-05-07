import { format, parseISO, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { type ClassValue, clsx } from 'clsx'

// Simple cn helper without clsx dep — just use template literals
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ')
}

// Format currency
export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

// Format date for display
export function formatDate(date: string): string {
  try {
    return format(parseISO(date), 'MMM d, yyyy')
  } catch {
    return date
  }
}

// Format month label
export function formatMonth(monthStr: string): string {
  try {
    return format(parseISO(`${monthStr}-01`), 'MMM yyyy')
  } catch {
    return monthStr
  }
}

// Get current month in YYYY-MM format
export function getCurrentMonth(): string {
  return format(new Date(), 'yyyy-MM')
}

// Get date range for a month
export function getMonthRange(month: string): { from: string; to: string } {
  const date = parseISO(`${month}-01`)
  return {
    from: format(startOfMonth(date), 'yyyy-MM-dd'),
    to: format(endOfMonth(date), 'yyyy-MM-dd'),
  }
}

// Get last N months
export function getLastNMonths(n: number): string[] {
  const months: string[] = []
  for (let i = n - 1; i >= 0; i--) {
    months.push(format(subMonths(new Date(), i), 'yyyy-MM'))
  }
  return months
}

// Calculate percentage
export function calcPercent(value: number, total: number): number {
  if (total === 0) return 0
  return Math.round((value / total) * 100)
}

// Get budget status color
export function getBudgetStatusColor(spent: number, budget: number): string {
  const pct = (spent / budget) * 100
  if (pct >= 100) return 'text-rose-400'
  if (pct >= 80) return 'text-amber-400'
  return 'text-jade-400'
}

export function getBudgetBarColor(spent: number, budget: number): string {
  const pct = (spent / budget) * 100
  if (pct >= 100) return 'bg-rose-500'
  if (pct >= 80) return 'bg-amber-400'
  return 'bg-jade-500'
}

// Sanitize text input to prevent XSS
export function sanitizeText(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim()
}

// Validate expense amount
export function validateAmount(amount: string): boolean {
  const num = parseFloat(amount)
  return !isNaN(num) && num > 0 && num <= 999999.99
}

// Category colors map
export const CATEGORY_COLORS: Record<string, string> = {
  'Food & Dining': '#f59e0b',
  Transportation: '#3b82f6',
  Shopping: '#8b5cf6',
  Entertainment: '#ec4899',
  Healthcare: '#10b981',
  Utilities: '#f97316',
  Housing: '#6366f1',
  Education: '#14b8a6',
  'Personal Care': '#e879f9',
  Travel: '#22d3ee',
  Subscriptions: '#a78bfa',
  Other: '#94a3b8',
}

export function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? '#94a3b8'
}

// CSV export
export function exportToCSV(data: Record<string, unknown>[], filename: string): void {
  if (data.length === 0) return
  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map((row) =>
      headers
        .map((h) => {
          const val = row[h]
          const str = val === null || val === undefined ? '' : String(val)
          return str.includes(',') || str.includes('"') || str.includes('\n')
            ? `"${str.replace(/"/g, '""')}"`
            : str
        })
        .join(',')
    ),
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)
}

// Re-export color maps from types for convenience in components
export { INVESTMENT_CATEGORY_COLORS, INCOME_CATEGORY_COLORS } from '@/types'
