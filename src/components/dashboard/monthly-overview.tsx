'use client'

// ─── MONTHLY OVERVIEW CARD ────────────────────────────────────

interface MonthlyData {
  thisMonthRevenue: number
  thisMonthPending: number
  thisMonthNewClients: number
  thisMonthRenewals: number
  thisMonthPaymentsReceived: number
}

export function MonthlyOverviewCard({ data }: { data: MonthlyData }) {
  const month = new Date().toLocaleString('default', { month: 'long', year: 'numeric' })

  const metrics = [
    { label: 'Revenue This Month', value: `₹${data.thisMonthRevenue.toLocaleString('en-IN')}`, color: 'text-emerald-400', icon: '📈' },
    { label: 'Payments Received', value: `₹${data.thisMonthPaymentsReceived.toLocaleString('en-IN')}`, color: 'text-blue-400', icon: '✅' },
    { label: 'Pending This Month', value: `₹${data.thisMonthPending.toLocaleString('en-IN')}`, color: 'text-amber-400', icon: '⏳' },
    { label: 'New Clients', value: String(data.thisMonthNewClients), color: 'text-purple-400', icon: '👥' },
    { label: 'Renewals', value: String(data.thisMonthRenewals), color: 'text-cyan-400', icon: '🔄' },
  ]

  return (
    <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-white font-semibold">Monthly Business Overview</h3>
          <p className="text-xs text-slate-400 mt-0.5">{month}</p>
        </div>
        <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {metrics.map(m => (
          <div key={m.label} className="bg-slate-800/60 rounded-xl p-3 text-center">
            <div className="text-xl mb-1">{m.icon}</div>
            <p className={`text-base font-bold ${m.color}`}>{m.value}</p>
            <p className="text-xs text-slate-500 mt-0.5 leading-tight">{m.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── EXPIRING CLIENTS WIDGET ──────────────────────────────────

interface ExpiringService {
  id: string
  service_name: string
  renewal_date: string
  monthly_fee: number
  clients: {
    id: string
    name: string
    company_name: string
    phone: string
  }
}

export function ExpiringClientsWidget({
  expiring7Days,
  expiring30Days,
}: {
  expiring7Days: any[]
  expiring30Days: any[]
}) {
  if (expiring30Days.length === 0) return null

  function getDays(date: string) {
    return Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  }

  return (
    <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-white font-semibold">Service Renewals</h3>
          <p className="text-xs text-slate-400 mt-0.5">Clients with upcoming renewals</p>
        </div>
        <div className="flex gap-2">
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
            {expiring7Days.length} this week
          </span>
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
            {expiring30Days.length} this month
          </span>
        </div>
      </div>

      <div className="space-y-2">
        {expiring30Days.slice(0, 8).map((s: any) => {
          const days = getDays(s.renewal_date)
          const isUrgent = days <= 7
          return (
            <div key={s.id} className={`flex items-center justify-between p-3 rounded-lg ${isUrgent ? 'bg-red-500/5 border border-red-500/10' : 'bg-slate-800/40'}`}>
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isUrgent ? 'bg-red-400' : 'bg-amber-400'}`} />
                <div className="min-w-0">
                  <p className="text-white text-sm font-medium truncate">{s.clients?.name}</p>
                  <p className="text-slate-400 text-xs truncate">{s.service_name}</p>
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-3">
                <p className={`text-sm font-semibold ${isUrgent ? 'text-red-400' : 'text-amber-400'}`}>
                  {days === 0 ? 'Today' : days === 1 ? '1 day' : `${days} days`}
                </p>
                <p className="text-xs text-slate-500">{new Date(s.renewal_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</p>
              </div>
            </div>
          )
        })}

        {expiring30Days.length > 8 && (
          <p className="text-xs text-slate-500 text-center pt-1">+{expiring30Days.length - 8} more renewals this month</p>
        )}
      </div>
    </div>
  )
}
