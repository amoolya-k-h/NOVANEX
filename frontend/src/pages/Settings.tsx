import React from 'react'
import {
  Shield, Check, Terminal, Brain, Lock, EyeOff, FileCheck, ShieldCheck
} from 'lucide-react'
import Layout from '../components/Layout'

export default function Settings() {
  return (
    <Layout>
      <div className="max-w-[1200px] mx-auto space-y-9">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Controlled fixtures, real scan evidence.
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Settings
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Your workspace, integrations, and security controls.
          </p>
        </div>

        {/* Workspace Details */}
        <div className="card p-7 space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Workspace details</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              An intentionally public workspace for evaluating real security evidence.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
            <div className="p-4 bg-slate-50 rounded-2xl border border-[#eaecf0]">
              <div className="text-[11px] text-slate-400 font-medium">Workspace name</div>
              <div className="font-bold text-slate-900 text-sm mt-1">Personal workspace</div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-[#eaecf0]">
              <div className="text-[11px] text-slate-400 font-medium">Visibility</div>
              <div className="font-bold text-slate-900 text-sm mt-1 flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600" />
                Public controlled fixtures only
              </div>
            </div>
          </div>
        </div>

        {/* Integrations */}
        <div className="card p-7 space-y-5">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Integrations</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Provider credentials are kept server-side and are never included in reports.
            </p>
          </div>

          <div className="space-y-3">
            {/* Item 1 */}
            <div className="p-4.5 rounded-2xl border border-[#eaecf0] bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                  <Terminal className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Security scan worker</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Gitleaks + Trivy running in an isolated Python worker.
                  </p>
                  <div className="text-[10px] font-mono text-slate-400 mt-1">
                    REPOGUARD_SCANNER_URL, REPOGUARD_SCANNER_TOKEN
                  </div>
                </div>
              </div>

              <span className="badge-neutral text-[11px] self-start sm:self-auto">
                Connected
              </span>
            </div>

            {/* Item 2 */}
            <div className="p-4.5 rounded-2xl border border-[#eaecf0] bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-[#fff7ed] text-[#ea580c] flex items-center justify-center font-bold text-xs flex-shrink-0 border border-[#ffedd5]">
                  <Brain className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Gemini security analyst</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Evidence-grounded explanations, with redacted findings only.
                  </p>
                  <div className="text-[10px] font-mono text-slate-400 mt-1">
                    APP_GEMINI_API_KEY
                  </div>
                </div>
              </div>

              <span className="badge-low text-[11px] self-start sm:self-auto">
                <Check className="w-3 h-3 text-emerald-600" /> Configured
              </span>
            </div>
          </div>
        </div>

        {/* Security By Design */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-900">Security by design</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="card p-5 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <Lock className="w-4 h-4 text-emerald-600" />
                Your code is never executed
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Archives are validated and scanned in an isolated temporary workspace.
              </p>
            </div>

            <div className="card p-5 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <EyeOff className="w-4 h-4 text-emerald-600" />
                Credentials stay redacted
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                No raw credentials are stored, displayed, or sent to the language model.
              </p>
            </div>

            <div className="card p-5 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                No silent code modifications
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Remediations are reviewable. Only a real rescan can verify a fix.
              </p>
            </div>

            <div className="card p-5 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Private records stay private
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Only explicitly public fixture evidence is included in reports.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

