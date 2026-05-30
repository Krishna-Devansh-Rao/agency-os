'use server'

import { createClient } from '@/lib/supabase/server'
import type { GoalForecast } from '@/types/database'

async function getUserId() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Unauthorized')
  return { supabase, userId: user.id }
}

// ============================================================
// MAIN DASHBOARD KPIs
// ============================================================
export async function getDashboardKPIs() {
  const { supabase, userId } = await getUserId()

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0]
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const today = now.toISOString().split('T')[0]

  // Parallel queries for performance
  const [
    clientsResult,
    paymentsResult,
    monthlyResult,
    yearlyResult,
    pendingResult,
    projectsResult,
    renewalsResult,
    expensesResult,
    recurringResult,
    oneTimeResult,
  ] = await Promise.all([
    // Total + active clients
    supabase.from('clients').select('id, status', { count: 'exact' }).eq('user_id', userId),

    // Total paid revenue
    supabase.from('payments').select('amount').eq('user_id', userId).eq('status', 'paid'),

    // Monthly revenue
    supabase.from('payments').select('amount').eq('user_id', userId).eq('status', 'paid').gte('payment_date', startOfMonth),

    // Yearly revenue
    supabase.from('payments').select('amount').eq('user_id', userId).eq('status', 'paid').gte('payment_date', startOfYear),

    // Pending payments
    supabase.from('payments').select('amount').eq('user_id', userId).in('status', ['pending', 'overdue']),

    // Active projects
    supabase.from('projects').select('id', { count: 'exact' }).eq('user_id', userId).in('status', ['planning', 'in_progress', 'review']),

    // Upcoming renewals (30 days)
    supabase.from('client_services').select('id', { count: 'exact' }).eq('user_id', userId).eq('status', 'active').gte('renewal_date', today).lte('renewal_date', in30Days),

    // Total expenses
    supabase.from('expenses').select('amount').eq('user_id', userId),

    // Monthly recurring revenue (this month)
    supabase.from('payments').select('amount').eq('user_id', userId).eq('status', 'paid').gte('payment_date', startOfMonth),

    // Monthly one-time revenue  
    supabase.from('revenue_entries').select('amount').eq('user_id', userId).eq('revenue_type', 'one_time').gte('entry_date', startOfMonth),
  ])

  const totalClients = clientsResult.count ?? 0
  const activeClients = (clientsResult.data ?? []).filter(c => c.status === 'active').length
  const totalRevenue = (paymentsResult.data ?? []).reduce((sum, p) => sum + Number(p.amount), 0)
  const monthlyRevenue = (monthlyResult.data ?? []).reduce((sum, p) => sum + Number(p.amount), 0)
  const yearlyRevenue = (yearlyResult.data ?? []).reduce((sum, p) => sum + Number(p.amount), 0)
  const pendingPayments = (pendingResult.data ?? []).reduce((sum, p) => sum + Number(p.amount), 0)
  const activeProjects = projectsResult.count ?? 0
  const upcomingRenewals = renewalsResult.count ?? 0
  const totalExpenses = (expensesResult.data ?? []).reduce((sum, e) => sum + Number(e.amount), 0)
  const netProfit = totalRevenue - totalExpenses
  const avgClientValue = activeClients > 0 ? totalRevenue / activeClients : 0

  // Annual projection based on monthly average
  const monthsElapsed = now.getMonth() + 1
  const annualProjection = monthsElapsed > 0 ? (yearlyRevenue / monthsElapsed) * 12 : 0

  return {
    totalClients,
    activeClients,
    totalRevenue,
    monthlyRevenue,
    yearlyRevenue,
    pendingPayments,
    activeProjects,
    upcomingRenewals,
    totalExpenses,
    netProfit,
    avgClientValue,
    annualProjection,
  }
}

// ============================================================
// MONTHLY OVERVIEW
// ============================================================
export async function getMonthlyOverview() {
  const { supabase, userId } = await getUserId()

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0]
  const today = now.toISOString().split('T')[0]

  const [currentPayments, newClients, renewals, pendingPayments] = await Promise.all([
    supabase.from('payments').select('amount, status').eq('user_id', userId).gte('payment_date', startOfMonth),
    supabase.from('clients').select('id', { count: 'exact' }).eq('user_id', userId).gte('created_at', startOfMonth),
    supabase.from('client_services').select('id', { count: 'exact' }).eq('user_id', userId).gte('renewal_date', startOfMonth).lte('renewal_date', today),
    supabase.from('payments').select('amount').eq('user_id', userId).in('status', ['pending', 'overdue']).gte('payment_date', startOfMonth),
  ])

  const thisMonthPaid = (currentPayments.data ?? []).filter(p => p.status === 'paid').reduce((sum, p) => sum + Number(p.amount), 0)
  const thisMonthPending = (pendingPayments.data ?? []).reduce((sum, p) => sum + Number(p.amount), 0)

  return {
    thisMonthRevenue: thisMonthPaid,
    thisMonthPending: thisMonthPending,
    thisMonthNewClients: newClients.count ?? 0,
    thisMonthRenewals: renewals.count ?? 0,
    thisMonthPaymentsReceived: thisMonthPaid,
  }
}

