// src/app/(dashboard)/dashboard/goals/new/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { GoalSchema, type GoalFormData } from '@/schemas'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function NewGoalPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<GoalFormData>({
    resolver: zodResolver(GoalSchema),
    defaultValues: { category: 'revenue', priority: 'medium', status: 'active', current_amount: 0 },
  })

  const onSubmit = async (data: GoalFormData) => {
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not authenticated'); setLoading(false); return }

    const { error: dbError } = await supabase.from('goals').insert({ ...data, user_id: user.id })
    if (dbError) { setError(dbError.message); setLoading(false); return }

    router.push('/dashboard/goals')
  }

  const inp = (err: boolean) => `w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border ${err ? 'border-red-500/50' : 'border-slate-700'} text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition-all`

  return (
    <div className="p-6 max-w-xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/dashboard/goals" className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-white">Create Goal</h1>
          <p className="text-sm text-slate-400">Set a new revenue or business goal</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {error && <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}

        <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">Goal Name *</label>
            <input {...register('name')} placeholder="Q1 Revenue Target" className={inp(!!errors.name)} />
            {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">Description</label>
            <textarea {...register('description')} rows={2} placeholder="Goal description..." className={inp(false) + ' resize-none'} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">Target Amount (₹) *</label>
              <input {...register('target_amount', { valueAsNumber: true })} type="number" min="0" placeholder="500000" className={inp(!!errors.target_amount)} />
              {errors.target_amount && <p className="text-xs text-red-400">{errors.target_amount.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">Target Date</label>
              <input {...register('target_date')} type="date" className={inp(false)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">Category</label>
              <select {...register('category')} className={inp(false)}>
                <option value="revenue">Revenue</option>
                <option value="clients">Clients</option>
                <option value="sales">Sales</option>
                <option value="profit">Profit</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">Priority</label>
              <select {...register('priority')} className={inp(false)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Link href="/dashboard/goals" className="px-5 py-2.5 text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors">Cancel</Link>
          <button type="submit" disabled={loading} className="px-5 py-2.5 text-sm font-medium text-white bg-purple-600 hover:bg-purple-500 rounded-xl transition-colors disabled:opacity-50">
            {loading ? 'Creating...' : 'Create Goal'}
          </button>
        </div>
      </form>
    </div>
  )
}
