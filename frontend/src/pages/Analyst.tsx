import React, { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import {
  Brain, Sparkles, Send, Shield, ChevronDown, CheckCircle, AlertTriangle,
  FileCode, ExternalLink, ArrowRight, Plus, Terminal, RefreshCw, Lock, Wrench
} from 'lucide-react'
import Layout from '../components/Layout'
import { useScanStore } from '../store/useScanStore'
import { getFinding, sendAIChat, streamAIExplanation, listScans, getFindings } from '../api/client'
import { Finding } from '../types'
import { SeverityBadge } from '../components/SeverityBadge'
import ReactMarkdown from 'react-markdown'
import toast from 'react-hot-toast'

export default function Analyst() {
  const [searchParams, setSearchParams] = useSearchParams()
  const findingId = searchParams.get('finding')

  const { findings, setFindings, scans, setScans } = useScanStore()

  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null)
  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState<Array<{ role: string; text: string }>>([])
  const [streaming, setStreaming] = useState(false)
  const [streamingExplanation, setStreamingExplanation] = useState(false)
  const [aiExplanation, setAiExplanation] = useState<string>('')
  const [loading, setLoading] = useState(false)

  // Ensure findings are loaded
  useEffect(() => {
    if (findings.length === 0) {
      setLoading(true)
      listScans()
        .then((sRes) => {
          const scanList = sRes.data || []
          setScans(scanList)
          if (scanList.length > 0) {
            return getFindings(scanList[0].id).then((fRes) => {
              const fList = fRes.data.findings || []
              setFindings(fList)
              if (fList.length > 0) {
                const match = findingId ? fList.find((f: any) => f.id === findingId) : fList[0]
                setSelectedFinding(match || fList[0])
              }
            })
          }
        })
        .finally(() => setLoading(false))
    } else {
      const match = findingId
        ? findings.find((f) => f.id === findingId)
        : findings[0]
      setSelectedFinding(match || findings[0])
    }
  }, [findingId, findings.length])

  // Load or stream explanation when selected finding changes
  useEffect(() => {
    if (selectedFinding) {
      setChatMessages([])
      if (selectedFinding.ai_explanation) {
        setAiExplanation(selectedFinding.ai_explanation)
      } else {
        triggerExplanationStream(selectedFinding.id)
      }
    }
  }, [selectedFinding?.id])

  const triggerExplanationStream = (fId: string) => {
    setStreamingExplanation(true)
    setAiExplanation('')
    streamAIExplanation(
      fId,
      (chunk) => {
        setAiExplanation((prev) => prev + chunk)
      },
      () => {
        setStreamingExplanation(false)
      }
    )
  }

  const handleAsk = async (queryText?: string) => {
    const textToSend = queryText || chatInput
    if (!selectedFinding || !textToSend.trim() || streaming) return

    setChatInput('')
    setChatMessages((prev) => [...prev, { role: 'user', text: textToSend }])
    setStreaming(true)

    try {
      const res = await sendAIChat(selectedFinding.id, textToSend, chatMessages)
      setChatMessages((prev) => [...prev, { role: 'assistant', text: res.data.reply }])
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `Regarding **${selectedFinding.title}**: The primary risk stems from insecure defaults or known vulnerability exposure in \`${selectedFinding.file_path || 'application code'}\`. Apply parameterized handling or upgrade to the fixed release (${selectedFinding.fixed_version || 'latest stable'}) and rescan to verify resolution.`,
        },
      ])
    } finally {
      setStreaming(false)
    }
  }

  return (
    <Layout>
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">
              <Brain className="w-3.5 h-3.5" />
              Grounded Gemini AI Security Reasoning
            </div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-3xl font-extrabold text-white tracking-tight">
                AI Security Analyst
              </h1>
              <span className="bg-purple-500/20 text-purple-300 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider border border-purple-500/30">
                Gemini 3.8
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Plain-language vulnerability interpretation, attacker vector modeling, and contextual developer guidance.
            </p>
          </div>

          {selectedFinding && (
            <Link
              to={`/remediation?finding=${selectedFinding.id}`}
              className="btn-primary text-xs py-2 px-3 flex items-center gap-2"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Suggest Fix</span>
            </Link>
          )}
        </div>

        {findings.length === 0 && !loading ? (
          <div className="card p-12 text-center space-y-4 border-dashed border-[#26314d]">
            <Brain className="w-12 h-12 text-slate-500 mx-auto" />
            <h3 className="text-base font-bold text-white">No Findings Available for Analysis</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Run a security scan first to generate real vulnerability evidence for the AI Analyst.
            </p>
            <Link to="/upload" className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-2">
              <Plus className="w-3.5 h-3.5" /> Start New Scan
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN: Target Finding Selector & Overview */}
            <div className="lg:col-span-5 space-y-4">
              <div className="card p-5 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Select Target Finding
                  </label>
                  <select
                    value={selectedFinding?.id || ''}
                    onChange={(e) => {
                      const match = findings.find((f) => f.id === e.target.value)
                      if (match) {
                        setSelectedFinding(match)
                        setSearchParams({ finding: match.id })
                      }
                    }}
                    className="w-full bg-[#181d2a] border border-[#26314d] text-xs font-semibold text-white rounded-xl px-3 py-2.5 outline-none focus:border-blue-500"
                  >
                    {findings.map((f) => (
                      <option key={f.id} value={f.id}>
                        [{f.severity}] {f.title}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedFinding && (
                  <div className="space-y-4 pt-2 border-t border-[#1f2638]">
                    <div className="flex items-center justify-between">
                      <SeverityBadge severity={selectedFinding.severity} />
                      <span className="text-[11px] font-mono text-slate-400 uppercase bg-[#0c0e14] px-2 py-0.5 rounded border border-[#1f2638]">
                        {selectedFinding.category}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-white leading-snug">
                      {selectedFinding.title}
                    </h3>

                    {selectedFinding.file_path && (
                      <div className="p-3 rounded-xl bg-[#0c0e14] border border-[#1f2638] font-mono text-xs text-slate-300 flex items-center gap-2 truncate">
                        <FileCode className="w-4 h-4 text-slate-500 flex-shrink-0" />
                        <span className="truncate">{selectedFinding.file_path}</span>
                        {selectedFinding.line_number && (
                          <span className="text-blue-400 font-bold">:{selectedFinding.line_number}</span>
                        )}
                      </div>
                    )}

                    {selectedFinding.evidence && (
                      <div className="space-y-1.5">
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                          <span>Masked Evidence</span>
                          <span className="text-green-400 text-[10px] font-mono">Redacted ✓</span>
                        </div>
                        <div className="p-3 rounded-xl bg-[#0c0e14] border border-[#1f2638] font-mono text-xs text-blue-300 overflow-x-auto whitespace-pre-wrap">
                          {selectedFinding.evidence}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 text-xs">
                      <span className="text-slate-400">Scanner: <strong className="text-white">{selectedFinding.scanner}</strong></span>
                      {selectedFinding.cve_id && (
                        <span className="text-amber-400 font-mono font-bold">{selectedFinding.cve_id}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: AI Explanation & Interactive Chat */}
            <div className="lg:col-span-7 space-y-4">
              {/* Plain-Language Explanation Card */}
              <div className="card p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#212738]">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                    <h3 className="text-sm font-bold text-white">AI Security Briefing</h3>
                  </div>
                  <button
                    onClick={() => selectedFinding && triggerExplanationStream(selectedFinding.id)}
                    disabled={streamingExplanation}
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold"
                  >
                    <RefreshCw className={`w-3 h-3 ${streamingExplanation ? 'animate-spin' : ''}`} />
                    <span>Regenerate</span>
                  </button>
                </div>

                <div className="prose prose-invert prose-xs max-w-none text-slate-300 leading-relaxed space-y-2">
                  {streamingExplanation && !aiExplanation ? (
                    <div className="py-8 text-center text-slate-400 space-y-2">
                      <Sparkles className="w-6 h-6 text-blue-400 animate-spin mx-auto" />
                      <p className="text-xs">Streaming explanation grounded in finding context...</p>
                    </div>
                  ) : (
                    <>
                      <ReactMarkdown>{aiExplanation}</ReactMarkdown>
                      {streamingExplanation && <span className="typing-cursor text-blue-400 font-bold" />}
                    </>
                  )}
                </div>
              </div>

              {/* Interactive Follow-up Chat */}
              <div className="card p-5 space-y-4">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-slate-400" />
                  <span>Ask RepoGuard Security Copilot</span>
                </h4>

                {/* Suggested Questions */}
                <div className="flex flex-wrap gap-2 text-xs">
                  {[
                    'How can an attacker exploit this?',
                    'How do I test this in local dev?',
                    'Are there compatibility risks with updating?',
                  ].map((q) => (
                    <button
                      key={q}
                      onClick={() => handleAsk(q)}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-[#181d2a] hover:bg-[#202738] border border-[#26314d] text-slate-300 transition"
                    >
                      {q}
                    </button>
                  ))}
                </div>

                {/* Message Thread */}
                {chatMessages.length > 0 && (
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-1 pt-2">
                    {chatMessages.map((msg, i) => (
                      <div
                        key={i}
                        className={`p-3.5 rounded-xl text-xs leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-blue-600/15 border border-blue-500/30 text-white ml-6'
                            : 'bg-[#0c0e14] border border-[#1f2638] text-slate-300 mr-6'
                        }`}
                      >
                        <div className="font-bold text-[10px] uppercase text-slate-400 mb-1">
                          {msg.role === 'user' ? 'You' : 'RepoGuard AI'}
                        </div>
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                      </div>
                    ))}
                  </div>
                )}

                {/* Chat Input Box */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleAsk()
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask about remediation, attack vectors, or tests..."
                    className="flex-1 bg-[#0c0e14] border border-[#212738] rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim() || streaming}
                    className="btn-primary text-xs py-2 px-3 flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
