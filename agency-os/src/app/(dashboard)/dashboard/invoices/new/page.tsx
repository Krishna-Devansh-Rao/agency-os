// src/app/(dashboard)/dashboard/invoices/new/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createInvoice } from '@/actions/invoices'
import { InvoiceSchema, type InvoiceFormData } from '@/schemas'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function NewInvoicePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedClientId = searchParams.get('client_id')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [clients, setClients] = useState<{ id: string; name: string; company_name: string }[]>([])
  const [settings, setSettings] = useState<any>(null)
  const [selectedClient, setSelectedClient] = useState<any>(null)

  const today = new Date().toISOString().split('T')[0]
  const dueDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm<InvoiceFormData>({
    resolver: zodResolver(InvoiceSchema),
    defaultValues: {
      client_id: preselectedClientId ?? '',
      issue_date: today,
      due_date: dueDate,
      tax_percentage: 18,
      items: [{ description: '', quantity: 1, unit_price: 0, sort_order: 0 }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const watchedItems = watch('items')
  const watchedTax = watch('tax_percentage')
  const watchedClientId = watch('client_id')

  // Load clients and settings
  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const [{ data: c }, { data: s }] = await Promise.all([
        supabase.from('clients').select('id, name, company_name, email, gst_number, address').eq('status', 'active').order('name'),
        supabase.from('settings').select('*').single(),
      ])
      setClients(c ?? [])
      setSettings(s)
    }
    load()
  }, [])

  // Update selected client info when client changes
  useEffect(() => {
    if (watchedClientId) {
      const c = clients.find(c => c.id === watchedClientId)
      setSelectedClient(c ?? null)
    }
  }, [watchedClientId, clients])

  // Calculate totals
  const subtotal = watchedItems.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unit_price) || 0), 0)
  const taxAmount = (subtotal * (Number(watchedTax) || 0)) / 100
  const total = subtotal + taxAmount

  const onSubmit = async (data: InvoiceFormData) => {
    setLoading(true)
    setError(null)
    const result = await createInvoice(data)
    if (!result.success) {
      setError(result.error)
      setLoading(false)
      return
    }
    router.push(`/dashboard/invoices/${result.data.id}`)
  }

  const inp = `w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition-all`

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/dashboard/invoices" className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-white">New Invoice</h1>
          <p className="text-sm text-slate-400">Invoice number auto-generated</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {error && <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}

        {/* Agency + Client Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Agency Info (auto-filled) */}
          <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">From (Agency)</p>
            {settings ? (
              <div className="space-y-1">
                <p className="text-white font-semibold text-sm">{settings.agency_name || 'Your Agency'}</p>
                {settings.address && <p className="text-slate-400 text-xs">{settings.address}</p>}
                {settings.email && <p className="text-slate-400 text-xs">{settings.email}</p>}
                {settings.gst_number && <p className="text-slate-400 text-xs">GST: {settings.gst_number}</p>}
              </div>
            ) : (
              <p className="text-slate-500 text-sm">
                <Link href="/dashboard/settings" className="text-purple-400 hover:text-purple-300">Configure settings</Link> first
              </p>
            )}
          </div>

          {/* Client */}
          <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Bill To (Client)</p>
            <select {...register('client_id')} className={inp}>
              <option value="">Select client...</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}{c.company_name ? ` — ${c.company_name}` : ''}</option>
              ))}
            </select>
            {errors.client_id && <p className="text-xs text-red-400 mt-1">{errors.client_id.message}</p>}
            {selectedClient && (
              <div className="mt-3 p-3 bg-slate-800/60 rounded-lg space-y-0.5">
                <p className="text-white text-xs font-medium">{selectedClient.company_name || selectedClient.name}</p>
                {selectedClient.email && <p className="text-slate-400 text-xs">{selectedClient.email}</p>}
                {selectedClient.gst_number && <p className="text-slate-400 text-xs">GST: {selectedClient.gst_number}</p>}
              </div>
            )}
          </div>
        </div>

        {/* Dates */}
        <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">Issue Date</label>
              <input {...register('issue_date')} type="date" className={inp} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">Due Date</label>
              <input {...register('due_date')} type="date" className={inp} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">Tax %</label>
              <input {...register('tax_percentage', { valueAsNumber: true })} type="number" min="0" max="100" step="0.01" placeholder="18" className={inp} />
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Line Items</p>
            <button
              type="button"
              onClick={() => append({ description: '', quantity: 1, unit_price: 0, sort_order: fields.length })}
              className="px-3 py-1.5 text-xs font-medium text-purple-400 border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 rounded-lg transition-colors"
            >
              + Add Item
            </button>
          </div>

          <div className="space-y-3">
            {fields.map((field, i) => {
              const qty = Number(watchedItems[i]?.quantity) || 0
              const price = Number(watchedItems[i]?.unit_price) || 0
              const lineTotal = qty * price
              return (
                <div key={field.id} className="grid grid-cols-12 gap-2 items-start">
                  <div className="col-span-12 sm:col-span-5">
                    <input
                      {...register(`items.${i}.description`)}
                      placeholder="Service description..."
                      className={inp}
                    />
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <input
                      {...register(`items.${i}.quantity`, { valueAsNumber: true })}
                      type="number"
                      min="0.01"
                      step="0.01"
                      placeholder="Qty"
                      className={inp}
                    />
                  </div>
                  <div className="col-span-5 sm:col-span-3">
                    <input
                      {...register(`items.${i}.unit_price`, { valueAsNumber: true })}
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Rate"
                      className={inp}
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1 flex items-center justify-center h-10">
                    <span className="text-slate-300 text-xs font-medium">₹{lineTotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="col-span-1 flex items-center justify-center h-10">
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(i)}
                        className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Totals */}
          <div className="flex justify-end mt-6 pt-4 border-t border-slate-800">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Subtotal</span>
                <span className="text-white">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              {taxAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Tax ({watchedTax}%)</span>
                  <span className="text-white">₹{taxAmount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold pt-2 border-t border-slate-700">
                <span className="text-white">Total</span>
                <span className="text-purple-400">₹{total.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">Notes (optional)</label>
            <textarea {...register('notes')} rows={3} placeholder="Payment terms, thank you note..." className={inp + ' resize-none'} />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Link href="/dashboard/invoices" className="px-5 py-2.5 text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 text-sm font-medium text-white bg-purple-600 hover:bg-purple-500 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading && <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
            {loading ? 'Creating...' : 'Create Invoice'}
          </button>
        </div>
      </form>
    </div>
  )
}
