import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import DashboardClient from '@/components/dashboard/DashboardClient'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const now = new Date()
  const sixMonthsAgo = format(subMonths(startOfMonth(now), 5), 'yyyy-MM-dd')
  const todayStr = format(now, 'yyyy-MM-dd')
  const currentMonth = format(now, 'yyyy-MM')

  // Fetch last 6 months of expenses
  const { data: expenses } = await supabase
    .from('expenses')
    .select('id, amount, category, payment_method, date, notes, created_at, user_id')
    .eq('user_id', user.id)
    .gte('date', sixMonthsAgo)
    .order('date', { ascending: false })

  // Fetch last 6 months of income
  const { data: income } = await supabase
    .from('income')
    .select('id, amount, source, category, date, notes, is_recurring, created_at, user_id')
    .eq('user_id', user.id)
    .gte('date', sixMonthsAgo)
    .order('date', { ascending: false })

  // Fetch all investments (they are point-in-time, not monthly)
  const { data: investments } = await supabase
    .from('investments')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })

  // Fetch all budgets
  const { data: budgets } = await supabase
    .from('budgets')
    .select('*')
    .eq('user_id', user.id)

  return (
    <DashboardClient
      expenses={expenses ?? []}
      income={income ?? []}
      investments={investments ?? []}
      budgets={budgets ?? []}
      currentMonth={currentMonth}
      userId={user.id}
    />
  )
}
