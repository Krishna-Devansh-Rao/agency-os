// src/lib/utils.ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-IN', options ?? { day: '2-digit', month: 'short', year: 'numeric' })
}

export function daysUntil(date: string): number {
  return Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

export function getRenewalBadge(daysLeft: number): {
  label: string
  className: string
} | null {
  if (daysLeft < 0) return { label: 'Expired', className: 'bg-red-500/10 text-red-400 border-red-500/20' }
  if (daysLeft <= 7) return { label: '7 Days', className: 'bg-red-500/10 text-red-400 border-red-500/20' }
  if (daysLeft <= 15) return { label: '15 Days', className: 'bg-amber-500/10 text-amber-400 border-amber-500/20' }
  if (daysLeft <= 30) return { label: '30 Days', className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' }
  return null
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength - 3) + '...'
}

export function generateAvatarColor(name: string): string {
  const colors = [
    'bg-purple-600/20 text-purple-300',
    'bg-blue-600/20 text-blue-300',
    'bg-emerald-600/20 text-emerald-300',
    'bg-amber-600/20 text-amber-300',
    'bg-rose-600/20 text-rose-300',
    'bg-cyan-600/20 text-cyan-300',
  ]
  const index = name.charCodeAt(0) % colors.length
  return colors[index]
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
