'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface KPICardProps {
  title: string
  value: number
  format: 'number' | 'currency' | 'percentage'
  icon: string
  color: string
  positive?: boolean
}

const colorMap: Record<string, { bg: string; text: string; icon: string }> = {
  blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', icon: 'border-blue-500/30' },
  green: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', icon: 'border-emerald-500/30' },
  purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', icon: 'border-purple-500/30' },
  teal: { bg: 'bg-teal-500/10', text: 'text-teal-400', icon: 'border-teal-500/30' },
  indigo: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', icon: 'border-indigo-500/30' },
  amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', icon: 'border-amber-500/30' },
  cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', icon: 'border-cyan-500/30' },
  orange: { bg: 'bg-orange-500/10', text: 'text-orange-400', icon: 'border-orange-500/30' },
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', icon: 'border-emerald-500/30' },
  violet: { bg: 'bg-violet-500/10', text: 'text-violet-400', icon: 'border-violet-500/30' },
  rose: { bg: 'bg-rose-500/10', text: 'text-rose-400', icon: 'border-rose-500/30' },
  red: { bg: 'bg-red-500/10', text: 'text-red-400', icon: 'border-red-500/30' },
}

function formatValue(value: number, format: KPICardProps['format']): string {
  switch (format) {
    case 'currency':
      if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`
      if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`
      if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`
      return `₹${value.toFixed(0)}`
    case 'percentage':
      return `${value.toFixed(1)}%`
    case 'number':
      if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
      return String(Math.round(value))
  }
}

// Animated counter hook
function useCountUp(target: number, duration = 1200) {
  const ref = useRef<HTMLSpanElement>(null)
  const frameRef = useRef<number>()
  const startRef = useRef<number>()
  const startValueRef = useRef(0)

  useEffect(() => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current)
    startRef.current = undefined

    const animate = (timestamp: number) => {
      if (!startRef.current) startRef.current = timestamp
      const elapsed = timestamp - startRef.current
      const progress = Math.min(elapsed / duration, 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = startValueRef.current + (target - startValueRef.current) * eased

      if (ref.current) ref.current.dataset.value = String(current)

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate)
      } else {
        startValueRef.current = target
      }
    }

    frameRef.current = requestAnimationFrame(animate)
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current) }
  }, [target, duration])

  return ref
}

const ICON_PATHS: Record<string, string> = {
  users: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  'user-check': 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm6 4l2 2 4-4',
  'currency-rupee': 'M6 3h12M6 8h12M6 13l8.5 8L18 13H6',
  'trending-up': 'M23 6l-9.5 9.5-5-5L1 18M17 6h6v6',
  'chart-bar': 'M18 20V10M12 20V4M6 20v-6',
  clock: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 6v6l4 2',
  briefcase: 'M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zM16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2',
  refresh: 'M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15',
  'piggy-bank': 'M19 5c-1.5 0-2.8 1.4-3 2h-1l-1 2H8L7 7H6c-.2-.6-1.5-2-3-2a3 3 0 0 0 0 6h.5L5 20h14l1.5-9H21a3 3 0 0 0 0-6z',
  rocket: 'M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09zM12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2zM9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5',
  star: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  receipt: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8',
}

export function KPICard({ title, value, format, icon, color, positive }: KPICardProps) {
  const colors = colorMap[color] ?? colorMap.blue
  const formattedValue = formatValue(value, format)
  const iconPath = ICON_PATHS[icon]

  return (
    <div className={cn(
      'relative overflow-hidden rounded-xl border border-slate-700/50 bg-slate-900/80 p-5',
      'backdrop-blur-sm transition-all duration-300',
      'hover:border-slate-600 hover:shadow-lg hover:shadow-black/20',
      'group'
    )}>
      {/* Background gradient */}
      <div className={cn('absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300', colors.bg)} />

      {/* Icon */}
      <div className={cn('inline-flex items-center justify-center w-9 h-9 rounded-lg border mb-3', colors.bg, colors.icon)}>
        {iconPath && (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={colors.text}>
            <path d={iconPath} />
          </svg>
        )}
      </div>

      {/* Value */}
      <div className={cn('text-2xl font-bold tracking-tight mb-1', positive === false ? 'text-red-400' : 'text-white')}>
        {formattedValue}
      </div>

      {/* Title */}
      <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">{title}</div>

      {/* Bottom accent */}
      <div className={cn('absolute bottom-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity', colors.text.replace('text-', 'bg-'))} />
    </div>
  )
}

export function KPICardSkeleton() {
  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-900/80 p-5 animate-pulse">
      <div className="w-9 h-9 rounded-lg bg-slate-700 mb-3" />
      <div className="h-7 bg-slate-700 rounded w-24 mb-2" />
      <div className="h-3 bg-slate-800 rounded w-20" />
    </div>
  )
}
