'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ClientService, Payment, Invoice } from '@/types/database'

// ─── SERVICES TAB ─────────────────────────────────────────────

const SERVICE_STATUS = {
  active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  paused: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  expired: 'bg-red-500/10 text-red-400 border-red-500/20',
}

export function ClientServicesTab({ clientId, services }: { clientId: string; services: ClientService[] }) {
  function getDaysRemaining(renewalDate: string | null) {
    if (!renewalDate) return null
    return Math.ceil((new Date(renewalDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-white font-medium">Services ({services.length})</h3>
        <a
          href={`/dashboard/clients/${clientId}/services/new`}
          className="px-3 py-1.5 text-xs font-medium text-white bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors"
        >
          + Add Service
        </a>
      </div>

      {services.length === 0 ? (
        <EmptyState message="No services assigned yet" />
      ) : (
        <div className="space-y-3">
          {services.map(s => {
            const days = getDaysRemaining(s.renewal_date)
            return (
              <div key={s.id} className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-white font-medium text-sm">{s.service_name}</p>
                    <p className="text-slate-400 text-xs mt-0.5 capitalize">{s.billing_cycle.replace('_', '-')} billing</p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${SERVICE_STATUS[s.status] ?? SERVICE_STATUS.active}`}>
                    {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 pt-3 border-t border-slate-800">
                  <div>
                    <p className="text-xs text-slate-500">Monthly Fee</p>
                    <p className="text-sm text-slate-200 font-medium">₹{Number(s.monthly_fee).toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">One-Time Fee</p>
                    <p className="text-sm text-slate-200 font-medium">₹{Number(s.one_time_fee).toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Start Date</p>
                    <p className="text-sm text-slate-200">{new Date(s.start_date).toLocaleDateString('en-IN')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Renewal Date</p>
                    {s.renewal_date ? (
                      <p className="text-sm font-medium" style={{ color: days !== null && days <= 7 ? '#f59e0b' : days !== null && days <= 0 ? '#ef4444' : '#e2e8f0' }}>
                        {new Date(s.renewal_date).toLocaleDateString('en-IN')}
                        {days !== null && (
                          <span className="text-xs ml-1">({days > 0 ? `${days}d left` : 'Expired'})</span>
                        )}
                      </p>
                    ) : (
                      <p className="text-sm text-slate-500">—</p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── PAYMENTS TAB ─────────────────────────────────────────────

const PAYMENT_STATUS = {
  paid: { label: 'Paid', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  pending: { label: 'Pending', className: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  overdue: { label: 'Overdue', className: 'bg-red-500/10 text-red-400 border-red-500/20' },
  refunded: { label: 'Refunded', className: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
}

export function ClientPaymentsTab({ clientId }: { clientId: string }) {
  // Payments will be loaded from parent in a real implementation
  // For now, this renders the structure with a link to add payment
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-white font-medium">Payment History</h3>
        <a
          href={`/dashboard/payments/new?client_id=${clientId}`}
          className="px-3 py-1.5 text-xs font-medium text-white bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors"
        >
          + Record Payment
        </a>
      </div>
      <EmptyState message="No payments recorded yet" />
    </div>
  )
}

// ─── INVOICES TAB ─────────────────────────────────────────────

export function ClientInvoicesTab({ clientId, invoices }: { clientId: string; invoices: any[] }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-white font-medium">Invoices ({invoices.length})</h3>
        <a
          href={`/dashboard/invoices/new?client_id=${clientId}`}
          className="px-3 py-1.5 text-xs font-medium text-white bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors"
        >
          + New Invoice
        </a>
      </div>

      {invoices.length === 0 ? (
        <EmptyState message="No invoices created yet" />
      ) : (
        <div className="rounded-xl border border-slate-700/50 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Invoice #</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {invoices.map((inv: any) => {
                const st = PAYMENT_STATUS[inv.status as keyof typeof PAYMENT_STATUS] ?? PAYMENT_STATUS.pending
                return (
                  <tr key={inv.id} className="bg-slate-900/30 hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3">
                      <a href={`/dashboard/invoices/${inv.id}`} className="text-purple-400 hover:text-purple-300 text-sm font-mono">
                        {inv.invoice_number}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-slate-300 text-sm">
                      {new Date(inv.issue_date).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${st.className}`}>
                        {st.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-white font-medium text-sm">
                      ₹{Number(inv.total).toLocaleString('en-IN')}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── NOTES TAB ────────────────────────────────────────────────

export function ClientNotesTab({ client }: { client: any }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [notes, setNotes] = useState(client.notes ?? '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    const { updateClient } = await import('@/actions/clients')
    await updateClient(client.id, { notes })
    setSaving(false)
    setEditing(false)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-white font-medium">Internal Notes</h3>
        {!editing && (
          <button onClick={() => setEditing(true)} className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700">
            Edit Notes
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-3">
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={8}
            placeholder="Add internal notes about this client..."
            className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/50 transition-all"
          />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setEditing(false)} className="px-4 py-2 text-sm text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm text-white bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Notes'}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5 min-h-[120px]">
          {notes ? (
            <p className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">{notes}</p>
          ) : (
            <p className="text-slate-500 text-sm italic">No notes yet. Click "Edit Notes" to add some.</p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── SHARED ───────────────────────────────────────────────────

function EmptyState({ message }: { message: string }) {
  return (
    <div className="bg-slate-900/40 border border-slate-700/50 rounded-xl p-10 text-center">
      <p className="text-slate-400 text-sm">{message}</p>
    </div>
  )
}
