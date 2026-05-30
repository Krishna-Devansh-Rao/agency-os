'use client'

import { useEffect, useState, useCallback } from 'react'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

let toastCallbacks: ((toast: Toast) => void)[] = []

export function toast(message: string, type: Toast['type'] = 'info') {
  const id = Math.random().toString(36).slice(2)
  toastCallbacks.forEach(cb => cb({ id, message, type }))
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((t: Toast) => {
    setToasts(prev => [...prev, t])
    setTimeout(() => {
      setToasts(prev => prev.filter(x => x.id !== t.id))
    }, 4000)
  }, [])

  useEffect(() => {
    toastCallbacks.push(addToast)
    return () => {
      toastCallbacks = toastCallbacks.filter(cb => cb !== addToast)
    }
  }, [addToast])

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`
            flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl backdrop-blur-sm
            border pointer-events-auto max-w-sm animate-in slide-in-from-right-5
            ${t.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-700/50 text-emerald-300'
              : t.type === 'error'
              ? 'bg-red-950/90 border-red-700/50 text-red-300'
              : 'bg-slate-900/90 border-slate-700/50 text-slate-200'
            }
          `}
        >
          {t.type === 'success' && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="flex-shrink-0">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          )}
          {t.type === 'error' && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="flex-shrink-0">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          )}
          <p className="text-sm font-medium">{t.message}</p>
          <button
            onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
            className="ml-auto opacity-60 hover:opacity-100 transition-opacity flex-shrink-0"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      ))}
    </div>
  )
}
