// src/app/(dashboard)/dashboard/page.tsx
import { Suspense } from 'react'
import { getDashboardKPIs, getMonthlyOverview, getRevenueChartData, getRevenueBySource } from '@/actions/analytics'
import { getExpiringClients } from '@/actions/clients'
import { KPICard } from '@/components/dashboard/kpi-card'
import { RevenueChart } from '@/components/dashboard/revenue-chart'
import { RevenueDonut } from '@/components/dashboard/revenue-donut'
import { ExpiringClientsWidget } from '@/components/dashboard/expiring-clients'
import { MonthlyOverviewCard } from '@/components/dashboard/monthly-overview'
import { KPICardSkeleton } from '@/components/dashboard/skeletons'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function DashboardPage() {
  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
        <p className="text-sm text-slate-400 mt-1">Your agency at a glance</p>
      </div>

      {/* KPI Grid */}
      <Suspense fallback={<div className="grid grid-cols-2 md:grid-cols-4 gap-4">{Array(8).fill(0).map((_, i) => <KPICardSkeleton key={i} />)}</div>}>
        <KPIGrid />
      </Suspense>

      {/* Monthly Overview */}
      <Suspense fallback={<div className="h-32 rounded-xl bg-slate-800/50 animate-pulse" />}>
        <MonthlyOverviewSection />
      </Suspense>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Suspense fallback={<div className="h-80 rounded-xl bg-slate-800/50 animate-pulse" />}>
            <RevenueChartSection />
          </Suspense>
        </div>
        <div>
          <Suspense fallback={<div className="h-80 rounded-xl bg-slate-800/50 animate-pulse" />}>
            <RevenueDonutSection />
          </Suspense>
        </div>
      </div>

      {/* Expiring Clients */}
      <Suspense fallback={<div className="h-48 rounded-xl bg-slate-800/50 animate-pulse" />}>
        <ExpiringSection />
      </Suspense>
    </div>
  )
}

async function KPIGrid() {
  const kpis = await getDashboardKPIs()

  const cards = [
    { title: 'Total Clients', value: kpis.totalClients, format: 'number', icon: 'users', color: 'blue' },
    { title: 'Active Clients', value: kpis.activeClients, format: 'number', icon: 'user-check', color: 'green' },
    { title: 'Total Revenue', value: kpis.totalRevenue, format: 'currency', icon: 'currency-rupee', color: 'purple' },
    { title: 'Monthly Revenue', value: kpis.monthlyRevenue, format: 'currency', icon: 'trending-up', color: 'teal' },
    { title: 'Yearly Revenue', value: kpis.yearlyRevenue, format: 'currency', icon: 'chart-bar', color: 'indigo' },
    { title: 'Pending Payments', value: kpis.pendingPayments, format: 'currency', icon: 'clock', color: 'amber' },
    { title: 'Active Projects', value: kpis.activeProjects, format: 'number', icon: 'briefcase', color: 'cyan' },
    { title: 'Upcoming Renewals', value: kpis.upcomingRenewals, format: 'number', icon: 'refresh', color: 'orange' },
    { title: 'Net Profit', value: kpis.netProfit, format: 'currency', icon: 'piggy-bank', color: 'emerald', positive: kpis.netProfit >= 0 },
    { title: 'Annual Projection', value: kpis.annualProjection, format: 'currency', icon: 'rocket', color: 'violet' },
    { title: 'Avg Client Value', value: kpis.avgClientValue, format: 'currency', icon: 'star', color: 'rose' },
    { title: 'Total Expenses', value: kpis.totalExpenses, format: 'currency', icon: 'receipt', color: 'red' },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
      {cards.map(card => (
        <KPICard key={card.title} {...card} />
      ))}
    </div>
  )
}

async function MonthlyOverviewSection() {
  const overview = await getMonthlyOverview()
  return <MonthlyOverviewCard data={overview} />
}

async function RevenueChartSection() {
  const data = await getRevenueChartData('monthly')
  return <RevenueChart data={data} />
}

async function RevenueDonutSection() {
  const data = await getRevenueBySource()
  return <RevenueDonut data={data} />
}

async function ExpiringSection() {
  const expiring7 = await getExpiringClients(7)
  const expiring30 = await getExpiringClients(30)
  return <ExpiringClientsWidget expiring7Days={expiring7} expiring30Days={expiring30} />
}
