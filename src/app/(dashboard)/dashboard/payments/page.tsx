// src/app/(dashboard)/dashboard/payments/page.tsx
import Link from 'next/link'
import { getPayments } from '@/actions/payments'
import { PaymentsTable } from '@/components/payments/payments-table'

interface PageProps {
  searchParams: Promise<{ status?: string; page?: string }>
}

export const dynamic = 'force-dynamic'

const STATUSES = ['all', 'paid', 'pending', 'overdue', 'refunded']

export default async function PaymentsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = Number(params.page ?? 1)
  const status = params.status && params.status !== 'all' ? params.status : undefined

  const { payments, total } = await getPayments({ status, page, limit: 25 })

  const totalAmount = payments.reduce((s: number, p: any) => s + Number(p.amount), 0)
  const paidAmount = payments.filter((p: any) => p.status === 'paid').reduce((s: number, p: any) => s + Number(p.amount), 0)
  const pendingAmount = payments.filter((p: any) => ['pending', 'overdue'].includes(p.status)).reduce((s: number, p: any) => s + Number(p.amount), 0)

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Payments</h1>
          <p className="text-sm text-slate-400 mt-1">{total} records</p>
        </div>
        <Link
          href="/dashboard/payments/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-purple-600/20"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Record Payment
        </Link>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total', value: totalAmount, color: 'text-white' },
          { label: 'Received', value: paidAmount, color: 'text-emerald-400' },
          { label: 'Pending', value: pendingAmount, color: 'text-amber-400' },
        ].map(s => (
          <div key={s.label} className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4">
            <p className="text-xs text-slate-400 uppercase tracking-wider">{s.label}</p>
            <p className={`text-lg font-bold mt-1 ${s.color}`}>₹{s.value.toLocaleString('en-IN')}</p>
          </div>
        ))}
      </div>

      {/* Status filters */}
      <div className="flex gap-2 flex-wrap">
        {STATUSES.map(s => (
          <Link
            key={s}
            href={s === 'all' ? '/dashboard/payments' : `?status=${s}`}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-all ${
              (params.status === s || (!params.status && s === 'all'))
                ? 'bg-purple-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-slate-300 hover:bg-slate-700'
            }`}
          >
            {s}
          </Link>
        ))}
      </div>

      <PaymentsTable payments={payments} />
    </div>
  )
}
