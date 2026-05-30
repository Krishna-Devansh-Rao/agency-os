// src/app/(dashboard)/dashboard/clients/page.tsx
import { Suspense } from 'react'
import Link from 'next/link'
import { getClients } from '@/actions/clients'
import { ClientsTable } from '@/components/clients/clients-table'
import { ClientStatusBadge } from '@/components/clients/client-status-badge'

interface PageProps {
  searchParams: Promise<{ search?: string; status?: string; page?: string }>
}

export const dynamic = 'force-dynamic'

export default async function ClientsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = Number(params.page ?? 1)
  const { clients, total } = await getClients({
    search: params.search,
    status: params.status,
    page,
    limit: 20,
  })

  const totalPages = Math.ceil(total / 20)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Clients</h1>
          <p className="text-sm text-slate-400 mt-1">{total} total clients</p>
        </div>
        <Link
          href="/dashboard/clients/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-purple-600/20"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add Client
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <ClientSearchInput defaultValue={params.search} />
        <ClientStatusFilter current={params.status} />
      </div>

      {/* Table */}
      <Suspense fallback={<TableSkeleton />}>
        <ClientsTable clients={clients} />
      </Suspense>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination currentPage={page} totalPages={totalPages} params={params} />
      )}
    </div>
  )
}

function ClientSearchInput({ defaultValue }: { defaultValue?: string }) {
  return (
    <form className="flex-1">
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          name="search"
          type="search"
          defaultValue={defaultValue}
          placeholder="Search clients..."
          className="w-full pl-9 pr-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/50 transition-all"
        />
      </div>
    </form>
  )
}

function ClientStatusFilter({ current }: { current?: string }) {
  const statuses = [
    { value: '', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'paused', label: 'Paused' },
    { value: 'expired', label: 'Expired' },
    { value: 'renewing_soon', label: 'Renewing Soon' },
  ]

  return (
    <div className="flex gap-2">
      {statuses.map(s => (
        <Link
          key={s.value}
          href={s.value ? `?status=${s.value}` : '/dashboard/clients'}
          className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${
            current === s.value || (!current && !s.value)
              ? 'bg-purple-600 text-white'
              : 'bg-slate-800 text-slate-400 hover:text-slate-300 hover:bg-slate-700'
          }`}
        >
          {s.label}
        </Link>
      ))}
    </div>
  )
}

function Pagination({ currentPage, totalPages, params }: {
  currentPage: number
  totalPages: number
  params: Record<string, string | undefined>
}) {
  const buildHref = (page: number) => {
    const p = new URLSearchParams()
    if (params.search) p.set('search', params.search)
    if (params.status) p.set('status', params.status)
    p.set('page', String(page))
    return `?${p.toString()}`
  }

  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-slate-400">Page {currentPage} of {totalPages}</p>
      <div className="flex gap-2">
        {currentPage > 1 && (
          <Link href={buildHref(currentPage - 1)} className="px-3 py-2 text-xs font-medium bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors">
            Previous
          </Link>
        )}
        {currentPage < totalPages && (
          <Link href={buildHref(currentPage + 1)} className="px-3 py-2 text-xs font-medium bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors">
            Next
          </Link>
        )}
      </div>
    </div>
  )
}

function TableSkeleton() {
  return (
    <div className="rounded-xl border border-slate-700/50 overflow-hidden">
      {Array(5).fill(0).map((_, i) => (
        <div key={i} className="flex gap-4 p-4 border-b border-slate-800 animate-pulse">
          <div className="w-10 h-10 rounded-full bg-slate-700" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-700 rounded w-40" />
            <div className="h-3 bg-slate-800 rounded w-28" />
          </div>
          <div className="h-6 bg-slate-800 rounded w-16" />
        </div>
      ))}
    </div>
  )
}
