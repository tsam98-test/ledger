import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format, startOfMonth, subMonths } from 'date-fns'
import DashboardClient from '@/components/dashboard/DashboardClient'

export default async function DashboardHomePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const now = new Date()
  const sixMonthsAgo = format(subMonths(startOfMonth(now), 5), 'yyyy-MM-dd')
  const currentMonth = format(now, 'yyyy-MM')

  const { data: expenses }    = await supabase.from('expenses').select('*').eq('user_id', user.id).gte('date', sixMonthsAgo).order('date', { ascending: false })
  const { data: income }      = await supabase.from('income').select('*').eq('user_id', user.id).gte('date', sixMonthsAgo).order('date', { ascending: false })
  const { data: investments } = await supabase.from('investments').select('*').eq('user_id', user.id).order('date', { ascending: false })
  const { data: budgets }     = await supabase.from('budgets').select('*').eq('user_id', user.id)
  const { data: moneyEntry }  = await supabase
    .from('money_monthly_entries')
    .select('emergency_actual, rewards_actual')
    .eq('user_id', user.id)
    .eq('month', currentMonth)
    .maybeSingle()

  return (
    <DashboardClient
      expenses={expenses ?? []}
      income={income ?? []}
      investments={investments ?? []}
      budgets={budgets ?? []}
      currentMonth={currentMonth}
      userId={user.id}
      moneyManagement={{
        emergencyActual: Number(moneyEntry?.emergency_actual ?? 0),
        rewardsActual: Number(moneyEntry?.rewards_actual ?? 0),
      }}
    />
  )
}
