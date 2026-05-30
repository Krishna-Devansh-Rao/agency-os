'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { updateTask, updateTasksOrder, deleteTask } from '@/actions/projects'
import type { Task } from '@/types/database'

type TaskStatus = 'todo' | 'in_progress' | 'review' | 'completed'

const COLUMNS: { id: TaskStatus; label: string; color: string; bg: string }[] = [
  { id: 'todo', label: 'To Do', color: 'text-slate-400', bg: 'bg-slate-500/10 border-slate-500/20' },
  { id: 'in_progress', label: 'In Progress', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  { id: 'review', label: 'Review', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  { id: 'completed', label: 'Completed', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
]

const PRIORITY_COLORS: Record<string, string> = {
  low: 'text-slate-500 bg-slate-500/10',
  medium: 'text-blue-400 bg-blue-500/10',
  high: 'text-amber-400 bg-amber-500/10',
  urgent: 'text-red-400 bg-red-500/10',
}

interface KanbanBoardProps {
  tasks: Task[]
  onAddTask?: (status: TaskStatus) => void
}

export function KanbanBoard({ tasks, onAddTask }: KanbanBoardProps) {
  const router = useRouter()
  const [localTasks, setLocalTasks] = useState(tasks)
  const [dragging, setDragging] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState<{ column: TaskStatus; index: number } | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const tasksByStatus = (status: TaskStatus) =>
    localTasks.filter(t => t.status === status).sort((a, b) => a.sort_order - b.sort_order)

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDragging(taskId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', taskId)
  }

  const handleDragEnd = () => {
    setDragging(null)
    setDragOver(null)
  }

  const handleDrop = async (e: React.DragEvent, targetStatus: TaskStatus, targetIndex: number) => {
    e.preventDefault()
    const taskId = e.dataTransfer.getData('text/plain')
    if (!taskId) return

    const task = localTasks.find(t => t.id === taskId)
    if (!task) return

    // Optimistic update
    const updated = localTasks
      .filter(t => t.id !== taskId)
      .map(t => {
        if (t.status === targetStatus && t.sort_order >= targetIndex) {
          return { ...t, sort_order: t.sort_order + 1 }
        }
        return t
      })
    updated.push({ ...task, status: targetStatus, sort_order: targetIndex })
    setLocalTasks(updated)

    // Persist to DB
    const columnTasks = updated
      .filter(t => t.status === targetStatus)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((t, i) => ({ id: t.id, status: targetStatus, sort_order: i }))

    await updateTasksOrder(columnTasks)
    setDragOver(null)
    setDragging(null)
  }

  const handleDragOver = (e: React.DragEvent, column: TaskStatus, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOver({ column, index })
  }

  const handleDelete = async (taskId: string) => {
    if (!confirm('Delete this task?')) return
    setDeletingId(taskId)
    setLocalTasks(prev => prev.filter(t => t.id !== taskId))
    await deleteTask(taskId)
    setDeletingId(null)
    router.refresh()
  }

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    setLocalTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t))
    await updateTask(taskId, { status: newStatus })
    router.refresh()
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {COLUMNS.map(col => {
        const colTasks = tasksByStatus(col.id)
        return (
          <div key={col.id} className="flex flex-col min-h-[400px]">
            {/* Column header */}
            <div className={`flex items-center justify-between px-3 py-2 rounded-t-xl border ${col.bg} mb-0`}>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold uppercase tracking-wider ${col.color}`}>{col.label}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${col.bg} ${col.color}`}>{colTasks.length}</span>
              </div>
              {onAddTask && (
                <button
                  onClick={() => onAddTask(col.id)}
                  className={`text-xs ${col.color} hover:opacity-80 transition-opacity p-1`}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                </button>
              )}
            </div>

            {/* Drop zone */}
            <div
              className="flex-1 bg-slate-900/40 rounded-b-xl border border-t-0 border-slate-800 p-2 space-y-2 min-h-[100px]"
              onDragOver={e => handleDragOver(e, col.id, colTasks.length)}
              onDrop={e => handleDrop(e, col.id, colTasks.length)}
            >
              {colTasks.map((task, index) => (
                <div key={task.id}>
                  {/* Drop indicator */}
                  {dragOver?.column === col.id && dragOver.index === index && dragging !== task.id && (
                    <div className="h-1 bg-purple-500 rounded-full mb-2 mx-1" />
                  )}

                  {/* Task card */}
                  <div
                    draggable
                    onDragStart={e => handleDragStart(e, task.id)}
                    onDragEnd={handleDragEnd}
                    onDragOver={e => handleDragOver(e, col.id, index)}
                    onDrop={e => handleDrop(e, col.id, index)}
                    className={`group bg-slate-900 border border-slate-700/60 rounded-xl p-3 cursor-grab active:cursor-grabbing transition-all hover:border-slate-600 hover:shadow-lg hover:shadow-black/20 ${
                      dragging === task.id ? 'opacity-40 scale-95' : ''
                    }`}
                  >
                    {/* Priority badge */}
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium capitalize ${PRIORITY_COLORS[task.priority] ?? PRIORITY_COLORS.medium}`}>
                        {task.priority}
                      </span>
                      <button
                        onClick={() => handleDelete(task.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 transition-all"
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    </div>

                    {/* Title */}
                    <p className="text-white text-sm font-medium leading-snug">{task.title}</p>

                    {/* Description */}
                    {task.description && (
                      <p className="text-slate-500 text-xs mt-1 line-clamp-2">{task.description}</p>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800">
                      {task.due_date ? (
                        <span className={`text-xs ${new Date(task.due_date) < new Date() ? 'text-red-400' : 'text-slate-500'}`}>
                          {new Date(task.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </span>
                      ) : <span />}

                      {/* Quick status change */}
                      <select
                        value={task.status}
                        onChange={e => handleStatusChange(task.id, e.target.value as TaskStatus)}
                        onClick={e => e.stopPropagation()}
                        className="text-xs bg-slate-800 border-none text-slate-400 rounded-lg py-0.5 px-1 focus:outline-none focus:ring-1 focus:ring-purple-500/40 cursor-pointer"
                      >
                        {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              ))}

              {/* Empty drop indicator */}
              {dragOver?.column === col.id && colTasks.length === 0 && (
                <div className="h-1 bg-purple-500 rounded-full mx-1" />
              )}

              {/* Empty state */}
              {colTasks.length === 0 && !dragOver && (
                <div className="flex items-center justify-center h-20 text-slate-600 text-xs">
                  Drop tasks here
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
