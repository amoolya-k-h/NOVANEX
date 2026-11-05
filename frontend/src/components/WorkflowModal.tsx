import React from 'react'
import { X, ShieldAlert, FileText, Wrench, CheckCircle, Shield } from 'lucide-react'
import { useScanStore } from '../store/useScanStore'

export default function WorkflowModal() {
  const { isWorkflowModalOpen, closeWorkflowModal } = useScanStore()

  if (!isWorkflowModalOpen) return null

  const steps = [
    {
      num: '01',
      title: 'Detect',
      icon: ShieldAlert,
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
      desc: 'Gitleaks, Trivy, OSV-Scanner, and Semgrep scan concurrently in isolated containers. Code is never executed. Secrets are immediately redacted.',
    },
    {
      num: '02',
      title: 'Explain',
      icon: FileText,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      desc: 'Gemini AI translates technical findings into clear plain English, explaining the vulnerability, why it matters, and how attackers could exploit it.',
    },
    {
      num: '03',
      title: 'Fix',
      icon: Wrench,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
      desc: 'Review side-by-side code diffs, copy unified patches, and approve safe code remediations. No project files are modified without explicit developer approval.',
    },
    {
      num: '04',
      title: 'Verify',
      icon: CheckCircle,
      color: 'text-green-400 bg-green-500/10 border-green-500/20',
      desc: 'Run a verification rescan on the patched code. RepoGuard AI correlates fingerprints to confirm resolved issues and identify remaining or new vulnerabilities.',
    },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-xl bg-[#121622] rounded-2xl border border-[#212738] shadow-2xl p-6 sm:p-7 relative max-h-[90vh] overflow-y-auto text-slate-100">
        <button
          onClick={closeWorkflowModal}
          className="absolute right-5 top-5 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1a2030] transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">
          <Shield className="w-3.5 h-3.5" />
          The RepoGuard AI Philosophy
        </div>
        <h2 className="text-xl font-bold text-white pr-8">DETECT → EXPLAIN → FIX → VERIFY</h2>
        <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
          RepoGuard AI replaces static reports with a complete, end-to-end security cycle for developers.
        </p>

        <div className="mt-6 space-y-3">
          {steps.map((st) => {
            const Icon = st.icon
            return (
              <div key={st.num} className="flex items-start gap-4 p-3.5 rounded-xl bg-[#0c0e14] border border-[#1f2638]">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 border ${st.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-blue-400">{st.num}</span>
                    <h4 className="text-sm font-bold text-white">{st.title}</h4>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{st.desc}</p>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-6 pt-4 border-t border-[#1f2638] text-[11px] text-slate-500 text-center">
          Real scanning engines • Grounded Gemini AI reasoning • Zero dummy demonstrations
        </div>
      </div>
    </div>
  )
}
