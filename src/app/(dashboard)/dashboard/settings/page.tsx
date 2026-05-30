// src/app/(dashboard)/dashboard/settings/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { SettingsSchema, type SettingsFormData } from '@/schemas'
import { createClient } from '@/lib/supabase/client'

export default function SettingsPage() {
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<SettingsFormData>({
    resolver: zodResolver(SettingsSchema),
    defaultValues: { agency_name: '', currency: 'INR', invoice_prefix: 'INV' },
  })

  // Load existing settings
  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase.from('settings').select('*').eq('user_id', user.id).single()
      if (data) reset(data)
      setFetching(false)
    }
    load()
  }, [reset])

  const onSubmit = async (data: SettingsFormData) => {
    setLoading(true)
    setError(null)
    setSaved(false)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not authenticated'); setLoading(false); return }

    // Upsert settings
    const { error: dbError } = await supabase
      .from('settings')
      .upsert({ ...data, user_id: user.id }, { onConflict: 'user_id' })

    if (dbError) {
      setError(dbError.message)
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
    setLoading(false)
  }

  const inp = `w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition-all`

  if (fetching) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="space-y-6 animate-pulse">
          {Array(4).fill(0).map((_, i) => <div key={i} className="h-48 bg-slate-800/50 rounded-xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Settings</h1>
        <p className="text-sm text-slate-400 mt-1">Configure your agency profile</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {error && <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}
        {saved && <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
          Settings saved successfully!
        </div>}

        {/* Agency Profile */}
        <Section title="Agency Profile">
          <Field label="Agency Name *" error={errors.agency_name?.message}>
            <input {...register('agency_name')} placeholder="My Marketing Agency" className={inp} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Email" error={errors.email?.message}>
              <input {...register('email')} type="email" placeholder="agency@example.com" className={inp} />
            </Field>
            <Field label="Phone" error={errors.phone?.message}>
              <input {...register('phone')} placeholder="+91 98765 43210" className={inp} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Website" error={errors.website?.message}>
              <input {...register('website')} placeholder="https://myagency.com" className={inp} />
            </Field>
            <Field label="GST Number" error={errors.gst_number?.message}>
              <input {...register('gst_number')} placeholder="22AAAAA0000A1Z5" className={inp} />
            </Field>
          </div>
          <Field label="Address" error={errors.address?.message}>
            <textarea {...register('address')} rows={3} placeholder="Full business address..." className={inp + ' resize-none'} />
          </Field>
        </Section>

        {/* Invoice Settings */}
        <Section title="Invoice Settings">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Invoice Prefix" error={errors.invoice_prefix?.message}>
              <input {...register('invoice_prefix')} placeholder="INV" className={inp} />
            </Field>
            <Field label="Currency" error={errors.currency?.message}>
              <select {...register('currency')} className={inp}>
                <option value="INR">INR — Indian Rupee</option>
                <option value="USD">USD — US Dollar</option>
                <option value="EUR">EUR — Euro</option>
                <option value="GBP">GBP — British Pound</option>
              </select>
            </Field>
          </div>
        </Section>

        {/* Bank Details */}
        <Section title="Bank Details">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Bank Name" error={errors.bank_name?.message}>
              <input {...register('bank_name')} placeholder="HDFC Bank" className={inp} />
            </Field>
            <Field label="Account Number" error={errors.bank_account?.message}>
              <input {...register('bank_account')} placeholder="1234567890" className={inp} />
            </Field>
            <Field label="IFSC Code" error={errors.bank_ifsc?.message}>
              <input {...register('bank_ifsc')} placeholder="HDFC0001234" className={inp} />
            </Field>
            <Field label="UPI ID" error={errors.upi_id?.message}>
              <input {...register('upi_id')} placeholder="agency@upi" className={inp} />
            </Field>
          </div>
        </Section>

        {/* Save */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 text-sm font-medium text-white bg-purple-600 hover:bg-purple-500 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-purple-600/20"
          >
            {loading && <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
            {loading ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5 space-y-4">
      <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">{title}</h2>
      {children}
    </div>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-slate-300">{label}</label>
      {children}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
