import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Brain, Sparkles, Send, Shield, ChevronDown, CheckCircle, AlertTriangle,
  FileCode, ExternalLink, ArrowRight, Plus, Terminal
} from 'lucide-react'
import Layout from '../components/Layout'
import { useScanStore } from '../store/useScanStore'
import { getFinding, sendAIChat, streamAIExplanation } from '../api/client'
import { Finding } from '../types'
import toast from 'react-hot-toast'

export default function Analyst() {
  const [searchParams] = useSearchParams()
  const { openScanModal, openDrawer, findings } = useScanStore()

  const findingId = searchParams.get('finding')
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null)
  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState<Array<{ role: string; text: string }>>([])
  const [streaming, setStreaming] = useState(false)

  // Default findings list if store is empty
  const defaultList = [
    {
      id: 'f-axios',
      title: 'axios: axios: Unintended HTTP method override via prototype pollution gadget',
      category: 'dependency',
      severity: 'MEDIUM',
      file_path: 'ecommerce-api',
      scanner: 'Trivy',
      cve_id: 'CVE-2024-39338',
      description: 'Prototype pollution in axios allows HTTP method override in specific Node configurations.',
      fixed_version: '1.7.4',
      package_name: 'axios',
      package_version: '1.6.8',
      verification_status: 'resolved',
    },
    {
      id: 'f-vm2',
      title: "vm2: vm2 NodeVM builtin '[]' exposes 'os' and 'dns'",
      category: 'dependency',
      severity: 'CRITICAL',
      file_path: 'package-lock.json',
      scanner: 'Trivy',
      cve_id: 'GHSA-9g8x-92q2-p28f',
      description: 'Host sandbox escape via NodeVM builtin array access.',
      fixed_version: '3.11.6',
      package_name: 'vm2',
      package_version: '3.9.16',
      verification_status: 'unresolved',
    },
    {
      id: 'f-docker',
      title: 'No HEALTHCHECK defined',
      category: 'misconfiguration',
      severity: 'LOW',
      file_path: 'Dockerfile',
      scanner: 'Trivy',
      description: 'Container does not define an automated healthcheck directive.',
      verification_status: 'unresolved',
    },
  ]

  const availableFindings: Finding[] = (findings.length > 0 ? findings : defaultList) as any as Finding[]

  useEffect(() => {
    if (findingId) {
      getFinding(findingId)
        .then((res) => setSelectedFinding(res.data))
        .catch(() => {
          const match = availableFindings.find((f) => f.id === findingId)
          if (match) setSelectedFinding(match)
        })
    } else if (!selectedFinding && availableFindings.length > 0) {
      setSelectedFinding(availableFindings[0])
    }
  }, [findingId, availableFindings])

  const handleAsk = async (query: string) => {
    if (!selectedFinding || !query.trim() || streaming) return

    const userText = query.trim()
    setChatInput('')
    setChatMessages((prev) => [...prev, { role: 'user', text: userText }])
    setStreaming(true)

    try {
      const res = await sendAIChat(selectedFinding.id, userText)
      setChatMessages((prev) => [...prev, { role: 'assistant', text: res.data.reply }])
    } catch {
      // Fallback response
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `Regarding **${selectedFinding.title}**: The primary risk stems from insecure defaults or known public CVE exposure in \`${selectedFinding.file_path || 'application code'}\`. We recommend migrating to the verified patched version (${selectedFinding.fixed_version || 'latest secure release'}) and running an automated verification rescan to confirm resolution.`,
        },
      ])
    } finally {
      setStreaming(false)
    }
  }

  const severityBadgeClass = {
    CRITICAL: 'badge-critical',
    HIGH: 'badge-high',
    MEDIUM: 'badge-medium',
    LOW: 'badge-low',
  }[selectedFinding?.severity || 'MEDIUM'] || 'badge-neutral'

  return (
    <Layout>
      <div className="max-w-[1200px] mx-auto space-y-7">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              Controlled fixtures, real scan evidence.
            </div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                AI Analyst
              </h1>
              <span className="bg-[#ffedd5] text-[#ea580c] text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                Beta
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Understand the evidence. Get grounded, actionable guidance.
            </p>
          </div>

          <button onClick={openScanModal} className="btn-primary text-xs font-bold px-4 py-2">
            <Plus className="w-4 h-4" />
            <span>New scan</span>
          </button>
        </div>

        {/* Card 1: Your Security Explained */}
        <div className="card p-7 space-y-6">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Your security, explained.</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Grounded in scanner evidence. Built for developers.
            </p>
          </div>

          {/* Finding Selector Dropdown */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Start with a finding
            </label>
            <div className="relative max-w-xl">
              <select
                value={selectedFinding?.id || ''}
                onChange={(e) => {
                  const match = availableFindings.find((f) => f.id === e.target.value)
                  if (match) {
                    setSelectedFinding(match)
                    setChatMessages([])
                  }
                }}
                className="w-full bg-[#fbfbfc] border border-[#eaecf0] text-xs font-medium text-slate-800 rounded-xl px-4 py-2.5 pr-10 outline-none focus:border-[#ea580c] appearance-none cursor-pointer shadow-sm truncate"
              >
                {availableFindings.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.title} — {f.file_path || f.scanner}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Empty State / Prompt Suggestions or Chat Messages */}
          {chatMessages.length === 0 ? (
            <div className="bg-[#fbfbfc] border border-[#eaecf0] rounded-2xl p-8 text-center space-y-4 max-w-2xl mx-auto">
              <div className="w-10 h-10 rounded-2xl bg-[#fff7ed] text-[#ea580c] flex items-center justify-center mx-auto border border-[#ffedd5]">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">From finding to understanding.</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
                  Select a finding, then ask about its impact, recommended fix, or how to verify your changes.
                </p>
              </div>

              {/* 3 Quick Prompt Pills */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <button
                  onClick={() => handleAsk('Explain this finding and what it means in detail.')}
                  className="btn-secondary text-xs px-3.5 py-1.5 rounded-full"
                >
                  Explain this finding <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleAsk('How should I fix this vulnerability securely?')}
                  className="btn-secondary text-xs px-3.5 py-1.5 rounded-full"
                >
                  How should I fix this? <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleAsk('How do I verify the fix was successful?')}
                  className="btn-secondary text-xs px-3.5 py-1.5 rounded-full"
                >
                  How do I verify the fix? <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-[#ea580c] text-white shadow-sm'
                        : 'bg-slate-50 border border-[#eaecf0] text-slate-800'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>
                </div>
              ))}
              {streaming && (
                <div className="flex items-center gap-2 text-xs text-slate-400 italic">
                  <Sparkles className="w-3.5 h-3.5 animate-spin text-[#ea580c]" />
                  RepoGuard AI is generating answer...
                </div>
              )}
            </div>
          )}

          {/* Chat Input Bar */}
          <div className="space-y-1.5">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleAsk(chatInput)
              }}
              className="relative flex items-center"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about this finding..."
                className="w-full bg-[#fbfbfc] border border-[#eaecf0] focus:border-[#ea580c] rounded-xl px-4 py-3 pr-12 text-xs text-slate-800 placeholder-slate-400 outline-none transition shadow-sm"
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || streaming}
                className="absolute right-2.5 p-2 rounded-lg bg-[#ea580c] hover:bg-[#c2410c] text-white disabled:opacity-40 transition shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
            <p className="text-[10px] text-slate-400">
              Never paste credentials. Guidance is not proof of a verified fix.
            </p>
          </div>
        </div>

        {/* Card 2: Evidence in Context */}
        {selectedFinding && (
          <div className="card p-7 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Evidence in context</h3>
              <span className={severityBadgeClass}>
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                {selectedFinding.severity.charAt(0) + selectedFinding.severity.slice(1).toLowerCase()}
              </span>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 text-sm">{selectedFinding.title}</h4>
              <p className="text-xs text-slate-400 mt-0.5">{selectedFinding.file_path || selectedFinding.scanner}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-[#eaecf0]">
                <div className="text-[11px] text-slate-400">Scanner</div>
                <div className="font-semibold text-slate-800 mt-0.5">{selectedFinding.scanner || 'Trivy'}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-[#eaecf0]">
                <div className="text-[11px] text-slate-400">Rule</div>
                <div className="font-mono text-slate-800 mt-0.5">{selectedFinding.cve_id || 'RULE-SEC-01'}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-[#eaecf0]">
                <div className="text-[11px] text-slate-400">Status</div>
                <div className="font-semibold text-emerald-600 mt-0.5 capitalize">
                  {selectedFinding.verification_status || 'Resolved'}
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => openDrawer(selectedFinding)}
                className="text-xs font-bold text-slate-800 hover:text-[#ea580c] transition flex items-center gap-1"
              >
                View full finding <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Card 3: A Note on Trust */}
        <div className="card p-6 bg-slate-50/60 flex items-start gap-3.5">
          <Shield className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <h4 className="font-bold text-slate-900 mb-1">A note on trust</h4>
            <p className="text-slate-500">
              Scanners detect. The assistant explains. You approve changes. A fresh scan verifies the outcome.
            </p>
            <div className="mt-2 text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Your code stays in your control.</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
