import { motion } from 'framer-motion'
import { CheckCircle, Loader2, Clock } from 'lucide-react'

const scanners = [
  { key: 'gitleaks_done', name: 'Gitleaks', desc: 'Secret Detection' },
  { key: 'trivy_done', name: 'Trivy', desc: 'Vulns & Config' },
  { key: 'osv_done', name: 'OSV-Scanner', desc: 'Dependency Analysis' },
]

export default function ScanProgress({ progress }: { progress: any }) {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-slate-400">{progress.current_step}</span>
          <span className="text-blue-400 font-medium">{progress.progress}%</span>
        </div>
        <div className="h-2 bg-[#0d1117] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress.progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {scanners.map(({ key, name, desc }) => {
          const done = !!progress[key]
          const running = !done && progress.status === 'scanning'
          return (
            <div key={key} className="card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-200">{name}</span>
                {done ? <CheckCircle className="w-4 h-4 text-green-400" />
                  : running ? <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                  : <Clock className="w-4 h-4 text-slate-600" />}
              </div>
              <div className="text-xs text-slate-500">{desc}</div>
              <div className={`mt-2 h-1 rounded-full ${done ? 'bg-green-500' : running ? 'bg-blue-500 animate-pulse' : 'bg-[#2d3748]'}`} />
            </div>
          )
        })}
      </div>
      {progress.findings_count > 0 && (
        <p className="text-center text-slate-400 text-sm">
          <span className="text-white font-bold text-lg">{progress.findings_count}</span> findings detected
        </p>
      )}
    </div>
  )
}

