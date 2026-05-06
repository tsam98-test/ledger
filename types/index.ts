// ============================================================
// SHARED TYPES
// ============================================================

export interface Expense {
  id: string
  user_id: string
  amount: number
  category: string
  payment_method: string
  date: string
  notes: string | null
  created_at: string
}

export interface Category {
  id: string
  user_id: string
  name: string
  color: string
  icon: string
  created_at: string
}

export interface Budget {
  id: string
  user_id: string
  month: string // Format: 'YYYY-MM'
  amount: number
  created_at: string
}

export type PaymentMethod =
  | 'Cash'
  | 'Credit Card'
  | 'Debit Card'
  | 'Bank Transfer'
  | 'Digital Wallet'
  | 'Other'

export const PAYMENT_METHODS: PaymentMethod[] = [
  'Cash',
  'Credit Card',
  'Debit Card',
  'Bank Transfer',
  'Digital Wallet',
  'Other',
]

export const DEFAULT_CATEGORIES = [
  { name: 'Food & Dining', color: '#f59e0b', icon: '🍽️' },
  { name: 'Transportation', color: '#3b82f6', icon: '🚗' },
  { name: 'Shopping', color: '#8b5cf6', icon: '🛍️' },
  { name: 'Entertainment', color: '#ec4899', icon: '🎬' },
  { name: 'Healthcare', color: '#10b981', icon: '🏥' },
  { name: 'Utilities', color: '#f97316', icon: '💡' },
  { name: 'Housing', color: '#6366f1', icon: '🏠' },
  { name: 'Education', color: '#14b8a6', icon: '📚' },
  { name: 'Personal Care', color: '#e879f9', icon: '💆' },
  { name: 'Travel', color: '#22d3ee', icon: '✈️' },
  { name: 'Subscriptions', color: '#a78bfa', icon: '🔄' },
  { name: 'Other', color: '#94a3b8', icon: '📌' },
]

export interface ExpenseFilters {
  dateFrom: string
  dateTo: string
  category: string
  paymentMethod: string
  search: string
}

export interface MonthlyStats {
  total: number
  byCategory: Record<string, number>
  trend: { month: string; total: number }[]
  budget: number | null
}

export type SortField = 'date' | 'amount' | 'category'
export type SortOrder = 'asc' | 'desc'
