import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield, Search, Lightbulb, Wrench, CheckCircle, ArrowRight, Zap, Lock } from 'lucide-react'

const features = [
  { icon: Search, color: 'text-blue-400', bg: 'bg-blue-500/10', title: 'DETECT', desc: 'Gitleaks, Trivy & OSV-Scanner find secrets, vulnerable deps, and misconfigurations in parallel' },
  { icon: Lightbulb, color: 'text-amber-400', bg: 'bg-amber-500/10', title: 'EXPLAIN', desc: 'Gemini AI translates technical findings into clear, actionable developer-friendly language' },
  { icon: Wrench, color: 'text-purple-400', bg: 'bg-purple-500/10', title: 'FIX', desc: 'AI-generated remediation with specific patches, version upgrades, and secure configuration changes' },
  { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10', title: 'VERIFY', desc: 'Rescan confirms fixes are applied — real verification, not just AI suggestions' },
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#0f1117] grid-bg">
      <nav className="border-b border-[#2d3748] bg-[#0f1117]/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-400" />
            </div>
            <span className="font-bold text-white">Repo<span className="text-amber-400">Guard</span> AI</span>
          </div>
          <Link to="/upload" className="btn-primary flex items-center gap-2">
            <Zap className="w-4 h-4" /> Scan Your Project
          </Link>
        </div>
      </nav>

      <section className="max-w-7xl mx-auto px-6 pt-24 pb-16 text-center">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 text-sm text-blue-400 mb-8">
            <Zap className="w-4 h-4" /> AI-Powered Developer Security Scanner
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-white leading-tight mb-6 max-w-4xl mx-auto">
            Secure Your Code Before <span className="text-amber-400">Attackers Find the Flaws.</span>
          </h1>
          <div className="flex items-center justify-center gap-4 text-xl font-bold mb-6">
            <span className="text-blue-400">DETECT</span>
            <span className="text-[#2d3748]">·</span>
            <span className="text-amber-400">EXPLAIN</span>
            <span className="text-[#2d3748]">·</span>
            <span className="text-purple-400">FIX</span>
            <span className="text-[#2d3748]">·</span>
            <span className="text-green-400">VERIFY</span>
          </div>
          <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto mb-10 leading-relaxed">
            Detect vulnerabilities, understand security risks, get actionable fixes and verify every improvement with RepoGuard AI.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link to="/upload" className="btn-primary flex items-center gap-2 text-base px-8 py-3.5">
              Start Free Scan <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/dashboard" className="btn-secondary flex items-center gap-2 text-base px-8 py-3.5">
              Explore Features
            </Link>
          </div>
        </motion.div>

        <div className="grid grid-cols-4 gap-4 mt-16 max-w-lg mx-auto">
          {[['3', 'Security Scanners'], ['AI', 'Gemini Powered'], ['360°', 'Coverage'], ['∞', 'Projects']].map(([v, l], i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.1 }} className="text-center">
              <div className="text-3xl font-black text-blue-400">{v}</div>
              <div className="text-xs text-slate-500 mt-1">{l}</div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-4 gap-6">
          {features.map(({ icon: Icon, color, bg, title, desc }, i) => (
            <motion.div key={title} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + i * 0.15 }}
              className="card p-6 text-center hover:border-[#3d4a5c] transition-colors">
              <div className={`w-14 h-14 rounded-xl ${bg} flex items-center justify-center mx-auto mb-4`}>
                <Icon className={`w-7 h-7 ${color}`} />
              </div>
              <div className={`text-sm font-black tracking-widest ${color} mb-2`}>{title}</div>
              <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
          className="flex items-center justify-center gap-8 mt-14">
          <span className="text-sm text-slate-500">Powered by:</span>
          {['Gitleaks', 'Trivy', 'OSV-Scanner', 'Gemini AI'].map(t => (
            <div key={t} className="flex items-center gap-2 bg-[#1a1f2e] border border-[#2d3748] rounded-full px-4 py-1.5">
              <Lock className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-sm text-slate-300 font-medium">{t}</span>
            </div>
          ))}
        </motion.div>
      </section>
    </div>
  )
}

