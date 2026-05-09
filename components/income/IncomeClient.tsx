'use client'

import { useState, useMemo, useCallback } from 'react'
import { format, parseISO } from 'date-fns'
import { Plus, Search, Filter, Download, Pencil, Trash2, ChevronUp, ChevronDown, X, RefreshCw, Wallet } from 'lucide-react'
import type { Income } from '@/types'
import { INCOME_CATEGORIES, INCOME_CATEGORY_COLORS } from '@/types'
import { formatCurrency, exportToCSV, cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import AddIncomeModal, { type KnownSource } from './AddIncomeModal'
import EditIncomeModal from './EditIncomeModal'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'

type SF = 'date' | 'amount' | 'source' | 'category'
type SO = 'asc' | 'desc'
interface Filters { search: string; category: string; dateFrom: string; dateTo: string; recurring: string }
const EMPTY: Filters = { search: '', category: '', dateFrom: '', dateTo: '', recurring: '' }

export default function IncomeClient({ initialIncome, userId }: { initialIncome: Income[]; userId: string }) {
  const [income, setIncome]         = useState<Income[]>(initialIncome)
  const [filters, setFilters]       = useState<Filters>(EMPTY)
  const [showFilters, setShowFilters] = useState(false)
  const [sortField, setSortField]   = useState<SF>('date')
  const [sortOrder, setSortOrder]   = useState<SO>('desc')
  const [showAdd, setShowAdd]       = useState(false)
  const [editing, setEditing]       = useState<Income | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const supabase = createClient()

  const filtered = useMemo(() => {
    let list = [...income]
    if (filters.search) { const q = filters.search.toLowerCase(); list = list.filter((i) => i.source.toLowerCase().includes(q) || i.category.toLowerCase().includes(q) || (i.notes?.toLowerCase().includes(q) ?? false)) }
    if (filters.category)  list = list.filter((i) => i.category === filters.category)
    if (filters.dateFrom)  list = list.filter((i) => i.date >= filters.dateFrom)
    if (filters.dateTo)    list = list.filter((i) => i.date <= filters.dateTo)
    if (filters.recurring === 'yes') list = list.filter((i) => i.is_recurring)
    if (filters.recurring === 'no')  list = list.filter((i) => !i.is_recurring)
    list.sort((a, b) => {
      let cmp = 0
      if (sortField === 'date')     cmp = a.date.localeCompare(b.date)
      if (sortField === 'amount')   cmp = Number(a.amount) - Number(b.amount)
      if (sortField === 'source')   cmp = a.source.localeCompare(b.source)
      if (sortField === 'category') cmp = a.category.localeCompare(b.category)
      return sortOrder === 'asc' ? cmp : -cmp
    })
    return list
  }, [income, filters, sortField, sortOrder])

  const total          = useMemo(() => filtered.reduce((s, i) => s + Number(i.amount), 0), [filtered])
  const recurringTotal = useMemo(() => income.filter((i) => i.is_recurring).reduce((s, i) => s + Number(i.amount), 0), [income])
  const uniqueSources  = useMemo(() => new Set(filtered.map((i) => i.source)).size, [filtered])
  const byCategory     = useMemo(() => { const map: Record<string,number>={};filtered.forEach((i)=>{map[i.category]=(map[i.category]??0)+Number(i.amount)});return Object.entries(map).sort((a,b)=>b[1]-a[1]).map(([name,value])=>({name,value})) }, [filtered])
  const hasFilters     = Object.values(filters).some(Boolean)

  // Deduplicated known sources for quick-select chips — most recent category per source
  const knownSources = useMemo<KnownSource[]>(() => {
    const map = new Map<string, string>()
    // income is sorted date desc, so first occurrence = most recent category
    ;[...income].forEach(i => {
      if (!map.has(i.source)) map.set(i.source, i.category)
    })
    return Array.from(map.entries()).map(([source, category]) => ({ source, category }))
  }, [income])

  function toggleSort(field: SF) { if (sortField===field) setSortOrder((o)=>(o==='asc'?'desc':'asc')); else { setSortField(field); setSortOrder('desc') } }
  function SortIcon({ field }: { field: SF }) {
    if (sortField !== field) return <ChevronDown size={12} className="opacity-30" />
    return sortOrder === 'asc' ? <ChevronUp size={12} style={{color:'#10b981'}} /> : <ChevronDown size={12} style={{color:'#10b981'}} />
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this income entry?')) return
    setDeletingId(id)
    const { error } = await supabase.from('income').delete().eq('id', id).eq('user_id', userId)
    if (!error) setIncome((prev) => prev.filter((i) => i.id !== id))
    setDeletingId(null)
  }

  const handleAdded   = useCallback((item: Income) => { setIncome((p) => [item, ...p]); setShowAdd(false) }, [])
  const handleUpdated = useCallback((item: Income) => { setIncome((p) => p.map((i) => (i.id === item.id ? item : i))); setEditing(null) }, [])

  function handleExport() {
    exportToCSV(filtered.map((i) => ({ Date:i.date,Amount:i.amount,Source:i.source,Category:i.category,Recurring:i.is_recurring?'Yes':'No',Notes:i.notes??'' })), `income-${format(new Date(),'yyyy-MM-dd')}.csv`)
  }

  const PieTip = ({ active, payload }: any) => {
    if (!active||!payload?.length) return null
    return <div className="custom-tooltip"><p className="text-xs font-medium text-[var(--text-primary)]">{payload[0].name}</p><p className="font-mono text-sm" style={{color:INCOME_CATEGORY_COLORS[payload[0].name]??'#94a3b8'}}>{formatCurrency(payload[0].value)}</p></div>
  }

  return (
    <div className="space-y-5 pb-24 lg:pb-8 animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl text-[var(--text-primary)]">Income</h1>
          <p className="text-[var(--text-muted)] text-sm mt-0.5">{filtered.length} record{filtered.length!==1?'s':''} · {formatCurrency(total)}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="btn-secondary hidden sm:flex"><Download size={15}/> Export</button>
          <button onClick={()=>setShowAdd(true)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white" style={{background:'#10b981'}}><Plus size={15}/> Add Income</button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="stat-card"><span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Total Income</span><p className="text-xl font-mono font-semibold" style={{color:'#10b981'}}>{formatCurrency(total)}</p></div>
        <div className="stat-card"><span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Sources</span><p className="text-xl font-mono font-semibold text-[var(--text-primary)]">{uniqueSources}</p></div>
        <div className="stat-card col-span-2 md:col-span-1"><div className="flex items-center gap-1.5"><RefreshCw size={13} style={{color:'#38bdf8'}}/><span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Recurring / mo</span></div><p className="text-xl font-mono font-semibold" style={{color:'#38bdf8'}}>{formatCurrency(recurringTotal)}</p></div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {byCategory.length > 0 && (
          <div className="card p-5">
            <h2 className="text-sm font-medium text-[var(--text-primary)] mb-3">By Source Type</h2>
            <ResponsiveContainer width="100%" height={140}>
              <PieChart><Pie data={byCategory} cx="50%" cy="50%" innerRadius={35} outerRadius={58} paddingAngle={2} dataKey="value">
                {byCategory.map((e)=><Cell key={e.name} fill={INCOME_CATEGORY_COLORS[e.name]??'#94a3b8'} opacity={0.9}/>)}
              </Pie><Tooltip content={<PieTip/>}/></PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 mt-1">
              {byCategory.slice(0,4).map((c)=>(
                <div key={c.name} className="flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{background:INCOME_CATEGORY_COLORS[c.name]??'#94a3b8'}}/>
                  <span className="text-[var(--text-secondary)] flex-1 truncate">{c.name}</span>
                  <span className="font-mono" style={{color:'#10b981'}}>+{formatCurrency(c.value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className={cn('card p-4 space-y-3',byCategory.length>0?'lg:col-span-2':'lg:col-span-3')}>
          <div className="flex gap-2">
            <div className="relative flex-1"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"/><input type="text" placeholder="Search income…" value={filters.search} onChange={(e)=>setFilters((f)=>({...f,search:e.target.value}))} className="input pl-9"/></div>
            <button onClick={()=>setShowFilters((s)=>!s)} className={cn('btn-secondary',showFilters&&'border-amber-400/30 text-amber-400')}><Filter size={14}/><span className="hidden sm:inline">Filters</span>{hasFilters&&<span className="w-2 h-2 rounded-full bg-amber-400 -mr-1"/>}</button>
            {hasFilters&&<button onClick={()=>setFilters(EMPTY)} className="btn-ghost text-xs"><X size={13}/> Clear</button>}
          </div>
          {showFilters&&(
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t animate-slide-up" style={{borderColor:'var(--border)'}}>
              <div><label className="label">From</label><input type="date" value={filters.dateFrom} onChange={(e)=>setFilters((f)=>({...f,dateFrom:e.target.value}))} className="input"/></div>
              <div><label className="label">To</label><input type="date" value={filters.dateTo} onChange={(e)=>setFilters((f)=>({...f,dateTo:e.target.value}))} className="input"/></div>
              <div><label className="label">Category</label><select value={filters.category} onChange={(e)=>setFilters((f)=>({...f,category:e.target.value}))} className="input"><option value="">All</option>{INCOME_CATEGORIES.map((c)=><option key={c} value={c}>{c}</option>)}</select></div>
              <div><label className="label">Recurring</label><select value={filters.recurring} onChange={(e)=>setFilters((f)=>({...f,recurring:e.target.value}))} className="input"><option value="">All</option><option value="yes">Recurring only</option><option value="no">One-time only</option></select></div>
            </div>
          )}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b" style={{borderColor:'var(--border)'}}>
                {(['date','amount','source','category'] as SF[]).map((field)=>(
                  <th key={field} onClick={()=>toggleSort(field)} className="table-cell text-left cursor-pointer select-none group">
                    <div className="flex items-center gap-1 text-xs font-medium tracking-wider uppercase text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]">
                      {field.charAt(0).toUpperCase()+field.slice(1)}<SortIcon field={field}/>
                    </div>
                  </th>
                ))}
                <th className="table-cell hidden md:table-cell"><span className="text-xs font-medium tracking-wider uppercase text-[var(--text-muted)]">Type</span></th>
                <th className="table-cell hidden lg:table-cell"><span className="text-xs font-medium tracking-wider uppercase text-[var(--text-muted)]">Notes</span></th>
                <th className="table-cell w-20"/>
              </tr>
            </thead>
            <tbody>
              {filtered.length===0?(
                <tr><td colSpan={7} className="px-5 py-16 text-center">
                  <Wallet className="w-8 h-8 mx-auto mb-2 opacity-20"/>
                  <p className="text-[var(--text-muted)] text-sm">{hasFilters?'No income matches your filters.':'No income recorded yet.'}</p>
                  {!hasFilters&&<button onClick={()=>setShowAdd(true)} className="mt-3 px-4 py-2 rounded-lg text-sm font-medium text-white" style={{background:'#10b981'}}>Add your first income</button>}
                </td></tr>
              ):(
                filtered.map((item)=>(
                  <tr key={item.id} className="table-row">
                    <td className="table-cell text-sm text-[var(--text-muted)] font-mono">{format(parseISO(item.date),'MMM d, yy')}</td>
                    <td className="table-cell text-sm font-mono font-semibold" style={{color:'#10b981'}}>+{formatCurrency(item.amount)}</td>
                    <td className="table-cell text-sm text-[var(--text-primary)]">{item.source}</td>
                    <td className="table-cell"><div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full flex-shrink-0" style={{background:INCOME_CATEGORY_COLORS[item.category]??'#94a3b8'}}/><span className="text-sm text-[var(--text-secondary)]">{item.category}</span></div></td>
                    <td className="table-cell hidden md:table-cell">{item.is_recurring?<span className="badge" style={{background:'rgba(56,189,248,0.1)',color:'#38bdf8',border:'1px solid rgba(56,189,248,0.2)'}}><RefreshCw size={10}/> Recurring</span>:<span className="badge bg-white/5 text-[var(--text-muted)]">One-time</span>}</td>
                    <td className="table-cell hidden lg:table-cell text-sm text-[var(--text-muted)] max-w-xs truncate">{item.notes??'—'}</td>
                    <td className="table-cell"><div className="flex items-center gap-1 justify-end">
                      <button onClick={()=>setEditing(item)} className="btn-ghost p-1.5 hover:text-amber-400"><Pencil size={13}/></button>
                      <button onClick={()=>handleDelete(item.id)} disabled={deletingId===item.id} className="btn-ghost p-1.5 hover:text-rose-400"><Trash2 size={13}/></button>
                    </div></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {filtered.length>0&&(
          <div className="flex items-center justify-between px-4 py-3 border-t text-sm" style={{borderColor:'var(--border)'}}>
            <span className="text-[var(--text-muted)]">{filtered.length} entries</span>
            <span className="font-mono font-semibold" style={{color:'#10b981'}}>Total: +{formatCurrency(total)}</span>
          </div>
        )}
      </div>

      <div className="sm:hidden"><button onClick={handleExport} className="btn-secondary w-full"><Download size={14}/> Export CSV</button></div>

      {showAdd&&<AddIncomeModal userId={userId} onClose={()=>setShowAdd(false)} onSaved={handleAdded} knownSources={knownSources}/>}
      {editing&&<EditIncomeModal income={editing} userId={userId} onClose={()=>setEditing(null)} onSaved={handleUpdated}/>}
    </div>
  )
}
