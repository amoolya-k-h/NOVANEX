import React, { useState } from 'react'
import {
  Wrench, CheckCircle, AlertTriangle, ArrowRight, ShieldCheck,
  FileCheck2, Plus, Sparkles, ChevronDown, Check
} from 'lucide-react'
import Layout from '../components/Layout'
import { useScanStore } from '../store/useScanStore'
import { Finding } from '../types'

export default function Remediation() {
  const { openScanModal, openDrawer, findings } = useScanStore()
  const [subTab, setSubTab] = useState<'needs_review' | 'verified' | 'newly_introduced'>('needs_review')

  const defaultItems = [
    {
      id: 'rem-1',
      title: "vm2: vm2 NodeVM builtin '[]' exposes 'os' and 'dns' — process-wide observability reads AND writes that hijack the host (sibling class of GHSA-9g8x-92q2-p28f)",
      category: 'dependency',
      severity: 'CRITICAL',
      file_path: 'package-lock.json',
      scanner: 'auth-service',
      cve_id: 'GHSA-9g8x-92q2-p28f',
      status: 'needs_review',
      fixed_version: '3.11.6',
    },
    {
      id: 'rem-2',
      title: 'vm2: vm2 NodeVM before 3.12.1 Remote Code Execution via child_process',
      category: 'dependency',
      severity: 'CRITICAL',
      file_path: 'package-lock.json',
      scanner: 'auth-service',
      cve_id: 'CVE-2023-37466',
      status: 'needs_review',
      fixed_version: '3.12.1',
    },
    {
      id: 'rem-3',
      title: 'vm2: vm2 Sandbox Breakout Using Dangerous Host Proto Mutators',
      category: 'dependency',
      severity: 'CRITICAL',
      file_path: 'package-lock.json',
      scanner: 'auth-service',
      status: 'needs_review',
      fixed_version: '3.11.6',
    },
    {
      id: 'rem-4',
      title: 'vm2: vm2; Missing ErrorCase Sanitization Enables VM2 Sandbox Escape to RCE',
      category: 'dependency',
      severity: 'CRITICAL',
      file_path: 'package-lock.json',
      scanner: 'auth-service',
      status: 'needs_review',
      fixed_version: '3.11.6',
    },
    {
      id: 'rem-5',
      title: 'vm2: vm2: Arbitrary code execution using Promise Sandbox Escape when executing untrusted code with async support',
      category: 'dependency',
      severity: 'CRITICAL',
      file_path: 'package-lock.json',
      scanner: 'auth-service',
      status: 'needs_review',
      fixed_version: '3.11.6',
    },
    {
      id: 'rem-6',
      title: 'vm2: Arbitrary code execution due to incomplete sandbox restrictions',
      category: 'dependency',
      severity: 'CRITICAL',
      file_path: 'package-lock.json',
      scanner: 'auth-service',
      status: 'needs_review',
      fixed_version: '3.11.6',
    },
    {
      id: 'rem-7',
      title: 'vm2: sandbox escape leading to arbitrary code execution via security bypass',
      category: 'dependency',
      severity: 'CRITICAL',
      file_path: 'package-lock.json',
      scanner: 'auth-service',
      status: 'needs_review',
      fixed_version: '3.11.6',
    },
  ]

  const items = findings.length > 0 ? (findings as any) : defaultItems

  return (
    <Layout>
      <div className="max-w-[1400px] mx-auto space-y-7">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              Controlled fixtures, real scan evidence.
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Remediation
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Review the fix. Make the change. Verify the result.
            </p>
          </div>

          <button onClick={openScanModal} className="btn-primary text-xs font-bold px-4 py-2">
            <Plus className="w-4 h-4" />
            <span>New scan</span>
          </button>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card p-5 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Ready for review</span>
              <FileCheck2 className="w-4 h-4 text-[#ea580c]" />
            </div>
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight">107</div>
          </div>

          <div className="card p-5 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Verified resolutions</span>
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-3xl font-extrabold text-emerald-600 tracking-tight">51</div>
          </div>

          <div className="card p-5 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Newly introduced</span>
              <AlertTriangle className="w-4 h-4 text-red-500" />
            </div>
            <div className="text-3xl font-extrabold text-red-600 tracking-tight">57</div>
          </div>
        </div>

        {/* You're In Control Alert Box */}
        <div className="card p-5 bg-[#fff7ed] border-[#ffedd5] flex items-start gap-3.5 text-xs text-slate-700 leading-relaxed">
          <Check className="w-4 h-4 text-[#ea580c] flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-[#c2410c] mb-0.5">You're in control.</h4>
            <p>
              Proposed changes are never applied silently. Upload your own ZIP, review supported edits here, approve selected changes, and download a separate archive. Actual rescans—not applied edits—verify the result.
            </p>
          </div>
        </div>

        {/* Sub-tabs & Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#eaecf0] pb-3 select-none">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSubTab('needs_review')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                subTab === 'needs_review'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
            >
              <span>Needs review</span>
              <span className="text-[10px] font-mono opacity-80">107</span>
            </button>

            <button
              onClick={() => setSubTab('verified')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                subTab === 'verified'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
            >
              <span>Verified</span>
              <span className="text-[10px] font-mono opacity-80">51</span>
            </button>

            <button
              onClick={() => setSubTab('newly_introduced')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                subTab === 'newly_introduced'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
            >
              <span>Newly introduced</span>
              <span className="text-[10px] font-mono opacity-80">57</span>
            </button>
          </div>

          <button
            onClick={openScanModal}
            className="btn-primary text-xs font-bold px-4 py-1.5 self-start sm:self-auto"
          >
            <span>Review & apply ZIP</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Remediation Cards List */}
        <div className="space-y-3">
          {items.map((item: any) => (
            <div
              key={item.id}
              onClick={() => openDrawer(item)}
              className="card p-4.5 card-hover flex items-center justify-between gap-4 cursor-pointer"
            >
              <div className="flex items-start gap-3 min-w-0">
                <span className="w-2 h-2 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 truncate leading-snug">
                    {item.title}
                  </h4>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {item.scanner || 'auth-service'} • {item.file_path || 'package-lock.json'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="badge-critical text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  Critical
                </span>
                <ChevronDown className="w-4 h-4 text-slate-400 -rotate-90" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  )
}
