// src/app/(dashboard)/dashboard/invoices/[id]/page.tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getInvoice } from '@/actions/invoices'
import { createClient } from '@/lib/supabase/server'
import { InvoiceActions } from '@/components/invoices/invoice-actions'

interface PageProps {
  params: Promise<{ id: string }>
}

export const dynamic = 'force-dynamic'

const STATUS_CONFIG = {
  draft: { label: 'Draft', className: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
  sent: { label: 'Sent', className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  paid: { label: 'Paid', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  overdue: { label: 'Overdue', className: 'bg-red-500/10 text-red-400 border-red-500/20' },
  cancelled: { label: 'Cancelled', className: 'bg-slate-600/10 text-slate-500 border-slate-600/20' },
}

export default async function InvoiceDetailPage({ params }: PageProps) {
  const { id } = await params
  const result = await getInvoice(id)
  if (!result.success) notFound()
  const invoice = result.data

  const supabase = await createClient()
  const { data: settings } = await supabase
    .from('settings')
    .select('*')
    .single()

  const st = STATUS_CONFIG[invoice.status] ?? STATUS_CONFIG.draft

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Back */}
      <div className="flex items-center justify-between">
        <Link href="/dashboard/invoices" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-300 transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          All Invoices
        </Link>
        <InvoiceActions invoice={invoice} settings={settings} />
      </div>

      {/* Invoice preview */}
      <div className="bg-slate-900/80 border border-slate-700/50 rounded-2xl overflow-hidden">
        {/* Invoice Header */}
        <div className="bg-slate-950 p-8 border-b border-slate-800">
          <div className="flex flex-col sm:flex-row justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-purple-400">INVOICE</h1>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${st.className}`}>
                  {st.label}
                </span>
              </div>
              <p className="text-slate-400 font-mono text-sm">{invoice.invoice_number}</p>
            </div>
            <div className="text-right">
              <p className="text-white font-bold text-lg">{settings?.agency_name ?? 'Your Agency'}</p>
              {settings?.address && <p className="text-slate-400 text-sm mt-1">{settings.address}</p>}
              {settings?.email && <p className="text-slate-400 text-sm">{settings.email}</p>}
              {settings?.phone && <p className="text-slate-400 text-sm">{settings.phone}</p>}
              {settings?.gst_number && <p className="text-slate-400 text-sm">GST: {settings.gst_number}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider">Bill To</p>
              <p className="text-white font-semibold mt-1">{invoice.client.company_name || invoice.client.name}</p>
              {invoice.client.company_name && <p className="text-slate-400 text-sm">{invoice.client.name}</p>}
              {invoice.client.email && <p className="text-slate-400 text-sm">{invoice.client.email}</p>}
              {invoice.client.gst_number && <p className="text-slate-400 text-sm">GST: {invoice.client.gst_number}</p>}
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider">Issue Date</p>
              <p className="text-white mt-1">{new Date(invoice.issue_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider">Due Date</p>
              <p className="text-white mt-1">
                {invoice.due_date
                  ? new Date(invoice.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
                  : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider">Amount Due</p>
              <p className="text-2xl font-bold text-purple-400 mt-1">₹{Number(invoice.total).toLocaleString('en-IN')}</p>
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="p-8">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Description</th>
                <th className="text-center py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider w-20">Qty</th>
                <th className="text-right py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider w-32">Rate</th>
                <th className="text-right py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider w-32">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {invoice.invoice_items.map(item => (
                <tr key={item.id}>
                  <td className="py-4 text-slate-200 text-sm">{item.description}</td>
                  <td className="py-4 text-center text-slate-400 text-sm">{item.quantity}</td>
                  <td className="py-4 text-right text-slate-400 text-sm">₹{Number(item.unit_price).toLocaleString('en-IN')}</td>
                  <td className="py-4 text-right text-white font-medium text-sm">₹{Number(item.amount).toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end mt-6">
            <div className="w-full max-w-xs space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Subtotal</span>
                <span className="text-white">₹{Number(invoice.subtotal).toLocaleString('en-IN')}</span>
              </div>
              {invoice.tax_percentage > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Tax ({invoice.tax_percentage}%)</span>
                  <span className="text-white">₹{Number(invoice.tax_amount).toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-3 border-t border-slate-700">
                <span className="text-white">Total</span>
                <span className="text-purple-400">₹{Number(invoice.total).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Payment details */}
          {(settings?.bank_account || settings?.upi_id) && (
            <div className="mt-8 pt-6 border-t border-slate-800">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Payment Details</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {settings.bank_name && <div><p className="text-xs text-slate-500">Bank</p><p className="text-sm text-slate-200">{settings.bank_name}</p></div>}
                {settings.bank_account && <div><p className="text-xs text-slate-500">Account</p><p className="text-sm text-slate-200">{settings.bank_account}</p></div>}
                {settings.bank_ifsc && <div><p className="text-xs text-slate-500">IFSC</p><p className="text-sm text-slate-200">{settings.bank_ifsc}</p></div>}
                {settings.upi_id && <div><p className="text-xs text-slate-500">UPI</p><p className="text-sm text-slate-200">{settings.upi_id}</p></div>}
              </div>
            </div>
          )}

          {/* Notes */}
          {invoice.notes && (
            <div className="mt-6 pt-6 border-t border-slate-800">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Notes</p>
              <p className="text-slate-300 text-sm whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
