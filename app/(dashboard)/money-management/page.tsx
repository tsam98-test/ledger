
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { subMonths, startOfMonth, format } from 'date-fns'
import { getCurrentMonth, getMonthRange } from '@/lib/utils'
import { EMERGENCY_FUND_MONTHS_MULTIPLIER } from '@/types'
import MoneyManagementClient from '@/components/money-management/MoneyManagementClient'

export default async function MoneyManagementPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const currentMonth = getCurrentMonth()
  const { from, to } = getMonthRange(currentMonth)
  const sixMonthsAgo = format(subMonths(startOfMonth(new Date()), 5), 'yyyy-MM-dd')

  const [
    { data: investments },
    { data: expensesThisMonth },
    { data: expensesTrailing },
    { data: incomeThisMonth },
    { data: monthlyEntry },
    { data: allEmergencyActuals },
    { data: existingCycle },
  ] = await Promise.all([
    supabase.from('investments').select('category, current_value').eq('user_id', user.id),
    supabase.from('expenses').select('category, amount').eq('user_id', user.id).gte('date', from).lte('date', to),
    supabase.from('expenses').select('amount').eq('user_id', user.id).gte('date', sixMonthsAgo),
    supabase.from('income').select('amount').eq('user_id', user.id).gte('date', from).lte('date', to),
    supabase.from('money_monthly_entries').select('*').eq('user_id', user.id).eq('month', currentMonth).maybeSingle(),
    supabase.from('money_monthly_entries').select('emergency_actual').eq('user_id', user.id),
    supabase.from('money_emergency_cycle').select('*').eq('user_id', user.id).maybeSingle(),
  ])

  // Trailing 6-month average expenses, used as the default (auto) emergency goal input
  const trailingAvgExpenses =
    (expensesTrailing ?? []).reduce((sum, e) => sum + Number(e.amount), 0) / 6

  // Bootstrap the emergency cycle on first visit — nothing to recalculate here,
  // just establishing a starting point. Later recalculations are an explicit
  // user action (see MoneyManagementClient), never silent.
  let cycle = existingCycle
  if (!cycle) {
    const { data: created } = await supabase
      .from('money_emergency_cycle')
      .insert({
        user_id: user.id,
        cycle_start_month: currentMonth,
        locked_goal: Math.round(trailingAvgExpenses * EMERGENCY_FUND_MONTHS_MULTIPLIER),
        goal_source: 'auto',
      })
      .select()
      .single()
    cycle = created
  }

  const emergencyFundBalance = (allEmergencyActuals ?? []).reduce(
    (sum, r) => sum + Number(r.emergency_actual), 0
  )

  return (
    <MoneyManagementClient
      userId={user.id}
      currentMonth={currentMonth}
      investments={investments ?? []}
      expensesThisMonth={expensesThisMonth ?? []}
      incomeThisMonth={incomeThisMonth ?? []}
      monthlyEntry={monthlyEntry}
      cycle={cycle}
      emergencyFundBalance={emergencyFundBalance}
      trailingAvgExpenses={trailingAvgExpenses}
    />
  )
}
