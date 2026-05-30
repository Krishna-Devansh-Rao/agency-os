'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateInvoiceStatus, duplicateInvoice, deleteInvoice } from '@/actions/invoices'
import { generateInvoicePDF } from '@/lib/pdf/invoice-generator'
import type { InvoiceWithItems, Settings } from '@/types/database'

interface InvoiceActionsProps {
  invoice: InvoiceWithItems
  settings: Settings | null
}

export function InvoiceActions({ invoice, settings }: InvoiceActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const handleStatusChange = async (status: typeof invoice.status) => {
    setLoading('status')
    await updateInvoiceStatus(invoice.id, status)
    setLoading(null)
    router.refresh()
  }

  const handleDuplicate = async () => {
    setLoading('duplicate')
    const result = await duplicateInvoice(invoice.id)
    setLoading(null)
    if (result.success) {
      router.push(`/dashboard/invoices/${result.data.id}`)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this invoice? This cannot be undone.')) return
    setLoading('delete')
    const result = await deleteInvoice(invoice.id)
    setLoading(null)
    if (result.success) {
      router.push('/dashboard/invoices')
    }
  }

  const handleDownloadPDF = async () => {
    if (!settings) {
      alert('Please configure agency settings before generating PDFs')
      return
    }
    setLoading('pdf')
    try {
      const pdfBytes = await generateInvoicePDF({ invoice, settings })
      const blob = new Blob([pdfBytes], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${invoice.invoice_number}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('PDF generation failed:', err)
      alert('Failed to generate PDF. Please try again.')
    }
    setLoading(null)
  }

  const statusOptions: { value: typeof invoice.status; label: string }[] = [
    { value: 'draft', label: 'Mark as Draft' },
    { value: 'sent', label: 'Mark as Sent' },
    { value: 'paid', label: 'Mark as Paid' },
    { value: 'overdue', label: 'Mark as Overdue' },
    { value: 'cancelled', label: 'Cancel Invoice' },
  ].filter(o => o.value !== invoice.status)

  const [showStatusMenu, setShowStatusMenu] = useState(false)

  return (
    <div className="flex items-center gap-2">
      {/* Download PDF */}
      <button
        onClick={handleDownloadPDF}
        disabled={loading === 'pdf'}
        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors disabled:opacity-50"
      >
        {loading === 'pdf' ? (
          <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
        ) : (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        )}
        PDF
      </button>

      {/* Duplicate */}
      <button
        onClick={handleDuplicate}
        disabled={loading === 'duplicate'}
        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors disabled:opacity-50"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        {loading === 'duplicate' ? 'Copying...' : 'Duplicate'}
      </button>

      {/* Status dropdown */}
      <div className="relative">
        <button
          onClick={() => setShowStatusMenu(v => !v)}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors"
        >
          Change Status
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        {showStatusMenu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowStatusMenu(false)} />
            <div className="absolute right-0 top-full mt-1 z-20 w-44 bg-slate-900 border border-slate-700 rounded-xl shadow-xl overflow-hidden">
              {statusOptions.map(o => (
                <button
                  key={o.value}
                  onClick={() => { handleStatusChange(o.value); setShowStatusMenu(false) }}
                  disabled={loading === 'status'}
                  className="w-full text-left px-4 py-2.5 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                >
                  {o.label}
                </button>
              ))}
              <div className="border-t border-slate-800">
                <button
                  onClick={handleDelete}
                  disabled={loading === 'delete'}
                  className="w-full text-left px-4 py-2.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  {loading === 'delete' ? 'Deleting...' : 'Delete Invoice'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
