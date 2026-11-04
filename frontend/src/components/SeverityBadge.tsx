const SEV: Record<string, string> = {
  CRITICAL: 'bg-red-950 text-red-300 border-red-800',
  HIGH: 'bg-orange-950 text-orange-300 border-orange-800',
  MEDIUM: 'bg-yellow-950 text-yellow-300 border-yellow-800',
  LOW: 'bg-green-950 text-green-300 border-green-800',
  INFO: 'bg-slate-900 text-slate-400 border-slate-700',
}
const PRI: Record<string, string> = {
  P1: 'bg-red-950 text-red-300 border-red-800',
  P2: 'bg-orange-950 text-orange-300 border-orange-800',
  P3: 'bg-yellow-950 text-yellow-300 border-yellow-800',
  P4: 'bg-slate-900 text-slate-400 border-slate-700',
}
const CAT: Record<string, string> = {
  secret: 'bg-purple-950 text-purple-300 border-purple-800',
  dependency: 'bg-blue-950 text-blue-300 border-blue-800',
  misconfiguration: 'bg-cyan-950 text-cyan-300 border-cyan-800',
}

export function SeverityBadge({ severity }: { severity: string }) {
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${SEV[severity] || SEV.INFO}`}>{severity}</span>
}
export function PriorityBadge({ priority }: { priority: string }) {
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${PRI[priority] || PRI.P4}`}>{priority}</span>
}
export function CategoryBadge({ category }: { category: string }) {
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${CAT[category] || 'bg-slate-900 text-slate-400 border-slate-700'}`}>{category}</span>
}

