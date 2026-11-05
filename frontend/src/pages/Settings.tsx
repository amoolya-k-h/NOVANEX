import React, { useState } from 'react'
import {
  Shield, Check, Terminal, Brain, Lock, EyeOff, FileCheck, ShieldCheck,
  Server, Cpu, Database, KeyRound, CheckCircle
} from 'lucide-react'
import Layout from '../components/Layout'
import toast from 'react-hot-toast'

export default function Settings() {
  const [apiKey, setApiKey] = useState('')
  const [saved, setSaved] = useState(false)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setSaved(true)
    toast.success('Settings updated locally.')
  }

  return (
    <Layout>
      <div className="max-w-[1200px] mx-auto space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 tracking-wider uppercase mb-1">
            <Shield className="w-3.5 h-3.5" />
            Environment Configuration & Security Controls
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Settings & Architecture
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Scanner binary paths, Gemini AI model integration, and local data protection policies.
          </p>
        </div>

        {/* System Architecture Details */}
        <div className="card p-7 space-y-4">
          <div>
            <h2 className="text-base font-bold text-white">Application Environment</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Active services and execution runtime configuration.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs">
            <div className="p-4 bg-[#0c0e14] rounded-xl border border-[#1f2638] space-y-1">
              <div className="text-[11px] text-slate-500 font-semibold uppercase flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-blue-400" /> Backend Service
              </div>
              <div className="font-bold text-white text-sm">FastAPI v1.0.0</div>
              <div className="text-[11px] text-slate-400 font-mono">http://localhost:8000/api</div>
            </div>

            <div className="p-4 bg-[#0c0e14] rounded-xl border border-[#1f2638] space-y-1">
              <div className="text-[11px] text-slate-500 font-semibold uppercase flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-amber-400" /> Storage Engine
              </div>
              <div className="font-bold text-white text-sm">SQLite + SQLAlchemy</div>
              <div className="text-[11px] text-slate-400 font-mono">repoguard.db (Local)</div>
            </div>

            <div className="p-4 bg-[#0c0e14] rounded-xl border border-[#1f2638] space-y-1">
              <div className="text-[11px] text-slate-500 font-semibold uppercase flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5 text-purple-400" /> AI Engine
              </div>
              <div className="font-bold text-white text-sm">Google Gemini 3.8</div>
              <div className="text-[11px] text-slate-400 font-mono">SSE Streaming Enabled</div>
            </div>
          </div>
        </div>

        {/* Security Scanner Integrations */}
        <div className="card p-7 space-y-5">
          <div>
            <h2 className="text-base font-bold text-white">Integrated Security Scanners</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Multi-engine security stack configured with dual-mode CLI and native fallback execution.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-[#0c0e14] rounded-xl border border-[#1f2638] flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-white text-sm">Gitleaks Engine</div>
                <p className="text-slate-400 text-xs mt-0.5">
                  Detects hardcoded passwords, AWS credentials, API tokens, and private keys.
                </p>
                <span className="inline-block mt-2 text-[10px] font-mono text-green-400 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">
                  Status: Active (Dual Mode)
                </span>
              </div>
            </div>

            <div className="p-4 bg-[#0c0e14] rounded-xl border border-[#1f2638] flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-white text-sm">OSV-Scanner Engine</div>
                <p className="text-slate-400 text-xs mt-0.5">
                  Scans package lockfiles and requirements for open-source vulnerability CVEs.
                </p>
                <span className="inline-block mt-2 text-[10px] font-mono text-green-400 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">
                  Status: Active (Dual Mode)
                </span>
              </div>
            </div>

            <div className="p-4 bg-[#0c0e14] rounded-xl border border-[#1f2638] flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-white text-sm">Trivy Scanner Engine</div>
                <p className="text-slate-400 text-xs mt-0.5">
                  Analyzes Dockerfiles and infrastructure configurations for security hardening.
                </p>
                <span className="inline-block mt-2 text-[10px] font-mono text-green-400 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">
                  Status: Active (Dual Mode)
                </span>
              </div>
            </div>

            <div className="p-4 bg-[#0c0e14] rounded-xl border border-[#1f2638] flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-white text-sm">Semgrep SAST Engine</div>
                <p className="text-slate-400 text-xs mt-0.5">
                  Detects SQL injection, command injection, path traversal, and weak cryptography.
                </p>
                <span className="inline-block mt-2 text-[10px] font-mono text-green-400 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">
                  Status: Active (Dual Mode)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Security Controls & Privacy */}
        <div className="card p-7 space-y-4">
          <div>
            <h2 className="text-base font-bold text-white">Security & Privacy Controls</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Enforced developer security policies for code scanning.
            </p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-xl bg-[#0c0e14] border border-[#1f2638] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Lock className="w-4 h-4 text-blue-400" />
                <div>
                  <div className="font-bold text-white">Automatic Secret Masking & Redaction</div>
                  <div className="text-[11px] text-slate-400">Credentials are sanitized before sending to LLM APIs or logs</div>
                </div>
              </div>
              <span className="text-xs font-bold text-green-400 bg-green-500/10 px-2.5 py-1 rounded-full border border-green-500/30">
                Enforced
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0c0e14] border border-[#1f2638] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Cpu className="w-4 h-4 text-purple-400" />
                <div>
                  <div className="font-bold text-white">No-Execution Sandbox Guarantee</div>
                  <div className="text-[11px] text-slate-400">Uploaded software packages are static-analyzed only and never executed</div>
                </div>
              </div>
              <span className="text-xs font-bold text-green-400 bg-green-500/10 px-2.5 py-1 rounded-full border border-green-500/30">
                Enforced
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0c0e14] border border-[#1f2638] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileCheck className="w-4 h-4 text-amber-400" />
                <div>
                  <div className="font-bold text-white">ZIP Archive Extraction Quota</div>
                  <div className="text-[11px] text-slate-400">100MB limit with path traversal protection preventing zip bomb attacks</div>
                </div>
              </div>
              <span className="text-xs font-bold text-green-400 bg-green-500/10 px-2.5 py-1 rounded-full border border-green-500/30">
                Enforced
              </span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
