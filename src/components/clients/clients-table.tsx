'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { deleteClient } from '@/actions/clients'
import type { Client } from '@/types/database'

const STATUS_CONFIG = {
  active: { label: 'Active', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  paused: { label: 'Paused', className: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  expired: { label: 'Expired', className: 'bg-red-500/10 text-red-400 border-red-500/20' },
  renewing_soon: { label: 'Renewing Soon', className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

interface ClientsTableProps {
  clients: Client[]
}

export function ClientsTable({ clients }: ClientsTableProps) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  if (clients.length === 0) {
    return (
      <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-16 text-center">
        <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.5">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </div>
        <p className="text-slate-400 font-medium">No clients found</p>
        <p className="text-slate-500 text-sm mt-1">Add your first client to get started</p>
        <Link
          href="/dashboard/clients/new"
          className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-xl transition-colors"
        >
          Add Client
        </Link>
      </div>
    )
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete client "${name}"? This will also delete all their payments, invoices, and services.`)) return
    setDeletingId(id)
    const result = await deleteClient(id)
    if (!result.success) {
      alert(result.error)
    }
    setDeletingId(null)
    router.refresh()
  }

  return (
    <div className="rounded-xl border border-slate-700/50 overflow-hidden">
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/60">
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Client</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Contact</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Since</th>
              <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {clients.map(client => {
              const status = STATUS_CONFIG[client.status] ?? STATUS_CONFIG.active
              return (
                <tr key={client.id} className="bg-slate-900/30 hover:bg-slate-800/40 transition-colors group">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 text-xs font-bold flex-shrink-0">
                        {getInitials(client.name)}
                      </div>
                      <div>
                        <Link href={`/dashboard/clients/${client.id}`} className="text-white font-medium text-sm hover:text-purple-400 transition-colors">
                          {client.name}
                        </Link>
                        {client.company_name && (
                          <p className="text-slate-500 text-xs mt-0.5">{client.company_name}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="space-y-0.5">
                      {client.email && <p className="text-slate-300 text-sm">{client.email}</p>}
                      {client.phone && <p className="text-slate-500 text-xs">{client.phone}</p>}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${status.className}`}>
                      {status.label}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-400 text-sm">
                    {new Date(client.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link
                        href={`/dashboard/clients/${client.id}`}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
                        title="View client"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      </Link>
                      <Link
                        href={`/dashboard/clients/${client.id}/edit`}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
                        title="Edit client"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </Link>
                      <button
                        onClick={() => handleDelete(client.id, client.name)}
                        disabled={deletingId === client.id}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50"
                        title="Delete client"
                      >
                        {deletingId === client.id ? (
                          <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                          </svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                          </svg>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-slate-800">
        {clients.map(client => {
          const status = STATUS_CONFIG[client.status] ?? STATUS_CONFIG.active
          return (
            <div key={client.id} className="p-4 bg-slate-900/30">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 text-xs font-bold flex-shrink-0">
                    {getInitials(client.name)}
                  </div>
                  <div className="min-w-0">
                    <Link href={`/dashboard/clients/${client.id}`} className="text-white font-medium text-sm hover:text-purple-400 truncate block">
                      {client.name}
                    </Link>
                    {client.email && <p className="text-slate-500 text-xs truncate">{client.email}</p>}
                  </div>
                </div>
                <span className={`inline-flex flex-shrink-0 items-center px-2 py-0.5 rounded-full text-xs font-medium border ${status.className}`}>
                  {status.label}
                </span>
              </div>
              <div className="flex gap-2 mt-3">
                <Link href={`/dashboard/clients/${client.id}`} className="flex-1 text-center py-1.5 text-xs font-medium text-slate-300 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors">
                  View
                </Link>
                <Link href={`/dashboard/clients/${client.id}/edit`} className="flex-1 text-center py-1.5 text-xs font-medium text-slate-300 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors">
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(client.id, client.name)}
                  className="flex-1 py-1.5 text-xs font-medium text-red-400 bg-red-500/10 rounded-lg hover:bg-red-500/20 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
