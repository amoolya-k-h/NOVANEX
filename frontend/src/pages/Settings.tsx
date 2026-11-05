import React, { useState } from 'react'
import {
  Shield, Check, Terminal, Brain, Lock, EyeOff, FileCheck, ShieldCheck,
  Server, Cpu, Database, KeyRound, CheckCircle, Github, GitPullRequest,
  ExternalLink, Loader2
} from 'lucide-react'
import Layout from '../components/Layout'
import { validateGithubToken } from '../api/client'
import toast from 'react-hot-toast'

export default function Settings() {
  const [githubToken, setGithubToken] = useState(localStorage.getItem('repoguard_github_token') || '')
  const [githubRepo, setGithubRepo] = useState(localStorage.getItem('repoguard_github_repo') || '')
  const [testingToken, setTestingToken] = useState(false)
  const [tokenStatus, setTokenStatus] = useState<any>(null)

  const handleSaveGithub = (e: React.FormEvent) => {
    e.preventDefault()
    localStorage.setItem('repoguard_github_token', githubToken.trim())
    localStorage.setItem('repoguard_github_repo', githubRepo.trim())
    toast.success('GitHub integration settings saved!')
  }

  const handleTestToken = async () => {
    if (!githubToken.trim()) {
      toast.error('Please enter a GitHub Personal Access Token to test')
      return
    }
    setTestingToken(true)
    setTokenStatus(null)
    try {
      const res = await validateGithubToken(githubToken.trim())
      if (res.data.valid) {
        setTokenStatus(res.data)
        toast.success(`Connected as @${res.data.username}!`)
      } else {
        setTokenStatus({ error: res.data.error || 'Token validation failed' })
        toast.error(res.data.error || 'Token validation failed')
      }
    } catch {
      setTokenStatus({ error: 'Failed to reach GitHub API' })
      toast.error('Failed to reach GitHub API')
    } finally {
      setTestingToken(false)
    }
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

        {/* GitHub Integration Card */}
        <div className="card p-7 space-y-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center">
                <Github className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  GitHub Pull Request Integration
                  <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/30">
                    Live PR Automation
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Automatically create branches and open Pull Requests for approved AI security patches.
                </p>
              </div>
            </div>
            <a
              href="https://github.com/settings/tokens/new?scopes=repo"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 hidden sm:flex"
            >
              <span>Generate PAT</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <form onSubmit={handleSaveGithub} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Default Target Repository
                </label>
                <input
                  type="text"
                  value={githubRepo}
                  onChange={(e) => setGithubRepo(e.target.value)}
                  placeholder="owner/repo (e.g. acme-corp/backend-service)"
                  className="w-full bg-[#0c0e14] border border-[#212738] rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 outline-none focus:border-purple-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Personal Access Token (PAT)
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={githubToken}
                    onChange={(e) => setGithubToken(e.target.value)}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                    className="flex-1 bg-[#0c0e14] border border-[#212738] rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 outline-none focus:border-purple-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleTestToken}
                    disabled={testingToken}
                    className="btn-secondary px-3 py-2 text-xs flex items-center gap-1.5 whitespace-nowrap"
                  >
                    {testingToken ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    <span>Test</span>
                  </button>
                </div>
              </div>
            </div>

            {tokenStatus && (
              <div
                className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                  tokenStatus.valid
                    ? 'bg-green-500/10 border-green-500/30 text-green-300'
                    : 'bg-red-500/10 border-red-500/30 text-red-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  {tokenStatus.valid ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <Lock className="w-4 h-4 text-red-400" />
                  )}
                  <span>
                    {tokenStatus.valid
                      ? `Authenticated as @${tokenStatus.username} (${tokenStatus.name || 'Developer'})`
                      : tokenStatus.error}
                  </span>
                </div>
                {tokenStatus.avatar_url && (
                  <img
                    src={tokenStatus.avatar_url}
                    alt={tokenStatus.username}
                    className="w-5 h-5 rounded-full border border-green-400"
                  />
                )}
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-[#1f2638]">
              <span className="text-[11px] text-slate-400">
                Credentials are saved only in your local browser storage.
              </span>
              <button
                type="submit"
                className="btn-primary text-xs py-2 px-4 bg-purple-600 hover:bg-purple-500"
              >
                Save GitHub Settings
              </button>
            </div>
          </form>
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
