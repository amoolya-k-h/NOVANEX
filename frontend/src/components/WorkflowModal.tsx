import React from 'react'
import { X, ShieldAlert, FileText, Wrench, CheckCircle } from 'lucide-react'
import { useScanStore } from '../store/useScanStore'

export default function WorkflowModal() {
  const { isWorkflowModalOpen, closeWorkflowModal } = useScanStore()

  if (!isWorkflowModalOpen) return null

  const steps = [
    {
      num: '01',
      title: 'Detect',
      icon: ShieldAlert,
      desc: 'Gitleaks and Trivy identify secrets, vulnerable dependencies, and supported insecure configurations. Your application code is never run.',
    },
    {
      num: '02',
      title: 'Explain',
      icon: FileText,
      desc: 'Understand the scanner evidence, why it matters, and what to do next. Rule-based guidance is clearly labeled when an LLM is not connected.',
    },
    {
      num: '03',
      title: 'Fix',
      icon: Wrench,
      desc: 'Upload your ZIP, review supported edit proposals, and approve changes in the website. Download a separate edited archive; your original is never overwritten.',
    },
    {
      num: '04',
      title: 'Verify',
      icon: CheckCircle,
      desc: 'Run the same scanner again. Compare the results to distinguish resolved, still-open, and newly detected findings.',
    },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-xl bg-white rounded-3xl border border-[#eaecf0] shadow-2xl p-6 sm:p-7 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={closeWorkflowModal}
          className="absolute right-5 top-5 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold text-slate-900 pr-8">A complete security workflow</h2>
        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
          RepoGuard brings your security workflow into one place, from the first finding to evidence of a verified fix.
        </p>

        <div className="mt-6 space-y-4">
          {steps.map((st) => {
            const Icon = st.icon
            return (
              <div key={st.num} className="flex items-start gap-4 p-3.5 rounded-2xl hover:bg-slate-50 transition border border-transparent hover:border-[#eaecf0]">
                <div className="w-10 h-10 rounded-xl bg-[#fff7ed] text-[#ea580c] flex items-center justify-center font-bold text-xs flex-shrink-0 border border-[#ffedd5]">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-[#ea580c]">{st.num}</span>
                    <h4 className="text-sm font-bold text-slate-900">{st.title}</h4>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{st.desc}</p>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-6 pt-4 border-t border-[#eaecf0] text-[11px] text-slate-400 text-center">
          This workspace uses real controlled-fixture scans and live vulnerability engines.
        </div>
      </div>
    </div>
  )
}

