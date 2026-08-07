import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getCurrentMonth, getMonthRange } from '@/lib/utils'
import InvestmentsClient from '@/components/investments/InvestmentsClient'

export default async function InvestmentsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const currentMonth = getCurrentMonth()
  const { from, to } = getMonthRange(currentMonth)

  // Income/expenses for the current month are fetched here too — the
  // Savings Rate card needs them, even though this is the Investments page.
  const [
    { data: investments },
    { data: monthIncome },
    { data: monthExpenses },
  ] = await Promise.all([
    supabase.from('investments').select('*').eq('user_id', user.id).order('date', { ascending: false }),
    supabase.from('income').select('amount').eq('user_id', user.id).gte('date', from).lte('date', to),
    supabase.from('expenses').select('amount').eq('user_id', user.id).gte('date', from).lte('date', to),
  ])

  const monthIncomeTotal   = (monthIncome ?? []).reduce((s, i) => s + Number(i.amount), 0)
  const monthExpensesTotal = (monthExpenses ?? []).reduce((s, e) => s + Number(e.amount), 0)

  return (
    <InvestmentsClient
      initialInvestments={investments ?? []}
      userId={user.id}
      monthIncomeTotal={monthIncomeTotal}
      monthExpensesTotal={monthExpensesTotal}
    />
  )
}
