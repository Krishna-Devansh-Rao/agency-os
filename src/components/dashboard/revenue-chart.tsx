'use client'

import { useState } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { cn } from '@/lib/utils'

// ============================================================
// REVENUE TREND CHART
// ============================================================
interface RevenueChartProps {
  data: { period: string; revenue: number }[]
}

const FILTERS = ['daily', 'weekly', 'monthly', 'yearly'] as const

export function RevenueChart({ data }: RevenueChartProps) {
  const [filter, setFilter] = useState<typeof FILTERS[number]>('monthly')

  const formatRevenue = (val: number) => {
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`
    if (val >= 1000) return `₹${(val / 1000).toFixed(0)}K`
    return `₹${val}`
  }

  const formatPeriodLabel = (period: string) => {
    if (/^\d{4}-\d{2}$/.test(period)) {
      const [y, m] = period.split('-')
      return new Date(Number(y), Number(m) - 1).toLocaleString('default', { month: 'short', year: '2-digit' })
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(period)) {
      return new Date(period).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
    }
    return period
  }

  const chartData = data.map(d => ({
    ...d,
    label: formatPeriodLabel(d.period),
  }))

  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-900/80 p-5">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-white font-semibold">Revenue Trend</h3>
          <p className="text-xs text-slate-400 mt-0.5">Payments received over time</p>
        </div>
        <div className="flex gap-1">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-3 py-1 text-xs font-medium rounded-lg capitalize transition-all',
                filter === f
                  ? 'bg-purple-600 text-white'
                  : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800'
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-slate-500 text-sm">
          No revenue data yet
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={256}>
          <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="label"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              axisLine={{ stroke: '#334155' }}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatRevenue}
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={60}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                border: '1px solid #334155',
                borderRadius: 8,
                color: '#e2e8f0',
              }}
              formatter={(val: number) => [`₹${val.toLocaleString('en-IN')}`, 'Revenue']}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#7c3aed"
              strokeWidth={2}
              fill="url(#revenueGradient)"
              dot={{ fill: '#7c3aed', r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: '#a855f7' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

// ============================================================
// REVENUE DONUT CHART
// ============================================================
const SOURCE_COLORS = {
  meta_ads: '#4f46e5',
  google_ads: '#06b6d4',
  website_dev: '#7c3aed',
  one_time: '#f59e0b',
  consulting: '#10b981',
  other: '#64748b',
}

interface RevenueDonutProps {
  data: { source: string; label: string; amount: number }[]
}

export function RevenueDonut({ data }: RevenueDonutProps) {
  const total = data.reduce((sum, d) => sum + d.amount, 0)

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null
    const { label, amount } = payload[0].payload
    const pct = total > 0 ? ((amount / total) * 100).toFixed(1) : '0'
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm">
        <p className="text-white font-medium">{label}</p>
        <p className="text-purple-400">₹{amount.toLocaleString('en-IN')}</p>
        <p className="text-slate-400">{pct}%</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-900/80 p-5 h-full">
      <div className="mb-4">
        <h3 className="text-white font-semibold">Revenue by Source</h3>
        <p className="text-xs text-slate-400 mt-0.5">Breakdown by channel</p>
      </div>

      {data.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-slate-500 text-sm">
          No revenue entries yet
        </div>
      ) : (
        <>
          <div className="relative">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="amount"
                >
                  {data.map(entry => (
                    <Cell
                      key={entry.source}
                      fill={SOURCE_COLORS[entry.source as keyof typeof SOURCE_COLORS] ?? SOURCE_COLORS.other}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center total */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xs text-slate-400">Total</span>
              <span className="text-sm font-bold text-white">
                ₹{total >= 100000 ? `${(total / 100000).toFixed(1)}L` : total.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-2 mt-3">
            {data.map(entry => {
              const pct = total > 0 ? ((entry.amount / total) * 100).toFixed(1) : '0'
              const color = SOURCE_COLORS[entry.source as keyof typeof SOURCE_COLORS] ?? SOURCE_COLORS.other
              return (
                <div key={entry.source} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                    <span className="text-xs text-slate-300">{entry.label}</span>
                  </div>
                  <span className="text-xs text-slate-400">{pct}%</span>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
