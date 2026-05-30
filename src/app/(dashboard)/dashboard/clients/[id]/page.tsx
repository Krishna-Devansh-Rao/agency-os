// src/app/(dashboard)/dashboard/clients/[id]/page.tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getClient } from '@/actions/clients'
import { getInvoices } from '@/actions/invoices'
import { ClientProfileHeader } from '@/components/clients/client-profile-header'
import { ClientPaymentsTab } from '@/components/clients/tabs/payments-tab'
import { ClientInvoicesTab } from '@/components/clients/tabs/invoices-tab'
import { ClientServicesTab } from '@/components/clients/tabs/services-tab'
import { ClientNotesTab } from '@/components/clients/tabs/notes-tab'

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'services', label: 'Services' },
  { id: 'payments', label: 'Payments' },
  { id: 'invoices', label: 'Invoices' },
  { id: 'notes', label: 'Notes' },
]

export const dynamic = 'force-dynamic'

export default async function ClientProfilePage({ params, searchParams }: PageProps) {
  const { id } = await params
  const { tab = 'overview' } = await searchParams

  const result = await getClient(id)
  if (!result.success) notFound()

  const client = result.data
  const { invoices } = await getInvoices({ client_id: id, limit: 100 })

  return (
    <div className="p-6 space-y-6">
      {/* Back */}
      <Link href="/dashboard/clients" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-300 transition-colors">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        All Clients
      </Link>

      {/* Profile Header */}
      <ClientProfileHeader client={client} />

      {/* Tabs */}
      <div className="border-b border-slate-800">
        <div className="flex gap-1 overflow-x-auto">
          {TABS.map(t => (
            <Link
              key={t.id}
              href={`/dashboard/clients/${id}?tab=${t.id}`}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                tab === t.id
                  ? 'border-purple-500 text-purple-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-600'
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {tab === 'overview' && <OverviewTab client={client} />}
        {tab === 'services' && <ClientServicesTab clientId={id} services={client.client_services ?? []} />}
        {tab === 'payments' && <ClientPaymentsTab clientId={id} />}
        {tab === 'invoices' && <ClientInvoicesTab clientId={id} invoices={invoices} />}
        {tab === 'notes' && <ClientNotesTab client={client} />}
      </div>
    </div>
  )
}

function OverviewTab({ client }: { client: any }) {
  const metrics = [
    { label: 'Total Revenue', value: `₹${Number(client.total_revenue).toLocaleString('en-IN')}`, color: 'text-emerald-400' },
    { label: 'Total Paid', value: `₹${Number(client.total_paid).toLocaleString('en-IN')}`, color: 'text-blue-400' },
    { label: 'Pending Balance', value: `₹${Number(client.pending_balance).toLocaleString('en-IN')}`, color: client.pending_balance > 0 ? 'text-amber-400' : 'text-slate-400' },
    { label: 'Active Services', value: (client.client_services ?? []).filter((s: any) => s.status === 'active').length, color: 'text-purple-400' },
  ]

  const info = [
    { label: 'Email', value: client.email },
    { label: 'Phone', value: client.phone },
    { label: 'Website', value: client.website },
    { label: 'Address', value: client.address },
    { label: 'GST Number', value: client.gst_number },
    { label: 'Client Since', value: new Date(client.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) },
  ].filter(i => i.value)

  return (
    <div className="space-y-6">
      {/* Financial metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map(m => (
          <div key={m.label} className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4">
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">{m.label}</p>
            <p className={`text-xl font-bold ${m.color}`}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Client info */}
      <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Contact Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {info.map(i => (
            <div key={i.label}>
              <p className="text-xs text-slate-500 mb-0.5">{i.label}</p>
              <p className="text-sm text-slate-200">{i.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Expiring services */}
      {(client.client_services ?? []).filter((s: any) => {
        if (!s.renewal_date) return false
        const days = Math.ceil((new Date(s.renewal_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        return days >= 0 && days <= 30
      }).length > 0 && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
          <p className="text-amber-400 text-sm font-medium mb-2">⚠ Services Expiring Soon</p>
          {(client.client_services ?? [])
            .filter((s: any) => {
              if (!s.renewal_date) return false
              const days = Math.ceil((new Date(s.renewal_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              return days >= 0 && days <= 30
            })
            .map((s: any) => {
              const days = Math.ceil((new Date(s.renewal_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              return (
                <div key={s.id} className="flex justify-between text-sm py-1">
                  <span className="text-slate-300">{s.service_name}</span>
                  <span className="text-amber-400 font-medium">{days} day{days !== 1 ? 's' : ''} left</span>
                </div>
              )
            })}
        </div>
      )}
    </div>
  )
}
