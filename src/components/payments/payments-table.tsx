'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deletePayment } from '@/actions/payments'
import Link from 'next/link'

const STATUS_CONFIG = {
  paid: { label: 'Paid', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  pending: { label: 'Pending', className: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  overdue: { label: 'Overdue', className: 'bg-red-500/10 text-red-400 border-red-500/20' },
  refunded: { label: 'Refunded', className: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
}

const METHOD_LABELS: Record<string, string> = {
  cash: 'Cash',
  bank_transfer: 'Bank Transfer',
  upi: 'UPI',
  cheque: 'Cheque',
  card: 'Card',
  other: 'Other',
}

export function PaymentsTable({ payments }: { payments: any[] }) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this payment record?')) return
    setDeletingId(id)
    await deletePayment(id)
    setDeletingId(null)
    router.refresh()
  }

  if (payments.length === 0) {
    return (
      <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-16 text-center">
        <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.5">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
            <line x1="1" y1="10" x2="23" y2="10"/>
          </svg>
        </div>
        <p className="text-slate-400 font-medium">No payments found</p>
        <p className="text-slate-500 text-sm mt-1">Record your first payment</p>
        <Link href="/dashboard/payments/new" className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-xl transition-colors">
          Record Payment
        </Link>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-slate-700/50 overflow-hidden">
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/60">
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Client</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Date</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Method</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Invoice #</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
              <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Amount</th>
              <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {payments.map((p: any) => {
              const st = STATUS_CONFIG[p.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending
              return (
                <tr key={p.id} className="bg-slate-900/30 hover:bg-slate-800/40 transition-colors group">
                  <td className="px-5 py-4">
                    <p className="text-white text-sm font-medium">{p.clients?.name}</p>
                    {p.clients?.company_name && <p className="text-slate-500 text-xs">{p.clients.company_name}</p>}
                  </td>
                  <td className="px-5 py-4 text-slate-300 text-sm">
                    {new Date(p.payment_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-4 text-slate-400 text-sm">
                    {METHOD_LABELS[p.payment_method] ?? p.payment_method}
                  </td>
                  <td className="px-5 py-4 text-slate-400 text-xs font-mono">
                    {p.invoice_number || '—'}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${st.className}`}>
                      {st.label}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className={`text-sm font-semibold ${p.status === 'paid' ? 'text-white' : p.status === 'overdue' ? 'text-red-400' : 'text-amber-400'}`}>
                      ₹{Number(p.amount).toLocaleString('en-IN')}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link
                        href={`/dashboard/payments/${p.id}/edit`}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
                        title="Edit"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </Link>
                      <button
                        onClick={() => handleDelete(p.id)}
                        disabled={deletingId === p.id}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50"
                        title="Delete"
                      >
                        {deletingId === p.id ? (
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

      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-slate-800">
        {payments.map((p: any) => {
          const st = STATUS_CONFIG[p.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending
          return (
            <div key={p.id} className="p-4 bg-slate-900/30">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-white font-medium text-sm">{p.clients?.name}</p>
                  <p className="text-slate-500 text-xs mt-0.5">
                    {new Date(p.payment_date).toLocaleDateString('en-IN')} · {METHOD_LABELS[p.payment_method]}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-white font-bold text-sm">₹{Number(p.amount).toLocaleString('en-IN')}</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border mt-1 ${st.className}`}>{st.label}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
