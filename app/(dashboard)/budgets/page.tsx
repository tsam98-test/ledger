import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import BudgetsClient from '@/components/budgets/BudgetsClient'

export default async function BudgetsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const now = new Date()

  // Fetch last 6 months of budgets
  const { data: budgets } = await supabase
    .from('budgets')
    .select('*')
    .eq('user_id', user.id)
    .order('month', { ascending: false })

  // Fetch expense totals for each month (last 6 months)
  const sixMonthsAgo = format(subMonths(startOfMonth(now), 5), 'yyyy-MM-dd')
  const { data: expenses } = await supabase
    .from('expenses')
    .select('amount, date')
    .eq('user_id', user.id)
    .gte('date', sixMonthsAgo)

  return (
    <BudgetsClient
      initialBudgets={budgets ?? []}
      expenses={expenses ?? []}
      userId={user.id}
    />
  )
}
