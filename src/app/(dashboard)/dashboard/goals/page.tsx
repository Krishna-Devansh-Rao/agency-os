// src/app/(dashboard)/dashboard/goals/page.tsx
import { Suspense } from 'react'
import Link from 'next/link'
import { getGoalForecasts } from '@/actions/analytics'
import { GoalCard } from '@/components/goals/goal-card'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

async function GoalsGrid() {
  const forecasts = await getGoalForecasts()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Also fetch paused/achieved goals
  const { data: allGoals } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  const activeForecasts = forecasts
  const otherGoals = (allGoals ?? []).filter(g => g.status !== 'active')

  if (!allGoals?.length) {
    return (
      <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-16 text-center">
        <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
          </svg>
        </div>
        <p className="text-slate-400 font-medium">No goals yet</p>
        <p className="text-slate-500 text-sm mt-1">Create your first revenue goal to start tracking</p>
        <Link href="/dashboard/goals/new" className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-xl transition-colors">
          Create Goal
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Active goals with forecasts */}
      {activeForecasts.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Active Goals</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {activeForecasts.map(forecast => (
              <GoalCard key={forecast.goal.id} forecast={forecast} />
            ))}
          </div>
        </div>
      )}

      {/* Other goals */}
      {otherGoals.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Other Goals</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {otherGoals.map(goal => (
              <div key={goal.id} className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5 opacity-70">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-white font-medium">{goal.name}</p>
                    <p className="text-slate-400 text-sm mt-0.5">Target: ₹{Number(goal.target_amount).toLocaleString('en-IN')}</p>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${
                    goal.status === 'achieved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    goal.status === 'paused' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                    'bg-slate-500/10 text-slate-400 border-slate-500/20'
                  }`}>
                    {goal.status}
                  </span>
                </div>
                <div className="flex gap-2 mt-4">
                  <Link href={`/dashboard/goals/${goal.id}/edit`} className="text-xs text-slate-400 hover:text-slate-300 px-3 py-1.5 bg-slate-800 rounded-lg transition-colors">Edit</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default async function GoalsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Goals</h1>
          <p className="text-sm text-slate-400 mt-1">Track and forecast your revenue goals</p>
        </div>
        <Link
          href="/dashboard/goals/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-purple-600/20"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New Goal
        </Link>
      </div>
      <Suspense fallback={<div className="grid grid-cols-1 lg:grid-cols-2 gap-5">{Array(2).fill(0).map((_,i)=><div key={i} className="h-64 rounded-xl bg-slate-800/50 animate-pulse"/>)}</div>}>
        <GoalsGrid />
      </Suspense>
    </div>
  )
}
