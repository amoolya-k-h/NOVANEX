import { motion } from 'framer-motion'
import { ShieldAlert, AlertTriangle, AlertCircle, Info, Layers } from 'lucide-react'

const STATS = [
  { key: 'total', label: 'Total', color: 'text-slate-200', bg: 'bg-slate-500/10', border: 'border-slate-500/20', icon: Layers },
  { key: 'critical', label: 'Critical', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: ShieldAlert },
  { key: 'high', label: 'High', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', icon: AlertTriangle },
  { key: 'medium', label: 'Medium', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', icon: AlertCircle },
  { key: 'low', label: 'Low', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', icon: Info },
]

export default function StatsCards({ total, critical, high, medium, low }: { total: number; critical: number; high: number; medium: number; low: number }) {
  const v: Record<string, number> = { total, critical, high, medium, low }
  return (
    <div className="grid grid-cols-5 gap-4">
      {STATS.map(({ key, label, color, bg, border, icon: Icon }, i) => (
        <motion.div key={key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
          className={`card ${bg} border ${border} p-5 text-center`}>
          <Icon className={`w-5 h-5 ${color} mx-auto mb-2 opacity-70`} />
          <div className={`text-3xl font-black ${color}`}>{v[key]}</div>
          <div className="text-xs text-slate-500 mt-1">{label}</div>
        </motion.div>
      ))}
    </div>
  )
}

