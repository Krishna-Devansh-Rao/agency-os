// src/app/(dashboard)/dashboard/tasks/new/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createTask } from '@/actions/projects'
import { TaskSchema, type TaskFormData } from '@/schemas'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function NewTaskPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedProjectId = searchParams.get('project_id')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([])
  const [clients, setClients] = useState<{ id: string; name: string }[]>([])

  const { register, handleSubmit, formState: { errors } } = useForm<TaskFormData>({
    resolver: zodResolver(TaskSchema),
    defaultValues: {
      project_id: preselectedProjectId ?? null,
      status: 'todo',
      priority: 'medium',
    },
  })

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const [{ data: p }, { data: c }] = await Promise.all([
        supabase.from('projects').select('id, name').in('status', ['planning', 'in_progress', 'review']).order('name'),
        supabase.from('clients').select('id, name').eq('status', 'active').order('name'),
      ])
      setProjects(p ?? [])
      setClients(c ?? [])
    }
    load()
  }, [])

  const onSubmit = async (data: TaskFormData) => {
    setLoading(true)
    setError(null)
    const result = await createTask(data)
    if (!result.success) { setError(result.error); setLoading(false); return }
    router.push('/dashboard/tasks')
  }

  const inp = `w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition-all`

  return (
    <div className="p-6 max-w-xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/dashboard/tasks" className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-white">New Task</h1>
          <p className="text-sm text-slate-400">Add a task to your board</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {error && <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}

        <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">Task Title *</label>
            <input {...register('title')} placeholder="What needs to be done?" className={inp} />
            {errors.title && <p className="text-xs text-red-400">{errors.title.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">Description</label>
            <textarea {...register('description')} rows={3} placeholder="Additional details..." className={inp + ' resize-none'} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">Priority</label>
              <select {...register('priority')} className={inp}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">Status</label>
              <select {...register('status')} className={inp}>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="review">Review</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">Project</label>
              <select {...register('project_id')} className={inp}>
                <option value="">No project</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">Client</label>
              <select {...register('client_id')} className={inp}>
                <option value="">No client</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">Due Date</label>
            <input {...register('due_date')} type="date" className={inp} />
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Link href="/dashboard/tasks" className="px-5 py-2.5 text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors">Cancel</Link>
          <button type="submit" disabled={loading} className="px-5 py-2.5 text-sm font-medium text-white bg-purple-600 hover:bg-purple-500 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2">
            {loading && <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
            {loading ? 'Creating...' : 'Create Task'}
          </button>
        </div>
      </form>
    </div>
  )
}
