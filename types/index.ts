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

export interface Budget {
  id: string
  user_id: string
  month: string
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
  'Cash', 'Credit Card', 'Debit Card', 'Bank Transfer', 'Digital Wallet', 'Other',
]

export const DEFAULT_CATEGORIES = [
  { name: 'Food & Dining',  color: '#f59e0b', icon: '🍽️' },
  { name: 'Transportation', color: '#3b82f6', icon: '🚗' },
  { name: 'Shopping',       color: '#8b5cf6', icon: '🛍️' },
  { name: 'Entertainment',  color: '#ec4899', icon: '🎬' },
  { name: 'Healthcare',     color: '#10b981', icon: '🏥' },
  { name: 'Utilities',      color: '#f97316', icon: '💡' },
  { name: 'Housing',        color: '#6366f1', icon: '🏠' },
  { name: 'Education',      color: '#14b8a6', icon: '📚' },
  { name: 'Personal Care',  color: '#e879f9', icon: '💆' },
  { name: 'Travel',         color: '#22d3ee', icon: '✈️' },
  { name: 'Subscriptions',  color: '#a78bfa', icon: '🔄' },
  { name: 'Other',          color: '#94a3b8', icon: '📌' },
]

export interface ExpenseFilters {
  dateFrom: string
  dateTo: string
  category: string
  paymentMethod: string
  search: string
}

export type SortField = 'date' | 'amount' | 'category'
export type SortOrder = 'asc' | 'desc'

// ── Income ──────────────────────────────────────────────────
export interface Income {
  id: string
  user_id: string
  amount: number
  source: string
  category: string
  date: string
  notes: string | null
  is_recurring: boolean
  created_at: string
}

export const INCOME_CATEGORIES = [
  'Salary', 'Freelance', 'Business', 'Investments', 'Dividends',
  'Rental Income', 'Side Hustle', 'Bonus', 'Gift', 'Refund', 'Other',
] as const

export const INCOME_CATEGORY_COLORS: Record<string, string> = {
  Salary:           '#10b981',
  Freelance:        '#3b82f6',
  Business:         '#8b5cf6',
  Investments:      '#f59e0b',
  Dividends:        '#22d3ee',
  'Rental Income':  '#f97316',
  'Side Hustle':    '#ec4899',
  Bonus:            '#a78bfa',
  Gift:             '#e879f9',
  Refund:           '#34d399',
  Other:            '#94a3b8',
}

// ── Investments ─────────────────────────────────────────────
export interface Investment {
  id: string
  user_id: string
  name: string
  category: string
  amount_invested: number
  current_value: number
  date: string
  notes: string | null
  created_at: string
  updated_at: string
}

export const INVESTMENT_CATEGORIES = [
  'Stocks',  'Commodities', 'Futures','ETF', 'Mutual Fund', 'Crypto', 'Real Estate',
  'Bonds', 'Fixed Deposit', 'PPF/NPS',
  'Other',
] as const

export const INVESTMENT_CATEGORY_COLORS: Record<string, string> = {
  Stocks:             '#f59e0b',
  Commodities:        '#06b6d4',
  Futures:            '#8b5cf6',
  'Mutual Fund':      '#8b5cf6',
  ETF:                '#3b82f6',
  Crypto:             '#f97316',
  'Real Estate':      '#10b981',
  Bonds:              '#22d3ee',
  'Fixed Deposit':    '#a78bfa',
  'PPF/NPS':          '#34d399',
  Other:              '#94a3b8',
}

// ── Money Management (50/15/25/10 allocation) ──────────────
export interface MoneyMonthlyEntry {
  id: string
  user_id: string
  month: string                 // 'YYYY-MM'
  income_override: number | null
  emergency_actual: number
  rewards_actual: number
  created_at: string
  updated_at: string
}

export type EmergencyGoalSource = 'auto' | 'manual'

export interface EmergencyCycle {
  id: string
  user_id: string
  cycle_start_month: string     // 'YYYY-MM'
  locked_goal: number
  goal_source: EmergencyGoalSource
  created_at: string
  updated_at: string
}

export type MoneyBucketKey = 'growth' | 'emergency' | 'essentials' | 'rewards'

export const MONEY_BUCKET_PCTS: Record<MoneyBucketKey, number> = {
  essentials: 0.50,
  emergency: 0.15,
  growth: 0.25,
  rewards: 0.10,
}

// Buckets where exceeding the target is a good outcome (invested more,
// saved more, treated yourself more). Essentials is the one bucket where
// going over is bad — it means spending above the 50% needs/wants line.
export const MONEY_BUCKET_GOOD_WHEN_OVER: Record<MoneyBucketKey, boolean> = {
  growth: true,
  emergency: true,
  essentials: false,
  rewards: true,
}

export const EMERGENCY_FUND_MONTHS_MULTIPLIER = 6   // goal size: 6 months of expenses
export const EMERGENCY_CYCLE_LENGTH_MONTHS = 12      // how often the goal is recalculated/reset

// Needs vs wants split for the Essentials expense breakdown.
// Anything not listed here (including custom/unknown categories) is a want.
export const NEEDS_CATEGORIES = [
  'Housing', 'Food & Dining', 'Transportation', 'Utilities', 'Healthcare',
]

export function isNeedCategory(category: string): boolean {
  return NEEDS_CATEGORIES.includes(category)
}
