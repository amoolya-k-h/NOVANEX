import { useState } from 'react'
import {
  ChevronDown, ChevronRight, ExternalLink, Shield, Package, FileCode,
  Sparkles, CheckCircle2, Wrench, AlertCircle
} from 'lucide-react'
import { Finding } from '../types'
import { SeverityBadge, PriorityBadge } from './SeverityBadge'

const ICONS: Record<string, any> = { secret: Shield, dependency: Package, misconfiguration: FileCode }
const CAT_BG: Record<string, string> = { secret: 'bg-purple-500/20', dependency: 'bg-blue-500/20', misconfiguration: 'bg-cyan-500/20' }
const CAT_CLR: Record<string, string> = { secret: 'text-purple-400', dependency: 'text-blue-400', misconfiguration: 'text-cyan-400' }

export default function FindingCard({
  finding,
  selected,
  onClick,
  onFixWithAI,
}: {
  finding: Finding
  selected?: boolean
  onClick?: () => void
  onFixWithAI?: (f: Finding) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const Icon = ICONS[finding.category] || Shield
  const isResolved = finding.verification_status === 'resolved'

  return (
    <div
      className={`card transition-all duration-200 cursor-pointer ${
        selected
          ? 'border-blue-500/60 bg-blue-500/5'
          : isResolved
          ? 'border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/50'
          : 'hover:border-[#3d4a5c]'
      }`}
      onClick={onClick}
    >
      <div className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3.5 min-w-0">
            <div
              className={`mt-0.5 w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                CAT_BG[finding.category] || 'bg-slate-500/20'
              }`}
            >
              <Icon className={`w-4 h-4 ${CAT_CLR[finding.category] || 'text-slate-400'}`} />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-slate-100 text-sm truncate">{finding.title}</p>
                {isResolved ? (
                  <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Resolved
                  </span>
                ) : (
                  <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Unresolved
                  </span>
                )}
                <span className="bg-[#21262d] text-slate-400 text-[10px] font-mono px-2 py-0.5 rounded border border-[#30363d] uppercase">
                  {finding.scanner}
                </span>
              </div>

              {finding.file_path && (
                <p className="text-xs text-slate-400 font-mono mt-1 truncate flex items-center gap-1.5">
                  <span className="text-slate-600">file:</span>
                  <span className="text-blue-400/90">{finding.file_path}</span>
                  {finding.line_number && <span className="text-slate-500">:{finding.line_number}</span>}
                </p>
              )}
            </div>
          </div>

          {/* Right Badges & Action */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap flex-shrink-0">
            <SeverityBadge severity={finding.severity} />
            <PriorityBadge priority={finding.priority} />

            <button
              onClick={(e) => {
                e.stopPropagation()
                if (onFixWithAI) onFixWithAI(finding)
              }}
              className="bg-[#1f6feb] hover:bg-[#388bfd] text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Fix with AI Studio</span>
            </button>
          </div>
        </div>

        {/* Expand / Details Toggle */}
        <div className="mt-3 flex items-center justify-between border-t border-[#30363d]/50 pt-2.5">
          <button
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors font-medium"
            onClick={(e) => {
              e.stopPropagation()
              setExpanded(!expanded)
            }}
          >
            {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            {expanded ? 'Hide vulnerability evidence' : 'View vulnerability evidence'}
          </button>

          <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
            <span>Risk Score:</span>
            <span className="text-slate-300 font-semibold">{finding.risk_score?.toFixed(0)}/100</span>
          </div>
        </div>

        {expanded && (
          <div className="mt-3 space-y-2.5 border-t border-[#30363d] pt-3 animate-fadeIn">
            {finding.description && (
              <p className="text-xs text-slate-300 leading-relaxed bg-[#161b22] p-3 rounded-lg border border-[#30363d]/50">
                {finding.description}
              </p>
            )}

            {finding.evidence && (
              <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-2.5">
                <div className="text-[11px] text-slate-400 mb-1 font-medium">Scanner Raw Evidence:</div>
                <code className="text-xs text-purple-300 font-mono break-all">{finding.evidence}</code>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 text-xs pt-1">
              {finding.cve_id && (
                <a
                  href={`https://nvd.nist.gov/vuln/detail/${finding.cve_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-blue-400 hover:text-blue-300 underline font-mono"
                  onClick={(e) => e.stopPropagation()}
                >
                  {finding.cve_id} <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {finding.cvss_score && (
                <span className="text-slate-400 bg-[#161b22] px-2 py-0.5 rounded border border-[#30363d]">
                  CVSS: <strong className="text-amber-400">{finding.cvss_score}</strong>
                </span>
              )}
              {finding.package_name && (
                <span className="text-slate-300 bg-[#161b22] px-2.5 py-0.5 rounded border border-[#30363d]">
                  📦 <strong className="text-blue-300">{finding.package_name}</strong> {finding.package_version}
                  {finding.fixed_version && (
                    <span className="text-emerald-400 ml-1 font-semibold">→ {finding.fixed_version}</span>
                  )}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
