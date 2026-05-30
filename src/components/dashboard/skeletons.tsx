// src/components/dashboard/skeletons.tsx
export function KPICardSkeleton() {
  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-900/80 p-5 animate-pulse">
      <div className="w-9 h-9 rounded-lg bg-slate-700 mb-3" />
      <div className="h-7 bg-slate-700 rounded w-24 mb-2" />
      <div className="h-3 bg-slate-800 rounded w-20" />
    </div>
  )
}

export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr className="border-b border-slate-800">
      {Array(cols).fill(0).map((_, i) => (
        <td key={i} className="px-5 py-4">
          <div className="h-4 bg-slate-800 rounded animate-pulse" style={{ width: `${60 + Math.random() * 40}%` }} />
        </td>
      ))}
    </tr>
  )
}

export function CardSkeleton({ height = 'h-48' }: { height?: string }) {
  return (
    <div className={`${height} rounded-xl border border-slate-700/50 bg-slate-900/80 animate-pulse`} />
  )
}

export function ProfileSkeleton() {
  return (
    <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-6 animate-pulse">
      <div className="flex gap-4">
        <div className="w-16 h-16 rounded-2xl bg-slate-700 flex-shrink-0" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-5 bg-slate-700 rounded w-48" />
          <div className="h-4 bg-slate-800 rounded w-32" />
          <div className="h-3 bg-slate-800 rounded w-64" />
        </div>
      </div>
    </div>
  )
}
