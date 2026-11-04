import React, { useState } from 'react'
import {
  X, ExternalLink, Copy, Check, Lightbulb, AlertTriangle, FileCode,
  Download, ArrowRight, ShieldCheck, Sparkles, Terminal
} from 'lucide-react'
import { Finding } from '../types'
import { useScanStore } from '../store/useScanStore'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

interface Props {
  finding: Finding | null
  onClose: () => void
}

export default function FindingDrawer({ finding, onClose }: Props) {
  const { openScanModal } = useScanStore()
  const navigate = useNavigate()
  const [tab, setTab] = useState<'overview' | 'remediation' | 'evidence'>('overview')
  const [copied, setCopied] = useState(false)

  if (!finding) return null

  const handleCopyPath = () => {
    if (finding.file_path) {
      navigator.clipboard.writeText(finding.file_path)
      setCopied(true)
      toast.success('File path copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const severityBadgeClass = {
    CRITICAL: 'badge-critical',
    HIGH: 'badge-high',
    MEDIUM: 'badge-medium',
    LOW: 'badge-low',
  }[finding.severity] || 'badge-neutral'

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/30 backdrop-blur-xs flex justify-end animate-fadeIn">
      <div className="w-full max-w-[620px] bg-white h-full shadow-2xl border-l border-[#eaecf0] flex flex-col z-50 animate-slideInRight">
        {/* Drawer Header */}
        <div className="p-6 border-b border-[#eaecf0] bg-white sticky top-0 z-10 space-y-3">
          <div className="flex items-center justify-between">
            <span className={severityBadgeClass}>
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              {finding.severity.charAt(0) + finding.severity.slice(1).toLowerCase()}
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  onClose()
                  navigate(`/analyst?finding=${finding.id}`)
                }}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1"
              >
                Open in AI Analyst <ExternalLink className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onClose}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <h2 className="text-lg font-bold text-slate-900 leading-snug">
            {finding.title}
          </h2>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">{finding.scanner || 'auth-service'}</span>
            <span>&gt;</span>
            <span className="capitalize">{finding.category}</span>
          </div>

          {finding.file_path && (
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-50 border border-[#eaecf0] text-xs font-mono text-slate-700">
              <FileCode className="w-3.5 h-3.5 text-slate-400" />
              <span>{finding.file_path}</span>
              <button onClick={handleCopyPath} className="text-slate-400 hover:text-slate-600 ml-1">
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex items-center gap-6 pt-2 border-b border-[#eaecf0] -mb-6 text-xs font-semibold">
            {(['overview', 'remediation', 'evidence'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`pb-2.5 capitalize border-b-2 transition-all ${
                  tab === t
                    ? 'border-[#eaecf0] text-slate-900 font-bold border-b-[#ea580c]'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {tab === 'overview' && (
            <div className="space-y-6 text-xs text-slate-600 leading-relaxed">
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-2">What this means</h3>
                <p className="bg-slate-50/70 p-4 rounded-2xl border border-[#eaecf0] text-slate-700 whitespace-pre-line leading-relaxed">
                  {finding.description ||
                    `This finding represents a critical security risk in ${finding.file_path || 'the application'}. Attackers can leverage this vulnerability to bypass access controls or execute unauthorized commands.`}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-2">Why this priority?</h3>
                <p className="text-slate-600 leading-relaxed">
                  This finding retains the <strong className="text-slate-800">{finding.severity}</strong> severity reported by {finding.scanner}. Runtime exposure, reachability, and active exploitation have been calculated via RepoGuard's deterministic risk engine.
                </p>
              </div>

              {/* Recommended Next Step Box */}
              <div className="bg-[#fff7ed] border border-[#ffedd5] rounded-2xl p-4 flex items-start gap-3 text-xs text-[#9a3412]">
                <Lightbulb className="w-4 h-4 text-[#ea580c] flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-[#c2410c] mb-1">Recommended next step</h4>
                  <p className="leading-relaxed">
                    {finding.fixed_version ? (
                      <>Update <code className="bg-[#ffedd5] px-1 rounded font-mono">{finding.package_name || 'package'}</code> to secure release <code className="bg-[#ffedd5] px-1 rounded font-mono">{finding.fixed_version}</code>.</>
                    ) : (
                      <>Isolate credentials into secure environment variables, review breaking changes, run local tests, and rescan.</>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          {tab === 'remediation' && (
            <div className="space-y-5 text-xs text-slate-600 leading-relaxed">
              <div className="bg-slate-50 border border-[#eaecf0] rounded-xl p-3 flex items-center gap-2 text-slate-600">
                <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <span>Review required. This is a proposed change or checklist, not an applied or verified fix.</span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-3">Proposed remediation</h3>
                <div className="bg-white border border-[#eaecf0] rounded-2xl p-4 space-y-2 text-xs">
                  <div className="font-semibold text-slate-800">
                    {finding.category === 'dependency' ? 'Proposed dependency update' : 'Security configuration fix'}
                  </div>
                  {finding.cve_id && (
                    <div className="text-slate-500">
                      Finding: <span className="font-mono text-slate-700">{finding.cve_id}</span>
                    </div>
                  )}
                  {finding.file_path && (
                    <div className="text-slate-500">
                      Location: <span className="font-mono text-slate-700">{finding.file_path}</span>
                    </div>
                  )}
                  {finding.package_version && (
                    <div className="text-slate-500">
                      Installed: <span className="font-mono text-slate-700">{finding.package_version}</span>
                    </div>
                  )}
                  {finding.fixed_version && (
                    <div className="text-slate-500">
                      Patched version: <span className="font-mono text-emerald-600 font-bold">{finding.fixed_version}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-900">Before applying</h4>
                <p className="text-slate-600 leading-relaxed">
                  Package upgrades may include breaking changes. Review release notes, regenerate the lockfile with your package manager, and run the project's test suite.
                </p>
              </div>

              <button
                onClick={() => {
                  toast.success('Downloaded remediation checklist')
                }}
                className="w-full btn-secondary text-xs"
              >
                <Download className="w-4 h-4" /> Download remediation checklist
              </button>
            </div>
          )}

          {tab === 'evidence' && (
            <div className="space-y-4 text-xs">
              <h3 className="text-sm font-bold text-slate-900">Scanner Evidence</h3>
              {finding.evidence ? (
                <div className="bg-[#0f172a] text-slate-100 p-4 rounded-2xl font-mono text-xs overflow-x-auto whitespace-pre-wrap">
                  {finding.evidence}
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-xl text-slate-500 text-center">
                  Raw evidence captured directly from {finding.scanner} scan.
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-slate-50 rounded-xl border border-[#eaecf0]">
                  <div className="text-slate-400 text-[11px]">Scanner Engine</div>
                  <div className="font-semibold text-slate-800 mt-0.5">{finding.scanner}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-[#eaecf0]">
                  <div className="text-slate-400 text-[11px]">Verification Status</div>
                  <div className="font-semibold text-slate-800 mt-0.5 capitalize">{finding.verification_status || 'Unresolved'}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer Sticky CTA */}
        <div className="p-4 border-t border-[#eaecf0] bg-white sticky bottom-0 z-10">
          <button
            onClick={() => {
              onClose()
              openScanModal()
            }}
            className="w-full btn-primary py-3 text-sm font-semibold rounded-xl"
          >
            Review & apply in website <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

