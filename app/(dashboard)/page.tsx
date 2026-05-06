import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import DashboardClient from '@/components/dashboard/DashboardClient'

export default async function DashboardPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const now = new Date()
  const monthStart = format(startOfMonth(now), 'yyyy-MM-dd')
  const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd')

  // Fetch current month expenses
  const { data: currentExpenses } = await supabase
    .from('expenses')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', monthStart)
    .lte('date', monthEnd)
    .order('date', { ascending: false })

  // Fetch last 6 months for trend
  const sixMonthsAgo = format(subMonths(startOfMonth(now), 5), 'yyyy-MM-dd')
  const { data: trendExpenses } = await supabase
    .from('expenses')
    .select('amount, date')
    .eq('user_id', user.id)
    .gte('date', sixMonthsAgo)

  // Fetch current month budget
  const currentMonth = format(now, 'yyyy-MM')
  const { data: budget } = await supabase
    .from('budgets')
    .select('*')
    .eq('user_id', user.id)
    .eq('month', currentMonth)
    .single()

  return (
    <DashboardClient
      currentExpenses={currentExpenses ?? []}
      trendExpenses={trendExpenses ?? []}
      budget={budget}
      currentMonth={currentMonth}
      userId={user.id}
    />
  )
}
