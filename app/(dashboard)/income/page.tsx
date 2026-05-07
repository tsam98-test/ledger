import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import IncomeClient from '@/components/income/IncomeClient'

export default async function IncomePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: income } = await supabase
    .from('income')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })

  return (
    <IncomeClient
      initialIncome={income ?? []}
      userId={user.id}
    />
  )
}
