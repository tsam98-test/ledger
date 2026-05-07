import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import InvestmentsClient from '@/components/investments/InvestmentsClient'

export default async function InvestmentsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: investments } = await supabase
    .from('investments')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })

  return (
    <InvestmentsClient
      initialInvestments={investments ?? []}
      userId={user.id}
    />
  )
}
