// src/app/(dashboard)/dashboard/payments/new/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createPayment } from '@/actions/payments'
import { PaymentSchema, type PaymentFormData } from '@/schemas'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function NewPaymentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedClientId = searchParams.get('client_id')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [clients, setClients] = useState<{ id: string; name: string; company_name: string }[]>([])

  const today = new Date().toISOString().split('T')[0]

  const { register, handleSubmit, formState: { errors } } = useForm<PaymentFormData>({
    resolver: zodResolver(PaymentSchema),
    defaultValues: {
      client_id: preselectedClientId ?? '',
      payment_date: today,
      payment_method: 'bank_transfer',
      status: 'paid',
      amount: 0,
    },
  })

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data } = await supabase.from('clients').select('id, name, company_name').order('name')
      setClients(data ?? [])
    }
    load()
  }, [])

  const onSubmit = async (data: PaymentFormData) => {
    setLoading(true)
    setError(null)
    const result = await createPayment(data)
    if (!result.success) { setError(result.error); setLoading(false); return }
    router.push('/dashboard/payments')
  }

  const inp = `w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition-all`

  return (
    <div className="p-6 max-w-xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/dashboard/payments" className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-white">Record Payment</h1>
          <p className="text-sm text-slate-400">Add a new payment entry</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {error && <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}

        <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">Client *</label>
            <select {...register('client_id')} className={inp}>
              <option value="">Select client...</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}{c.company_name ? ` — ${c.company_name}` : ''}</option>)}
            </select>
            {errors.client_id && <p className="text-xs text-red-400">{errors.client_id.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">Amount (₹) *</label>
              <input {...register('amount', { valueAsNumber: true })} type="number" min="0" step="0.01" placeholder="0.00" className={inp} />
              {errors.amount && <p className="text-xs text-red-400">{errors.amount.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">Payment Date *</label>
              <input {...register('payment_date')} type="date" className={inp} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">Payment Method</label>
              <select {...register('payment_method')} className={inp}>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="upi">UPI</option>
                <option value="cash">Cash</option>
                <option value="cheque">Cheque</option>
                <option value="card">Card</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">Status</label>
              <select {...register('status')} className={inp}>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="overdue">Overdue</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">Invoice Number</label>
            <input {...register('invoice_number')} placeholder="INV-0001 (optional)" className={inp} />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">Notes</label>
            <textarea {...register('notes')} rows={3} placeholder="Payment notes..." className={inp + ' resize-none'} />
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Link href="/dashboard/payments" className="px-5 py-2.5 text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors">Cancel</Link>
          <button type="submit" disabled={loading} className="px-5 py-2.5 text-sm font-medium text-white bg-purple-600 hover:bg-purple-500 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2">
            {loading && <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
            {loading ? 'Saving...' : 'Record Payment'}
          </button>
        </div>
      </form>
    </div>
  )
}
