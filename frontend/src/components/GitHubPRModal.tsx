import React, { useState, useEffect } from 'react'
import {
  GitPullRequest, GitBranch, Github, ExternalLink, Check, AlertCircle,
  X, Loader2, ShieldCheck, Sparkles, Lock, ArrowRight
} from 'lucide-react'
import { createGithubPR, validateGithubToken } from '../api/client'
import { Finding } from '../types'
import toast from 'react-hot-toast'

interface Props {
  finding: Finding | null
  patch?: string
  isOpen: boolean
  onClose: () => void
  onSuccess?: (prData: any) => void
}

export default function GitHubPRModal({ finding, patch, isOpen, onClose, onSuccess }: Props) {
  const [repo, setRepo] = useState(localStorage.getItem('repoguard_github_repo') || '')
  const [token, setToken] = useState(localStorage.getItem('repoguard_github_token') || '')
  const [branch, setBranch] = useState('')
  const [prTitle, setPrTitle] = useState('')
  const [isDryRun, setIsDryRun] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [createdPR, setCreatedPR] = useState<any>(null)

  useEffect(() => {
    if (finding) {
      const slug = (finding.title || 'security-fix')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .slice(0, 25)
        .replace(/^-|-$/g, '')
      setBranch(`repoguard/fix-${slug}-${finding.id.slice(0, 6)}`)
      setPrTitle(`fix(security): resolve ${finding.title} in ${finding.file_path || 'project'}`)
      setCreatedPR(null)
    }
  }, [finding?.id])

  if (!isOpen || !finding) return null

  const handleCreatePR = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!repo.trim()) {
      toast.error('Please specify target repository (e.g. owner/repo)')
      return
    }

    if (!isDryRun && !token.trim()) {
      toast.error('Please enter a GitHub Personal Access Token or switch to Simulation mode.')
      return
    }

    setSubmitting(true)
    try {
      if (token.trim()) {
        localStorage.setItem('repoguard_github_token', token.trim())
      }
      localStorage.setItem('repoguard_github_repo', repo.trim())

      const res = await createGithubPR({
        github_token: isDryRun ? undefined : token.trim(),
        repo_url_or_name: repo.trim(),
        finding_id: finding.id,
        branch_name: branch.trim(),
        pr_title: prTitle.trim(),
        custom_patch: patch,
        dry_run: isDryRun,
      })

      if (res.data.success) {
        setCreatedPR(res.data)
        toast.success(res.data.message || 'Pull request created successfully!')
        if (onSuccess) onSuccess(res.data)
      } else {
        toast.error('Failed to create Pull Request')
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Error communicating with GitHub API'
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-xl bg-[#111520] border border-[#212738] rounded-2xl shadow-2xl p-6 sm:p-7 relative max-h-[90vh] overflow-y-auto text-slate-100">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1a2030] transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center">
            <Github className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Create GitHub Pull Request
            </h2>
            <p className="text-xs text-slate-400">
              Commit remediated security code directly to a new branch and open a PR.
            </p>
          </div>
        </div>

        {/* PR Successfully Created State */}
        {createdPR ? (
          <div className="space-y-5 py-3 text-center">
            <div className="w-14 h-14 rounded-2xl bg-green-500/10 border border-green-500/30 text-green-400 flex items-center justify-center mx-auto animate-bounce">
              <Check className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Pull Request Ready!</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Branch <code className="text-purple-400">{createdPR.branch}</code> was generated with the approved security fix.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#0c0e14] border border-[#1f2638] text-xs font-mono text-left space-y-1.5">
              <div className="text-slate-400 flex justify-between">
                <span>Target Repo:</span>
                <span className="text-slate-200 font-semibold">{repo}</span>
              </div>
              <div className="text-slate-400 flex justify-between">
                <span>Branch:</span>
                <span className="text-purple-300">{createdPR.branch}</span>
              </div>
              <div className="text-slate-400 flex justify-between">
                <span>Status:</span>
                <span className="text-green-400 font-bold">PR Opened</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <a
                href={createdPR.pr_url}
                target="_blank"
                rel="noreferrer"
                className="btn-primary text-xs py-2.5 px-5 flex items-center gap-2"
              >
                <span>View Pull Request on GitHub</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={onClose}
                className="btn-secondary text-xs py-2.5 px-4"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Input Form */
          <form onSubmit={handleCreatePR} className="space-y-4 text-xs">
            {/* Target Repository */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Target GitHub Repository <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={repo}
                onChange={(e) => setRepo(e.target.value)}
                placeholder="owner/repo (e.g. acme-corp/backend-api)"
                className="w-full bg-[#181d2a] border border-[#26314d] rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 outline-none focus:border-purple-500 font-mono"
                required
              />
            </div>

            {/* Branch Name */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                New Fix Branch Name
              </label>
              <div className="relative">
                <GitBranch className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full bg-[#181d2a] border border-[#26314d] rounded-xl pl-10 pr-3.5 py-2.5 text-white outline-none focus:border-purple-500 font-mono"
                  required
                />
              </div>
            </div>

            {/* PR Title */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Pull Request Title
              </label>
              <input
                type="text"
                value={prTitle}
                onChange={(e) => setPrTitle(e.target.value)}
                className="w-full bg-[#181d2a] border border-[#26314d] rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-purple-500"
                required
              />
            </div>

            {/* GitHub Personal Access Token */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-300 font-semibold">
                  GitHub Personal Access Token (PAT)
                </label>
                <a
                  href="https://github.com/settings/tokens/new?scopes=repo"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  Generate token <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                disabled={isDryRun}
                placeholder={isDryRun ? "Token not required in simulation mode" : "ghp_xxxxxxxxxxxxxxxxxxxx"}
                className={`w-full bg-[#181d2a] border border-[#26314d] rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 outline-none focus:border-purple-500 font-mono ${
                  isDryRun ? 'opacity-40 cursor-not-allowed' : ''
                }`}
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Requires <code className="text-slate-400">repo</code> scope to create branches and commit remediation patches.
              </p>
            </div>

            {/* Dry Run / Simulation Mode Toggle */}
            <div className="p-3 rounded-xl bg-[#0c0e14] border border-[#1f2638] flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="font-semibold text-slate-200 text-xs flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Demo / Simulation Mode
                </div>
                <p className="text-[11px] text-slate-500">
                  Simulate the complete branch and PR creation workflow without requiring live GitHub credentials.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsDryRun(!isDryRun)}
                className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-1 ${
                  isDryRun ? 'bg-purple-600' : 'bg-[#26314d]'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    isDryRun ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1f2638]">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary text-xs py-2.5 px-4"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary text-xs py-2.5 px-5 flex items-center gap-2 bg-purple-600 hover:bg-purple-500"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating Branch & PR...</span>
                  </>
                ) : (
                  <>
                    <GitPullRequest className="w-4 h-4" />
                    <span>Create Pull Request</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
