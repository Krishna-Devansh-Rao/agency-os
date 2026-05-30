'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateTask, deleteTask } from '@/actions/projects'
import type { Task } from '@/types/database'

const PRIORITY_CONFIG: Record<string, { label: string; className: string }> = {
  low: { label: 'Low', className: 'text-slate-400 bg-slate-500/10' },
  medium: { label: 'Medium', className: 'text-blue-400 bg-blue-500/10' },
  high: { label: 'High', className: 'text-amber-400 bg-amber-500/10' },
  urgent: { label: 'Urgent', className: 'text-red-400 bg-red-500/10' },
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  todo: { label: 'To Do', className: 'text-slate-400 bg-slate-500/10 border-slate-500/20' },
  in_progress: { label: 'In Progress', className: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  review: { label: 'Review', className: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  completed: { label: 'Done', className: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
}

export function TasksListView({ tasks }: { tasks: Task[] }) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleToggleComplete = async (task: Task) => {
    const newStatus = task.status === 'completed' ? 'todo' : 'completed'
    await updateTask(task.id, { status: newStatus })
    router.refresh()
  }

  const handleDelete = async (taskId: string) => {
    if (!confirm('Delete this task?')) return
    setDeletingId(taskId)
    await deleteTask(taskId)
    setDeletingId(null)
    router.refresh()
  }

  return (
    <div className="rounded-xl border border-slate-700/50 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-800 bg-slate-900/60">
            <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider w-8"></th>
            <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Task</th>
            <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Priority</th>
            <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
            <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Due Date</th>
            <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60">
          {tasks.map(task => {
            const priority = PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG.medium
            const status = STATUS_CONFIG[task.status] ?? STATUS_CONFIG.todo
            const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed'
            const isCompleted = task.status === 'completed'

            return (
              <tr key={task.id} className={`group transition-colors ${isCompleted ? 'bg-slate-900/20' : 'bg-slate-900/30 hover:bg-slate-800/40'}`}>
                <td className="px-5 py-4 w-8">
                  <button
                    onClick={() => handleToggleComplete(task)}
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                      isCompleted
                        ? 'bg-emerald-500 border-emerald-500'
                        : 'border-slate-600 hover:border-purple-500'
                    }`}
                  >
                    {isCompleted && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                  </button>
                </td>
                <td className="px-5 py-4">
                  <p className={`text-sm font-medium ${isCompleted ? 'line-through text-slate-500' : 'text-white'}`}>
                    {task.title}
                  </p>
                  {task.description && (
                    <p className="text-xs text-slate-500 mt-0.5 truncate max-w-xs">{task.description}</p>
                  )}
                </td>
                <td className="px-5 py-4">
                  <span className={`text-xs px-2 py-0.5 rounded font-medium capitalize ${priority.className}`}>
                    {priority.label}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${status.className}`}>
                    {status.label}
                  </span>
                </td>
                <td className="px-5 py-4">
                  {task.due_date ? (
                    <span className={`text-sm ${isOverdue ? 'text-red-400 font-medium' : 'text-slate-400'}`}>
                      {new Date(task.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </span>
                  ) : <span className="text-slate-600 text-sm">—</span>}
                </td>
                <td className="px-5 py-4 text-right">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleDelete(task.id)}
                      disabled={deletingId === task.id}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50"
                    >
                      {deletingId === task.id ? (
                        <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                        </svg>
                      ) : (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
