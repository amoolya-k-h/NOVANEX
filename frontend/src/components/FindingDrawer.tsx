import React, { useState } from 'react'
import {
  X, ExternalLink, Copy, Check, Lightbulb, AlertTriangle, FileCode,
  Download, ArrowRight, ShieldCheck, Sparkles, Terminal, Brain, Wrench,
  CheckCircle, Lock, ShieldAlert, GitPullRequest
} from 'lucide-react'
import { Finding } from '../types'
import { useScanStore } from '../store/useScanStore'
import { streamAIExplanation, applyFix } from '../api/client'
import { SeverityBadge } from './SeverityBadge'
import GitHubPRModal from './GitHubPRModal'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'

interface Props {
  finding: Finding | null
  onClose: () => void
}

export default function FindingDrawer({ finding, onClose }: Props) {
  const navigate = useNavigate()
  const { openScanModal } = useScanStore()

  const [tab, setTab] = useState<'overview' | 'explanation' | 'remediation' | 'evidence'>('overview')
  const [copied, setCopied] = useState(false)
  const [aiExplanation, setAiExplanation] = useState<string>('')
  const [explaining, setExplaining] = useState(false)
  const [applying, setApplying] = useState(false)
  const [isPRModalOpen, setIsPRModalOpen] = useState(false)

  if (!finding) return null

  const handleCopyPath = () => {
    if (finding.file_path) {
      navigator.clipboard.writeText(finding.file_path)
      setCopied(true)
      toast.success('File path copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleExplainAI = () => {
    setTab('explanation')
    if (aiExplanation || finding.ai_explanation) {
      setAiExplanation(aiExplanation || finding.ai_explanation || '')
      return
    }

    setExplaining(true)
    setAiExplanation('')
    streamAIExplanation(
      finding.id,
      (chunk) => {
        setAiExplanation((prev) => prev + chunk)
      },
      () => {
        setExplaining(false)
        toast.success('AI Security Analysis complete')
      }
    )
  }

  const handleApplyFix = async () => {
    setApplying(true)
    try {
      const res = await applyFix(finding.id, true)
      if (res.data.success) {
        toast.success('Remediation patch applied! Rescan project to verify.')
        finding.status = 'remediated'
        finding.verification_status = 'pending_verification'
      } else {
        toast.error(res.data.message || 'Could not apply fix')
      }
    } catch (err: any) {
      toast.error('Failed to apply fix')
    } finally {
      setApplying(false)
    }
  }

  const isResolved = (finding.verification_status || '').toLowerCase() === 'resolved' || finding.status === 'resolved'

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end animate-fadeIn">
      <div className="w-full max-w-[680px] bg-[#111520] h-full shadow-2xl border-l border-[#212738] flex flex-col z-50 animate-slideInRight text-slate-100">
        {/* Drawer Header */}
        <div className="p-6 border-b border-[#212738] bg-[#141824] sticky top-0 z-10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SeverityBadge severity={finding.severity} />
              <span className="text-xs px-2 py-0.5 rounded font-mono bg-[#1d2334] text-slate-300 border border-[#2b354e]">
                {finding.scanner || 'Scanner'}
              </span>
              {isResolved && (
                <span className="text-xs px-2 py-0.5 rounded font-bold bg-green-500/10 text-green-400 border border-green-500/30 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Resolved
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onClose()
                  navigate(`/analyst?finding=${finding.id}`)
                }}
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 bg-[#1a2030] px-2.5 py-1 rounded-lg border border-[#26314d]"
              >
                <Brain className="w-3.5 h-3.5" /> Open in AI Analyst
              </button>
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#1f2638] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <h2 className="text-lg font-bold text-white leading-snug">
            {finding.title}
          </h2>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
            {finding.file_path && (
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#0c0e14] border border-[#212738] font-mono text-slate-300">
                <FileCode className="w-3.5 h-3.5 text-slate-500" />
                <span>{finding.file_path}</span>
                {finding.line_number && <span className="text-blue-400">:{finding.line_number}</span>}
                <button
                  onClick={handleCopyPath}
                  className="text-slate-500 hover:text-slate-300 ml-1"
                  title="Copy path"
                >
                  {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            )}
            {finding.cve_id && (
              <span className="font-mono text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                {finding.cve_id}
              </span>
            )}
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-6 pt-2 border-b border-[#212738] -mb-6 text-xs font-semibold">
            {(['overview', 'explanation', 'remediation', 'evidence'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`pb-2.5 capitalize border-b-2 transition-all ${
                  tab === t
                    ? 'border-blue-500 text-blue-400 font-bold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                {t === 'explanation' ? 'AI Explanation' : t}
              </button>
            ))}
          </div>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs leading-relaxed">
          {/* TAB 1: OVERVIEW */}
          {tab === 'overview' && (
            <div className="space-y-6">
              {/* 1. Vulnerability Description */}
              <div className="card p-4 space-y-2">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-blue-400" /> Description & Summary
                </h3>
                <p className="text-slate-300 leading-relaxed text-xs">
                  {finding.description ||
                    `A security finding was detected in ${finding.file_path || 'application code'} classified under severity ${finding.severity}.`}
                </p>
              </div>

              {/* 4 & 5. Why It Matters & Potential Impact */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="card p-4 space-y-1.5 border-amber-500/20">
                  <h4 className="font-bold text-amber-400 text-xs flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" /> Why It Matters
                  </h4>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    {finding.category === 'secret'
                      ? 'Hardcoded secrets allow anyone with repository read access to bypass authentication and impersonate trusted infrastructure.'
                      : finding.category === 'dependency'
                      ? 'Known CVEs have public exploit payloads that automated bots and malicious actors probe constantly.'
                      : finding.category === 'sast'
                      ? 'Flawed source code patterns allow injection attacks that compromise data integrity and server control.'
                      : 'Security misconfigurations weaken defense-in-depth, increasing the blast radius of any intrusion.'}
                  </p>
                </div>

                <div className="card p-4 space-y-1.5 border-red-500/20">
                  <h4 className="font-bold text-red-400 text-xs flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5" /> Potential Impact
                  </h4>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    {finding.category === 'secret'
                      ? 'Full account takeover, database exposure, or unauthorized access to cloud services.'
                      : finding.category === 'dependency'
                      ? 'Remote Code Execution (RCE), Denial of Service (DoS), or privilege escalation.'
                      : finding.category === 'sast'
                      ? 'Arbitrary database queries via SQLi, arbitrary shell command execution, or path traversal.'
                      : 'Host breakout from containers or exposed sensitive service ports to public networks.'}
                  </p>
                </div>
              </div>

              {/* Quick AI Trigger Banner */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-blue-600/15 via-indigo-600/15 to-purple-600/15 border border-blue-500/30 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white text-xs flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                    <span>Explain in simple terms with Gemini AI</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Generates beginner-friendly risk explanation and contextual guidance.
                  </p>
                </div>
                <button
                  onClick={handleExplainAI}
                  className="btn-primary text-xs py-1.5 px-3 flex-shrink-0"
                >
                  Explain with AI
                </button>
              </div>

              {/* Status and Risk Factors */}
              <div className="card p-4 space-y-3">
                <h4 className="font-bold text-slate-300 text-xs uppercase tracking-wider">
                  Verification & Risk Metrics
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-[#0c0e14] p-2.5 rounded-lg border border-[#1f2638]">
                    <div className="text-slate-500 text-[10px] uppercase">Risk Score</div>
                    <div className="font-bold text-white text-sm">{finding.risk_score || 75}/100</div>
                  </div>
                  <div className="bg-[#0c0e14] p-2.5 rounded-lg border border-[#1f2638]">
                    <div className="text-slate-500 text-[10px] uppercase">Priority</div>
                    <div className="font-bold text-orange-400 text-sm">{finding.priority || 'P1'}</div>
                  </div>
                  <div className="bg-[#0c0e14] p-2.5 rounded-lg border border-[#1f2638]">
                    <div className="text-slate-500 text-[10px] uppercase">CVSS Score</div>
                    <div className="font-bold text-red-400 text-sm">{finding.cvss_score || 'N/A'}</div>
                  </div>
                  <div className="bg-[#0c0e14] p-2.5 rounded-lg border border-[#1f2638]">
                    <div className="text-slate-500 text-[10px] uppercase">Status</div>
                    <div className="font-bold text-slate-200 capitalize text-sm">{finding.status || 'Open'}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AI EXPLANATION */}
          {tab === 'explanation' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-white text-xs">
                  <Brain className="w-4 h-4 text-purple-400" />
                  <span>Gemini Security Copilot Explanation</span>
                </div>
                {!explaining && (
                  <button
                    onClick={handleExplainAI}
                    className="btn-secondary text-[11px] py-1 px-2.5 flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3 text-blue-400" /> Re-analyze
                  </button>
                )}
              </div>

              {explaining && !aiExplanation && (
                <div className="card p-6 text-center space-y-3">
                  <Sparkles className="w-6 h-6 text-blue-400 animate-spin mx-auto" />
                  <p className="text-xs text-slate-300">Generating plain-English security explanation with Gemini...</p>
                </div>
              )}

              {aiExplanation ? (
                <div className="card p-5 bg-[#0e121c] border-[#222a3e] prose prose-invert prose-xs max-w-none space-y-2">
                  <ReactMarkdown>{aiExplanation}</ReactMarkdown>
                  {explaining && <span className="typing-cursor text-blue-400 font-bold" />}
                </div>
              ) : !explaining && (
                <div className="card p-8 text-center space-y-3">
                  <p className="text-slate-400 text-xs">Click below to generate a real-time AI explanation of this vulnerability.</p>
                  <button onClick={handleExplainAI} className="btn-primary text-xs py-2 px-4 mx-auto">
                    <Sparkles className="w-4 h-4" /> Explain with AI
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: REMEDIATION */}
          {tab === 'remediation' && (
            <div className="space-y-5">
              <div className="card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-xs flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-blue-400" /> Recommended Action
                  </h4>
                  {finding.fixed_version && (
                    <span className="text-[11px] font-mono font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/30">
                      Fixed in: {finding.fixed_version}
                    </span>
                  )}
                </div>

                <p className="text-slate-300 text-xs leading-relaxed">
                  {finding.category === 'secret'
                    ? '1. Rotate or revoke this credential immediately in your service console.\n2. Move the secret to an environment variable or secrets manager.\n3. Add credential files to .gitignore.'
                    : finding.category === 'dependency'
                    ? `Upgrade ${finding.package_name || 'package'} to version ${finding.fixed_version || 'latest stable'} in ${finding.file_path || 'requirements.txt'}.`
                    : finding.category === 'sast'
                    ? 'Replace unsanitized inputs with parameterized interfaces or strict input validation.'
                    : 'Harden configuration file by disabling insecure flags and adhering to CIS benchmarks.'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setIsPRModalOpen(true)}
                  className="btn-primary flex-1 text-xs py-2.5 flex items-center justify-center gap-1.5 bg-purple-600 hover:bg-purple-500"
                >
                  <GitPullRequest className="w-4 h-4" /> Create GitHub PR
                </button>
                <button
                  onClick={handleApplyFix}
                  disabled={applying || isResolved}
                  className="btn-secondary flex-1 text-xs py-2.5 flex items-center justify-center gap-1.5 text-green-400 hover:text-green-300"
                >
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>{applying ? 'Applying Fix...' : isResolved ? 'Fix Already Applied' : 'Approve & Apply Fix'}</span>
                </button>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    onClose()
                    navigate(`/remediation?finding=${finding.id}`)
                  }}
                  className="w-full text-xs py-2 px-3 rounded-xl bg-[#141824] hover:bg-[#1a2030] text-slate-300 hover:text-white border border-[#212738] flex items-center justify-center gap-1.5 transition"
                >
                  <Wrench className="w-3.5 h-3.5 text-blue-400" /> Open Full Remediation Studio (Side-by-Side Diff)
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: REDACTED EVIDENCE */}
          {tab === 'evidence' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-bold text-slate-200">Captured Detection Evidence</span>
                <span className="text-green-400 font-mono text-[11px]">Secrets Redacted ✓</span>
              </div>

              {finding.evidence ? (
                <div className="p-4 rounded-xl bg-[#0c0e14] border border-[#212738] font-mono text-xs text-blue-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                  {finding.evidence}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-[#0c0e14] border border-[#212738] text-slate-500 text-center">
                  Evidence captured from {finding.scanner} scanner.
                </div>
              )}

              <div className="card p-4 space-y-2 text-xs">
                <div className="font-bold text-slate-300">Detection Metadata</div>
                <div className="space-y-1 text-slate-400 text-[11px]">
                  <div>Engine: <span className="text-white font-mono">{finding.scanner}</span></div>
                  <div>Category: <span className="text-white font-mono">{finding.category}</span></div>
                  {finding.file_path && <div>File: <span className="text-white font-mono">{finding.file_path}</span></div>}
                  {finding.line_number && <div>Line: <span className="text-white font-mono">{finding.line_number}</span></div>}
                  {finding.fingerprint && <div>Fingerprint: <span className="text-slate-500 font-mono text-[10px]">{finding.fingerprint}</span></div>}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Drawer Sticky Footer */}
        <div className="p-4 border-t border-[#212738] bg-[#141824] flex items-center justify-between gap-3 sticky bottom-0 z-10">
          <button
            onClick={handleExplainAI}
            className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Explain with AI</span>
          </button>
          <button
            onClick={() => {
              onClose()
              navigate(`/remediation?finding=${finding.id}`)
            }}
            className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5 shadow-md"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Suggest Fix</span>
          </button>
        </div>
        {/* GitHub Pull Request Modal */}
        <GitHubPRModal
          finding={finding}
          isOpen={isPRModalOpen}
          onClose={() => setIsPRModalOpen(false)}
          onSuccess={() => {
            finding.status = 'remediated'
            finding.verification_status = 'pending_verification'
          }}
        />
      </div>
    </div>
  )
}
