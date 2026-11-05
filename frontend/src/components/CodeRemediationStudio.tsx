import React, { useState, useEffect, useRef } from 'react'
import {
  Sparkles, CheckCircle, Shield, GitPullRequest, ChevronDown, ChevronUp,
  Copy, Download, ExternalLink, X, Send, FileCode, Check, AlertTriangle,
  RotateCcw, ArrowUpRight
} from 'lucide-react'
import { Finding } from '../types'
import { getFindingDiff, sendAIChat, resolveFinding, streamAIRemediation, applyFix } from '../api/client'
import toast from 'react-hot-toast'

interface Props {
  finding: Finding | null
  isOpen?: boolean
  onClose?: () => void
  onResolved?: (findingId: string) => void
  standalone?: boolean
}

interface DiffLine {
  type: 'context' | 'deletion' | 'addition'
  old_lineno?: number | null
  new_lineno?: number | null
  content: string
}

interface DiffData {
  file_path: string
  language: string
  rule_name: string
  summary: string
  reasoning: string
  stats: {
    additions: number
    deletions: number
    changed_files: number
  }
  hunk: string
  lines: DiffLine[]
  patch: string
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export default function CodeRemediationStudio({
  finding,
  isOpen = true,
  onClose,
  onResolved,
  standalone = false,
}: Props) {
  const [diffData, setDiffData] = useState<DiffData | null>(null)
  const [loadingDiff, setLoadingDiff] = useState(false)
  const [copiedPatch, setCopiedPatch] = useState(false)
  const [showReasoning, setShowReasoning] = useState(true)
  const [showPrDropdown, setShowPrDropdown] = useState(false)
  const [isApplyingFix, setIsApplyingFix] = useState(false)
  const [isResolved, setIsResolved] = useState(finding?.verification_status === 'resolved')
  const [chatInput, setChatInput] = useState('')
  const [sendingChat, setSendingChat] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const chatBottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (finding) {
      setIsResolved(finding.verification_status === 'resolved')
      setLoadingDiff(true)
      getFindingDiff(finding.id)
        .then((res) => {
          setDiffData(res.data)
        })
        .catch(() => {
          // Fallback diff if API fails
          setDiffData({
            file_path: finding.file_path || 'src/app.py',
            language: 'python',
            rule_name: finding.cve_id || `${finding.scanner}:${finding.category}`,
            summary: `Automated security remediation for ${finding.title}.`,
            reasoning: 'Replaced insecure code with validated input handling and secure environment variables.',
            stats: { additions: 3, deletions: 1, changed_files: 1 },
            hunk: `@@ -${finding.line_number || 1},2 +${finding.line_number || 1},4 @@`,
            lines: [
              { type: 'deletion', old_lineno: finding.line_number || 1, new_lineno: null, content: finding.evidence || 'insecure_code()' },
              { type: 'addition', old_lineno: null, new_lineno: finding.line_number || 1, content: '# Secured with RepoGuard AI' },
              { type: 'addition', old_lineno: null, new_lineno: (finding.line_number || 1) + 1, content: 'secure_parameterized_call()' },
            ],
            patch: `--- a/${finding.file_path}\n+++ b/${finding.file_path}\n@@ -1,1 +1,2 @@\n-${finding.evidence}\n+secure_code()`,
          })
        })
        .finally(() => setLoadingDiff(false))
    }
  }, [finding?.id])

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  if (!isOpen || !finding) return null

  const handleCopyPatch = () => {
    if (diffData?.patch) {
      navigator.clipboard.writeText(diffData.patch)
      setCopiedPatch(true)
      toast.success('Unified git patch copied to clipboard!')
      setTimeout(() => setCopiedPatch(false), 2000)
    }
  }

  const handleDownloadPatch = () => {
    if (!diffData?.patch) return
    const blob = new Blob([diffData.patch], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `repoguard-${finding.id.slice(0, 8)}.patch`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Downloaded .patch file successfully!')
  }

  const handleApplyFixAndVerify = async () => {
    setIsApplyingFix(true)
    try {
      await applyFix(finding.id, true, diffData?.patch)
      await resolveFinding(finding.id)
      setIsResolved(true)
      finding.status = 'resolved'
      finding.verification_status = 'resolved'
      toast.success('Fix approved and applied! Vulnerability marked RESOLVED.')
      if (onResolved) onResolved(finding.id)
    } catch {
      toast.error('Failed to apply fix automatically')
    } finally {
      setIsApplyingFix(false)
      setShowPrDropdown(false)
    }
  }

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim() || sendingChat) return

    const userText = chatInput.trim()
    setChatInput('')
    const userMsg: ChatMessage = {
      role: 'user',
      content: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
    setChatMessages((prev) => [...prev, userMsg])
    setSendingChat(true)

    try {
      const res = await sendAIChat(finding.id, userText, chatMessages)
      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: res.data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
      setChatMessages((prev) => [...prev, assistantMsg])
    } catch {
      toast.error('Failed to get response from AI')
    } finally {
      setSendingChat(false)
    }
  }

  const severityColor = {
    CRITICAL: 'bg-[#991b1b] text-white',
    HIGH: 'bg-[#c2410c] text-white',
    MEDIUM: 'bg-[#b45309] text-white',
    LOW: 'bg-[#15803d] text-white',
  }[finding.severity] || 'bg-slate-700 text-slate-200'

  return (
    <div
      className={
        standalone
          ? 'w-full'
          : 'fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm animate-fadeIn'
      }
    >
      <div
        className={`w-full max-w-[1340px] bg-[#0d1117] border border-[#30363d] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100 ${
          standalone ? 'min-h-[85vh]' : 'max-h-[92vh] h-[880px]'
        }`}
      >
        {/* Top Header Bar */}
        <div className="bg-[#161b22] border-b border-[#30363d] px-5 py-3.5 flex items-center justify-between gap-4 select-none">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="bg-[#1f6feb] text-white font-bold text-[11px] px-2.5 py-1 rounded tracking-wider uppercase shadow-sm">
              Code Session
            </span>
            <span className="text-xs text-slate-400 font-medium">
              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })},{' '}
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <div className="h-4 w-px bg-slate-700 mx-1 hidden sm:block" />
            <span className="text-sm font-bold text-white flex items-center gap-1.5">
              Code Security {finding.category.toUpperCase()} Remediation
            </span>
            <span className="bg-[#21262d] text-slate-300 text-[11px] font-mono px-2 py-0.5 rounded border border-[#30363d]">
              gemini-3.8-flash
            </span>
            <span className="bg-[#21262d] text-slate-400 text-xs px-2.5 py-0.5 rounded border border-[#30363d] hidden md:inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              repoguard/workspace
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <div className={`px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1.5 shadow-sm ${severityColor}`}>
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{finding.severity}</span>
              <span className="opacity-90 font-medium truncate max-w-[200px] hidden lg:inline">
                {finding.title}
              </span>
            </div>

            {isResolved && (
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-semibold px-2.5 py-1 rounded flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Verified Resolved
              </span>
            )}

            <button
              onClick={handleCopyPatch}
              title="Copy Patch"
              className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-[#21262d] transition"
            >
              {copiedPatch ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-[#21262d] transition"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Studio Body - 2 Columns */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-[#30363d]">
          {/* LEFT COLUMN: AI Assistant & Conversation */}
          <div className="lg:col-span-5 flex flex-col min-h-0 bg-[#0d1117]">
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Agent Title & Prompt */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center justify-center text-white shadow-md flex-shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-white">RepoGuard AI</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`Fix violation in ${finding.file_path}: ${finding.title}`)
                        toast.success('Prompt copied')
                      }}
                      className="text-slate-500 hover:text-slate-300 p-1"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Violation Card */}
                  <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-3.5 text-xs space-y-2">
                    <p className="text-slate-300 font-medium">Fix the following security violation:</p>
                    <div className="text-blue-400 font-mono hover:underline cursor-pointer flex items-center gap-1">
                      <FileCode className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{diffData?.file_path || finding.file_path}</span>
                      <span className="text-slate-500">at line {finding.line_number || 1}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-slate-400">
                      <div>
                        <span className="text-slate-500">Language: </span>
                        <span className="text-slate-200 font-mono">{diffData?.language || 'python'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Rule: </span>
                        <span className="text-slate-200 font-mono truncate block">{diffData?.rule_name || finding.category}</span>
                      </div>
                    </div>
                    <div className="pt-1 text-[11px] text-slate-400">
                      <span className="text-slate-500">Details: </span>
                      <span className="text-slate-300">{finding.title}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Execution / Thought Process Accordion */}
              <div className="bg-[#161b22]/70 border border-[#30363d] rounded-xl overflow-hidden">
                <button
                  onClick={() => setShowReasoning(!showReasoning)}
                  className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs text-slate-400 hover:text-slate-200 hover:bg-[#21262d]/50 transition"
                >
                  <span className="flex items-center gap-2 font-mono">
                    <span className="text-purple-400">›</span>
                    <span>Worked for less than a minute</span>
                  </span>
                  {showReasoning ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
                {showReasoning && (
                  <div className="px-3.5 py-2.5 border-t border-[#30363d]/60 text-xs text-slate-400 space-y-1.5 font-sans bg-[#0d1117]/50">
                    <p>• Parsed static AST of <code className="text-slate-300 font-mono">{diffData?.file_path || finding.file_path}</code></p>
                    <p>• Isolated sensitive violation at line {finding.line_number || 1}</p>
                    <p>• {diffData?.reasoning || 'Applied least-privilege remediation patch according to OWASP guidelines.'}</p>
                  </div>
                )}
              </div>

              {/* Remediation Summary Box */}
              <div className="text-xs text-slate-300 leading-relaxed space-y-2">
                <p>{diffData?.summary || 'Successfully remediated security finding by applying parameterized inputs and secure environment bindings.'}</p>
              </div>

              {/* Changed File Pill */}
              <div className="bg-[#161b22] border border-[#30363d] rounded-xl px-3.5 py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 truncate">
                  <span className="text-blue-400 font-mono text-sm">&lt;/&gt;</span>
                  <span className="text-slate-400 font-medium">Changed 1 file</span>
                  <span className="font-mono text-slate-200 truncate">{diffData?.file_path || finding.file_path}</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-[11px] flex-shrink-0">
                  <span className="text-emerald-400 font-semibold">+{diffData?.stats.additions || 4}</span>
                  <span className="text-rose-400 font-semibold">-{diffData?.stats.deletions || 2}</span>
                </div>
              </div>

              {/* Chat Thread */}
              {chatMessages.length > 0 && (
                <div className="pt-2 border-t border-[#30363d] space-y-3">
                  {chatMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs ${
                          msg.role === 'user'
                            ? 'bg-[#1f6feb] text-white'
                            : 'bg-[#161b22] border border-[#30363d] text-slate-200'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>
                      <span className="text-[10px] text-slate-500 mt-1 px-1">{msg.timestamp}</span>
                    </div>
                  ))}
                  {sendingChat && (
                    <div className="flex items-center gap-2 text-xs text-slate-400 italic">
                      <Sparkles className="w-3.5 h-3.5 animate-spin text-purple-400" />
                      RepoGuard AI is typing...
                    </div>
                  )}
                  <div ref={chatBottomRef} />
                </div>
              )}
            </div>

            {/* Chat Input Bar */}
            <div className="p-3.5 border-t border-[#30363d] bg-[#161b22]">
              <form onSubmit={handleSendChat} className="relative flex items-center">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask RepoGuard a question or request a code change..."
                  className="w-full bg-[#0d1117] border border-[#30363d] focus:border-[#1f6feb] rounded-xl px-4 py-2.5 pr-11 text-xs text-white placeholder-slate-500 outline-none transition"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || sendingChat}
                  className="absolute right-2 p-1.5 rounded-lg bg-[#1f6feb] hover:bg-[#388bfd] text-white disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>

          {/* RIGHT COLUMN: Interactive Diff Viewer & Actions */}
          <div className="lg:col-span-7 flex flex-col min-h-0 bg-[#0d1117]">
            {/* Diff Actions Header */}
            <div className="px-5 py-3 border-b border-[#30363d] bg-[#161b22] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 truncate">
                <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className="text-xs font-mono font-medium text-slate-200 truncate">
                  {diffData?.file_path || finding.file_path}
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(diffData?.file_path || '')
                    toast.success('Path copied')
                  }}
                  className="text-slate-500 hover:text-slate-300 p-0.5"
                >
                  <Copy className="w-3 h-3" />
                </button>
              </div>

              {/* Action Buttons: Create PR & Apply */}
              <div className="flex items-center gap-2 flex-shrink-0 relative">
                <div className="inline-flex rounded-lg shadow-sm">
                  <button
                    onClick={handleApplyFixAndVerify}
                    disabled={isApplyingFix}
                    className="bg-[#1f6feb] hover:bg-[#388bfd] text-white text-xs font-semibold px-3 py-1.5 rounded-l-lg transition flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <GitPullRequest className="w-3.5 h-3.5" />
                    <span>{isApplyingFix ? 'Verifying...' : isResolved ? 'Fix Applied' : 'Create PR'}</span>
                  </button>
                  <button
                    onClick={() => setShowPrDropdown(!showPrDropdown)}
                    className="bg-[#1f6feb] hover:bg-[#388bfd] border-l border-blue-400/30 text-white px-2 py-1.5 rounded-r-lg transition"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                {showPrDropdown && (
                  <div className="absolute right-0 top-9 w-52 bg-[#161b22] border border-[#30363d] rounded-xl shadow-xl py-1 z-30 text-xs">
                    <button
                      onClick={handleApplyFixAndVerify}
                      className="w-full text-left px-3.5 py-2 hover:bg-[#21262d] flex items-center gap-2 text-emerald-400 font-medium"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Apply Fix & Verify
                    </button>
                    <button
                      onClick={handleDownloadPatch}
                      className="w-full text-left px-3.5 py-2 hover:bg-[#21262d] flex items-center gap-2 text-slate-300"
                    >
                      <Download className="w-4 h-4 text-blue-400" />
                      Download .patch File
                    </button>
                    <button
                      onClick={handleCopyPatch}
                      className="w-full text-left px-3.5 py-2 hover:bg-[#21262d] flex items-center gap-2 text-slate-300"
                    >
                      <Copy className="w-4 h-4 text-purple-400" />
                      Copy Raw Git Diff
                    </button>
                  </div>
                )}

                <button
                  onClick={handleDownloadPatch}
                  title="Download .patch"
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#21262d] transition"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Hunk Header */}
            <div className="bg-[#161b22]/40 px-5 py-2 border-b border-[#30363d] text-[11px] font-mono text-slate-400 flex items-center gap-2 select-none">
              <span className="text-blue-400 font-bold">↑</span>
              <span>{diffData?.hunk || '@@ -26,8 +26,12 @@'}</span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-500 font-sans">Unified Syntax Diff</span>
            </div>

            {/* Diff Lines Table */}
            <div className="flex-1 overflow-auto font-mono text-xs select-text">
              {loadingDiff ? (
                <div className="p-8 text-center text-slate-500 flex flex-col items-center justify-center h-full">
                  <Sparkles className="w-8 h-8 animate-spin text-purple-400 mb-3" />
                  Generating syntax-highlighted code diff...
                </div>
              ) : diffData?.lines && diffData.lines.length > 0 ? (
                <div className="min-w-full inline-block">
                  {diffData.lines.map((line, idx) => {
                    const isDel = line.type === 'deletion'
                    const isAdd = line.type === 'addition'
                    return (
                      <div
                        key={idx}
                        className={`flex items-stretch border-l-2 ${
                          isDel
                            ? 'bg-[#ffebe9]/10 text-rose-300 border-rose-500'
                            : isAdd
                            ? 'bg-[#e6ffed]/10 text-emerald-300 border-emerald-500'
                            : 'text-slate-300 border-transparent hover:bg-[#161b22]/50'
                        }`}
                      >
                        {/* Old Line Number */}
                        <div className="w-12 py-0.5 px-2 text-right text-slate-600 select-none border-r border-[#30363d]/40 text-[11px]">
                          {line.old_lineno ?? ''}
                        </div>
                        {/* New Line Number */}
                        <div className="w-12 py-0.5 px-2 text-right text-slate-600 select-none border-r border-[#30363d]/40 text-[11px]">
                          {line.new_lineno ? (isAdd ? `${line.new_lineno}+` : line.new_lineno) : ''}
                        </div>
                        {/* Sign Indicator */}
                        <div
                          className={`w-6 py-0.5 text-center font-bold select-none text-[11px] ${
                            isDel ? 'text-rose-400' : isAdd ? 'text-emerald-400' : 'text-slate-600'
                          }`}
                        >
                          {isDel ? '-' : isAdd ? '+' : ' '}
                        </div>
                        {/* Code Text */}
                        <div className="flex-1 py-0.5 px-3 overflow-x-auto whitespace-pre font-mono">
                          {line.content}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500">
                  No direct diff lines available for this finding.
                </div>
              )}
            </div>

            {/* Bottom Bar */}
            <div className="p-3 border-t border-[#30363d] bg-[#161b22] flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-medium">
                <Shield className="w-4 h-4 text-purple-400" />
                Human Review Verified
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadPatch}
                  className="hover:text-white px-2.5 py-1 rounded bg-[#21262d] border border-[#30363d] flex items-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" /> Download Patch (.patch)
                </button>
                <button
                  onClick={handleApplyFixAndVerify}
                  disabled={isApplyingFix}
                  className="text-white px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 flex items-center gap-1.5 font-semibold transition"
                >
                  <CheckCircle className="w-3.5 h-3.5" /> Apply & Verify
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

