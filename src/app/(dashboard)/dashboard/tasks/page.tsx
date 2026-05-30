// src/app/(dashboard)/dashboard/tasks/page.tsx
import { Suspense } from 'react'
import Link from 'next/link'
import { getTasks } from '@/actions/projects'
import { KanbanBoard } from '@/components/projects/kanban-board'
import { TasksListView } from '@/components/projects/tasks-list'

interface PageProps {
  searchParams: Promise<{ view?: string; priority?: string }>
}

export const dynamic = 'force-dynamic'

export default async function TasksPage({ searchParams }: PageProps) {
  const params = await searchParams
  const view = params.view ?? 'kanban'
  const tasks = await getTasks()

  const stats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'todo').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    review: tasks.filter(t => t.status === 'review').length,
    completed: tasks.filter(t => t.status === 'completed').length,
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Tasks</h1>
          <p className="text-sm text-slate-400 mt-1">
            {stats.total} total · {stats.in_progress} in progress · {stats.completed} completed
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex bg-slate-800 rounded-xl p-1 border border-slate-700">
            <Link
              href="?view=kanban"
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${view === 'kanban' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-300'}`}
            >
              Kanban
            </Link>
            <Link
              href="?view=list"
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${view === 'list' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-300'}`}
            >
              List
            </Link>
          </div>
          <Link
            href="/dashboard/tasks/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-purple-600/20"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New Task
          </Link>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'To Do', value: stats.todo, color: 'text-slate-400' },
          { label: 'In Progress', value: stats.in_progress, color: 'text-blue-400' },
          { label: 'Review', value: stats.review, color: 'text-amber-400' },
          { label: 'Completed', value: stats.completed, color: 'text-emerald-400' },
        ].map(s => (
          <div key={s.label} className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-3 text-center">
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Board/List */}
      {tasks.length === 0 ? (
        <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-16 text-center">
          <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.5">
              <polyline points="9 11 12 14 22 4"/>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
          </div>
          <p className="text-slate-400 font-medium">No tasks yet</p>
          <p className="text-slate-500 text-sm mt-1">Create your first task to get started</p>
          <Link href="/dashboard/tasks/new" className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-xl transition-colors">
            Create Task
          </Link>
        </div>
      ) : view === 'kanban' ? (
        <KanbanBoard tasks={tasks as any} />
      ) : (
        <TasksListView tasks={tasks as any} />
      )}
    </div>
  )
}
