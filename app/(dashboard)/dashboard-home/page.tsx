import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format, startOfMonth, subMonths } from 'date-fns'
import { getMonthRange } from '@/lib/utils'
import { EMERGENCY_FUND_MONTHS_MULTIPLIER } from '@/types'
import DashboardClient from '@/components/dashboard/DashboardClient'
import MoneyManagementClient from '@/components/money-management/MoneyManagementClient'

export default async function DashboardHomePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const now = new Date()
  const sixMonthsAgo = format(subMonths(startOfMonth(now), 5), 'yyyy-MM-dd')
  const currentMonth = format(now, 'yyyy-MM')

  // ── Dashboard data (unchanged) ──
  const { data: expenses }    = await supabase.from('expenses').select('*').eq('user_id', user.id).gte('date', sixMonthsAgo).order('date', { ascending: false })
  const { data: income }      = await supabase.from('income').select('*').eq('user_id', user.id).gte('date', sixMonthsAgo).order('date', { ascending: false })
  const { data: investments } = await supabase.from('investments').select('*').eq('user_id', user.id).order('date', { ascending: false })

  // ── Money Management data — fetched exactly as it was on its old standalone
  // page, so MoneyManagementClient (rendered below, untouched) behaves identically. ──
  const { from, to } = getMonthRange(currentMonth)
  const mmSixMonthsAgo = format(subMonths(startOfMonth(new Date()), 5), 'yyyy-MM-dd')

  const [
    { data: investmentsThisMonth },
    { data: investmentsAllTime },
    { data: expensesThisMonth },
    { data: expensesTrailing },
    { data: incomeThisMonth },
    { data: monthlyEntry },
    { data: allEmergencyActuals },
    { data: existingCycle },
  ] = await Promise.all([
    supabase.from('investments').select('category, amount_invested').eq('user_id', user.id).gte('date', from).lte('date', to),
    supabase.from('investments').select('category, current_value').eq('user_id', user.id),
    supabase.from('expenses').select('category, amount').eq('user_id', user.id).gte('date', from).lte('date', to),
    supabase.from('expenses').select('amount').eq('user_id', user.id).gte('date', mmSixMonthsAgo),
    supabase.from('income').select('amount, category').eq('user_id', user.id).gte('date', from).lte('date', to),
    supabase.from('money_monthly_entries').select('*').eq('user_id', user.id).eq('month', currentMonth).maybeSingle(),
    supabase.from('money_monthly_entries').select('emergency_actual').eq('user_id', user.id),
    supabase.from('money_emergency_cycle').select('*').eq('user_id', user.id).maybeSingle(),
  ])

  const trailingAvgExpenses =
    (expensesTrailing ?? []).reduce((sum, e) => sum + Number(e.amount), 0) / 6

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
    <>
      <DashboardClient
        expenses={expenses ?? []}
        income={income ?? []}
        investments={investments ?? []}
        currentMonth={currentMonth}
        userId={user.id}
      />

      {/* Money Management — moved here as-is from its old standalone page.
          MoneyManagementClient itself is completely unmodified. */}
      <div className="mt-5">
        <MoneyManagementClient
          userId={user.id}
          currentMonth={currentMonth}
          investmentsThisMonth={investmentsThisMonth ?? []}
          investmentsAllTime={investmentsAllTime ?? []}
          expensesThisMonth={expensesThisMonth ?? []}
          incomeThisMonth={incomeThisMonth ?? []}
          monthlyEntry={monthlyEntry}
          cycle={cycle}
          emergencyFundBalance={emergencyFundBalance}
          trailingAvgExpenses={trailingAvgExpenses}
        />
      </div>
    </>
  )
}
