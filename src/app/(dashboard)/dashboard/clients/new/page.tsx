// src/app/(dashboard)/dashboard/clients/new/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient_action } from '@/actions/clients'
import { ClientSchema, type ClientFormData } from '@/schemas'
import { cn } from '@/lib/utils'
import Link from 'next/link'

export default function NewClientPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<ClientFormData>({
    resolver: zodResolver(ClientSchema),
    defaultValues: { status: 'active' },
  })

  const onSubmit = async (data: ClientFormData) => {
    setLoading(true)
    setError(null)
    const result = await createClient_action(data)
    if (!result.success) {
      setError(result.error)
      setLoading(false)
      return
    }
    router.push(`/dashboard/clients/${result.data.id}`)
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link href="/dashboard/clients" className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-white">Add New Client</h1>
          <p className="text-sm text-slate-400">Fill in the client details below</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
        )}

        {/* Basic Info */}
        <Section title="Basic Information">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Client Name *" error={errors.name?.message}>
              <input {...register('name')} placeholder="John Doe" className={inputClass(!!errors.name)} />
            </Field>
            <Field label="Company Name" error={errors.company_name?.message}>
              <input {...register('company_name')} placeholder="Acme Corp" className={inputClass(false)} />
            </Field>
            <Field label="Email" error={errors.email?.message}>
              <input {...register('email')} type="email" placeholder="john@acme.com" className={inputClass(!!errors.email)} />
            </Field>
            <Field label="Phone" error={errors.phone?.message}>
              <input {...register('phone')} placeholder="+91 98765 43210" className={inputClass(false)} />
            </Field>
            <Field label="Website" error={errors.website?.message}>
              <input {...register('website')} placeholder="https://acme.com" className={inputClass(!!errors.website)} />
            </Field>
            <Field label="Status" error={errors.status?.message}>
              <select {...register('status')} className={selectClass}>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="expired">Expired</option>
                <option value="renewing_soon">Renewing Soon</option>
              </select>
            </Field>
          </div>
          <Field label="Address" error={errors.address?.message}>
            <textarea {...register('address')} rows={2} placeholder="Full address..." className={inputClass(false) + ' resize-none'} />
          </Field>
          <Field label="GST Number" error={errors.gst_number?.message}>
            <input {...register('gst_number')} placeholder="22AAAAA0000A1Z5" className={inputClass(false)} />
          </Field>
        </Section>

        {/* Notes */}
        <Section title="Notes">
          <Field label="Internal Notes" error={errors.notes?.message}>
            <textarea {...register('notes')} rows={4} placeholder="Any internal notes about this client..." className={inputClass(false) + ' resize-none'} />
          </Field>
        </Section>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Link href="/dashboard/clients" className="px-5 py-2.5 text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 text-sm font-medium text-white bg-purple-600 hover:bg-purple-500 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading && (
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            )}
            {loading ? 'Creating...' : 'Create Client'}
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

const inputClass = (hasError: boolean) => cn(
  'w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border text-white placeholder-slate-500 text-sm',
  'focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/50 transition-all',
  hasError ? 'border-red-500/50' : 'border-slate-700'
)

const selectClass = cn(
  'w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm',
  'focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/50 transition-all'
)

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}
