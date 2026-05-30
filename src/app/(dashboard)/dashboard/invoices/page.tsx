// src/app/(dashboard)/dashboard/invoices/page.tsx
import { Suspense } from 'react'
import Link from 'next/link'
import { getInvoices } from '@/actions/invoices'

interface PageProps {
  searchParams: Promise<{ status?: string; search?: string; page?: string }>
}

export const dynamic = 'force-dynamic'

const STATUS_CONFIG = {
  draft: { label: 'Draft', className: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
  sent: { label: 'Sent', className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  paid: { label: 'Paid', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  overdue: { label: 'Overdue', className: 'bg-red-500/10 text-red-400 border-red-500/20' },
  cancelled: { label: 'Cancelled', className: 'bg-slate-600/10 text-slate-500 border-slate-600/20' },
}

const STATUS_FILTERS = ['all', 'draft', 'sent', 'paid', 'overdue', 'cancelled']

export default async function InvoicesPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = Number(params.page ?? 1)
  const status = params.status && params.status !== 'all' ? params.status : undefined

  const { invoices, total } = await getInvoices({ status, search: params.search, page, limit: 20 })
  const totalPages = Math.ceil(total / 20)

  // Calculate summary stats
  const totalAmount = invoices.reduce((s: number, i: any) => s + Number(i.total), 0)
  const paidAmount = invoices.filter((i: any) => i.status === 'paid').reduce((s: number, i: any) => s + Number(i.total), 0)
  const pendingAmount = invoices.filter((i: any) => ['sent', 'overdue'].includes(i.status)).reduce((s: number, i: any) => s + Number(i.total), 0)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Invoices</h1>
          <p className="text-sm text-slate-400 mt-1">{total} invoice{total !== 1 ? 's' : ''}</p>
        </div>
        <Link
          href="/dashboard/invoices/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-purple-600/20"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New Invoice
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total', value: totalAmount, color: 'text-white' },
          { label: 'Paid', value: paidAmount, color: 'text-emerald-400' },
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
        {STATUS_FILTERS.map(s => (
          <Link
            key={s}
            href={s === 'all' ? '/dashboard/invoices' : `?status=${s}`}
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

      {/* Table */}
      {invoices.length === 0 ? (
        <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-16 text-center">
          <p className="text-slate-400 font-medium">No invoices found</p>
          <p className="text-slate-500 text-sm mt-1">Create your first invoice to get started</p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-700/50 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Invoice #</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Client</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Issue Date</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Due Date</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Amount</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {invoices.map((inv: any) => {
                const st = STATUS_CONFIG[inv.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.draft
                const isOverdue = inv.due_date && new Date(inv.due_date) < new Date() && inv.status !== 'paid'
                return (
                  <tr key={inv.id} className="bg-slate-900/30 hover:bg-slate-800/40 transition-colors group">
                    <td className="px-5 py-4">
                      <Link href={`/dashboard/invoices/${inv.id}`} className="text-purple-400 hover:text-purple-300 text-sm font-mono font-medium">
                        {inv.invoice_number}
                      </Link>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-white text-sm">{inv.clients?.name}</p>
                      {inv.clients?.company_name && <p className="text-slate-500 text-xs">{inv.clients.company_name}</p>}
                    </td>
                    <td className="px-5 py-4 text-slate-300 text-sm">
                      {new Date(inv.issue_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-4">
                      {inv.due_date ? (
                        <span className={`text-sm ${isOverdue ? 'text-red-400 font-medium' : 'text-slate-300'}`}>
                          {new Date(inv.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      ) : <span className="text-slate-500 text-sm">—</span>}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${st.className}`}>
                        {st.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right text-white font-semibold text-sm">
                      ₹{Number(inv.total).toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/dashboard/invoices/${inv.id}`} className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-all">
                          View
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-400">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            {page > 1 && <Link href={`?page=${page - 1}${status ? `&status=${status}` : ''}`} className="px-3 py-2 text-xs bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700">Previous</Link>}
            {page < totalPages && <Link href={`?page=${page + 1}${status ? `&status=${status}` : ''}`} className="px-3 py-2 text-xs bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700">Next</Link>}
          </div>
        </div>
      )}
    </div>
  )
}