// ============================================================
// REVENUE CHART DATA
// ============================================================
export async function getRevenueChartData(period: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly') {
  const { supabase, userId } = await getUserId()

  const now = new Date()
  let startDate: string
  let points: number

  switch (period) {
    case 'daily':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      points = 30
      break
    case 'weekly':
      startDate = new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      points = 12
      break
    case 'monthly':
      startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1).toISOString().split('T')[0]
      points = 12
      break
    case 'yearly':
      startDate = new Date(now.getFullYear() - 4, 0, 1).toISOString().split('T')[0]
      points = 5
      break
  }

  const { data: payments } = await supabase
    .from('payments')
    .select('amount, payment_date, status')
    .eq('user_id', userId)
    .eq('status', 'paid')
    .gte('payment_date', startDate)
    .order('payment_date', { ascending: true })

  // Group by period
  const grouped: Record<string, number> = {}

  ;(payments ?? []).forEach(p => {
    const date = new Date(p.payment_date)
    let key: string

    switch (period) {
      case 'daily':
        key = date.toISOString().split('T')[0]
        break
      case 'weekly':
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        key = weekStart.toISOString().split('T')[0]
        break
      case 'monthly':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        break
      case 'yearly':
        key = String(date.getFullYear())
        break
    }

    grouped[key] = (grouped[key] ?? 0) + Number(p.amount)
  })

  return Object.entries(grouped)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, revenue]) => ({ period, revenue }))
}

// ============================================================
// REVENUE BY SOURCE (for donut chart)
// ============================================================
export async function getRevenueBySource() {
  const { supabase, userId } = await getUserId()

  const { data } = await supabase
    .from('revenue_entries')
    .select('source, amount')
    .eq('user_id', userId)

  const grouped: Record<string, number> = {}

  ;(data ?? []).forEach(entry => {
    grouped[entry.source] = (grouped[entry.source] ?? 0) + Number(entry.amount)
  })

  const sourceLabels: Record<string, string> = {
    meta_ads: 'Meta Ads',
    google_ads: 'Google Ads',
    website_dev: 'Website Development',
    one_time: 'One-Time Projects',
    consulting: 'Consulting',
    other: 'Other',
  }

  return Object.entries(grouped).map(([source, amount]) => ({
    source,
    label: sourceLabels[source] ?? source,
    amount,
  }))
}

// ============================================================
// GOAL FORECAST ENGINE
// ============================================================
export async function getGoalForecasts(): Promise<GoalForecast[]> {
  const { supabase, userId } = await getUserId()

  const { data: goals } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')

  if (!goals?.length) return []

  // Get total revenue and date range for avg daily calculation
  const { data: payments } = await supabase
    .from('payments')
    .select('amount, payment_date')
    .eq('user_id', userId)
    .eq('status', 'paid')
    .order('payment_date', { ascending: true })

  const totalRevenue = (payments ?? []).reduce((sum, p) => sum + Number(p.amount), 0)

  let averageDailyRevenue = 0
  if (payments && payments.length > 0) {
    const firstDate = new Date(payments[0].payment_date)
    const today = new Date()
    const activeDays = Math.max(1, Math.ceil((today.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)))
    averageDailyRevenue = totalRevenue / activeDays
  }

  return goals.map(goal => {
    const currentAmount = totalRevenue
    const remaining = Math.max(0, goal.target_amount - currentAmount)
    const estimatedDays = averageDailyRevenue > 0 ? Math.ceil(remaining / averageDailyRevenue) : null
    const estimatedDate = estimatedDays ? new Date(Date.now() + estimatedDays * 24 * 60 * 60 * 1000) : null
    const progress = Math.min(100, (currentAmount / goal.target_amount) * 100)

    return {
      goal,
      current_revenue: currentAmount,
      remaining_revenue: remaining,
      average_daily_revenue: averageDailyRevenue,
      estimated_days: estimatedDays ?? 0,
      estimated_completion_date: estimatedDate,
      progress_percentage: progress,
    }
  })
}

// ============================================================
// ANALYTICS — REVENUE COMPARISON
// ============================================================
export async function getRevenueComparison() {
  const { supabase, userId } = await getUserId()

  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0]
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0]

  const [thisMonth, lastMonth] = await Promise.all([
    supabase.from('payments').select('amount').eq('user_id', userId).eq('status', 'paid').gte('payment_date', thisMonthStart),
    supabase.from('payments').select('amount').eq('user_id', userId).eq('status', 'paid').gte('payment_date', lastMonthStart).lte('payment_date', lastMonthEnd),
  ])

  const thisMonthTotal = (thisMonth.data ?? []).reduce((sum, p) => sum + Number(p.amount), 0)
  const lastMonthTotal = (lastMonth.data ?? []).reduce((sum, p) => sum + Number(p.amount), 0)
  const change = lastMonthTotal > 0 ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0

  return {
    thisMonth: thisMonthTotal,
    lastMonth: lastMonthTotal,
    change: Math.round(change * 10) / 10,
    isPositive: change >= 0,
  }
}
