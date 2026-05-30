'use client'

import Link from 'next/link'
import type { GoalForecast } from '@/types/database'

const PRIORITY_COLORS = {
  low: 'text-slate-400',
  medium: 'text-blue-400',
  high: 'text-amber-400',
  urgent: 'text-red-400',
}

const CATEGORY_ICONS: Record<string, string> = {
  revenue: 'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
  clients: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  sales: 'M16 8h6m-6 4h6m-6 4h6M2 8h4m-4 4h4m-4 4h4M10 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4',
  profit: 'M18 20V10M12 20V4M6 20v-6',
  custom: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
}

export function GoalCard({ forecast }: { forecast: GoalForecast }) {
  const { goal, current_revenue, remaining_revenue, average_daily_revenue, estimated_days, estimated_completion_date, progress_percentage } = forecast

  const daysToTarget = goal.target_date
    ? Math.ceil((new Date(goal.target_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  const isAchieved = progress_percentage >= 100
  const isLate = daysToTarget !== null && daysToTarget < 0

  // Circular progress
  const radius = 36
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (progress_percentage / 100) * circumference

  return (
    <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5 hover:border-slate-600 transition-all">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {/* Circular progress */}
          <div className="relative flex-shrink-0">
            <svg width="88" height="88" className="-rotate-90">
              <circle cx="44" cy="44" r={radius} fill="none" stroke="#1e293b" strokeWidth="6"/>
              <circle
                cx="44" cy="44" r={radius}
                fill="none"
                stroke={isAchieved ? '#10b981' : '#7c3aed'}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-sm font-bold text-white">{Math.round(progress_percentage)}%</span>
            </div>
          </div>

          <div className="pt-1">
            <h3 className="text-white font-semibold text-sm leading-tight">{goal.name}</h3>
            <p className={`text-xs font-medium mt-0.5 capitalize ${PRIORITY_COLORS[goal.priority]}`}>
              {goal.priority} priority
            </p>
            <p className="text-xs text-slate-500 mt-1 capitalize">{goal.category}</p>
          </div>
        </div>

        <div className="flex gap-2 flex-shrink-0">
          <Link href={`/dashboard/goals/${goal.id}/edit`} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-all">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </Link>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-4">
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-slate-400">₹{current_revenue.toLocaleString('en-IN')}</span>
          <span className="text-slate-400">₹{Number(goal.target_amount).toLocaleString('en-IN')}</span>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${isAchieved ? 'bg-emerald-500' : 'bg-gradient-to-r from-purple-600 to-violet-500'}`}
            style={{ width: `${Math.min(100, progress_percentage)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs mt-1">
          <span className="text-slate-500">
            ₹{remaining_revenue.toLocaleString('en-IN')} remaining
          </span>
          {goal.target_date && (
            <span className={`font-medium ${isLate ? 'text-red-400' : daysToTarget !== null && daysToTarget <= 7 ? 'text-amber-400' : 'text-slate-400'}`}>
              {daysToTarget !== null ? (isLate ? `${Math.abs(daysToTarget)}d overdue` : `${daysToTarget}d to deadline`) : ''}
            </span>
          )}
        </div>
      </div>

      {/* Forecast Engine */}
      <div className="mt-4 pt-4 border-t border-slate-800">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Forecast Engine</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-800/60 rounded-lg p-3">
            <p className="text-xs text-slate-500">Avg Daily Revenue</p>
            <p className="text-sm font-bold text-white mt-0.5">
              ₹{Math.round(average_daily_revenue).toLocaleString('en-IN')}
            </p>
          </div>
          <div className="bg-slate-800/60 rounded-lg p-3">
            <p className="text-xs text-slate-500">Est. Days to Goal</p>
            <p className="text-sm font-bold text-white mt-0.5">
              {isAchieved ? '✓ Achieved!' : estimated_days > 0 ? `~${estimated_days} days` : '—'}
            </p>
          </div>
          {estimated_completion_date && !isAchieved && (
            <div className="col-span-2 bg-purple-600/10 border border-purple-500/20 rounded-lg p-3">
              <p className="text-xs text-slate-400">Estimated Completion</p>
              <p className="text-sm font-bold text-purple-300 mt-0.5">
                {estimated_completion_date.toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
          )}
          {isAchieved && (
            <div className="col-span-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-center">
              <p className="text-emerald-400 font-semibold text-sm">🎉 Goal Achieved!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
