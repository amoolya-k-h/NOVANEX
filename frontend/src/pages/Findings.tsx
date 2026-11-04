import React, { useEffect, useState } from 'react'
import {
  Search, Plus, Download, ChevronDown, CheckCircle2, AlertTriangle,
  FileCode, ExternalLink, Filter
} from 'lucide-react'
import Layout from '../components/Layout'
import { useScanStore } from '../store/useScanStore'
import { getFindings, listScans } from '../api/client'
import { Finding } from '../types'
import toast from 'react-hot-toast'

export default function Findings() {
  const { openScanModal, openDrawer, findings, setFindings } = useScanStore()

  const [activeTab, setActiveTab] = useState<'open' | 'resolved' | 'all'>('open')
  const [search, setSearch] = useState('')
  const [selectedRepo, setSelectedRepo] = useState('all')
  const [selectedSeverity, setSelectedSeverity] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')

  useEffect(() => {
    listScans().then((sRes) => {
      const scans = sRes.data || []
      if (scans.length > 0) {
        getFindings(scans[0].id).then((fRes) => {
          setFindings(fRes.data.findings || [])
        })
      }
    })
  }, [])

  // Sample findings fallback matching video
  const defaultList = [
    {
      id: 'f-1',
      title: "vm2: vm2 NodeVM builtin '[]' exposes 'os' and 'dns' — process-wide observability reads AND writes that hijack the host (sibling class of GHSA-9g8x-92q2-p28f)",
      category: 'dependency',
      severity: 'CRITICAL',
      file_path: 'package-lock.json',
      scanner: 'Trivy',
      description: "NodeVM builtin '[]' exposes 'os' and 'dns' process-wide observability reads and writes that hijack the host sandbox.",
      fixed_version: '3.11.6',
      package_name: 'vm2',
      package_version: '3.9.16',
      cve_id: 'GHSA-9g8x-92q2-p28f',
      risk_score: 95,
      priority: 'P1',
      verification_status: 'unresolved',
    },
    {
      id: 'f-2',
      title: 'vm2: vm2 NodeVM before 3.12.1 Remote Code Execution via child_process',
      category: 'dependency',
      severity: 'CRITICAL',
      file_path: 'package-lock.json',
      scanner: 'Trivy',
      description: 'Arbitrary remote code execution flaw in vm2 sandbox breakout.',
      fixed_version: '3.12.1',
      package_name: 'vm2',
      package_version: '3.9.16',
      cve_id: 'CVE-2023-37466',
      risk_score: 92,
      priority: 'P1',
      verification_status: 'unresolved',
    },
    {
      id: 'f-3',
      title: 'vm2: vm2 before 3.11.7 Authentication Bypass via node: Prefix',
      category: 'dependency',
      severity: 'CRITICAL',
      file_path: 'package-lock.json',
      scanner: 'Trivy',
      description: 'Prefix bypass allows loading unauthorized node builtins.',
      fixed_version: '3.11.7',
      package_name: 'vm2',
      package_version: '3.9.16',
      cve_id: 'CVE-2023-37903',
      risk_score: 89,
      priority: 'P1',
      verification_status: 'unresolved',
    },
    {
      id: 'f-4',
      title: 'vm2: vm2, vm2 NodeVM before 3.11.6 Sandbox Escape via NodeVM',
      category: 'dependency',
      severity: 'CRITICAL',
      file_path: 'package-lock.json',
      scanner: 'Trivy',
      description: 'Sandbox escape in NodeVM implementation.',
      fixed_version: '3.11.6',
      package_name: 'vm2',
      package_version: '3.9.15',
      cve_id: 'CVE-2023-32314',
      risk_score: 88,
      priority: 'P1',
      verification_status: 'unresolved',
    },
    {
      id: 'f-5',
      title: 'vm2: custom inspect function allows attackers to escape the sandbox and run arbitrary code',
      category: 'dependency',
      severity: 'CRITICAL',
      file_path: 'package-lock.json',
      scanner: 'Trivy',
      description: 'Custom inspect method vulnerability in NodeVM.',
      fixed_version: '3.11.6',
      package_name: 'vm2',
      package_version: '3.9.14',
      cve_id: 'CVE-2023-37903',
      risk_score: 85,
      priority: 'P1',
      verification_status: 'unresolved',
    },
    {
      id: 'f-6',
      title: 'vm2: vm2 Promise handler sanitization can be bypassed allowing attackers to escape the sandbox and run arbitrary code',
      category: 'dependency',
      severity: 'CRITICAL',
      file_path: 'package-lock.json',
      scanner: 'Trivy',
      description: 'Promise handler escape flaw in vm2.',
      fixed_version: '3.11.6',
      package_name: 'vm2',
      package_version: '3.9.14',
      cve_id: 'CVE-2023-37466',
      risk_score: 84,
      priority: 'P1',
      verification_status: 'unresolved',
    },
    {
      id: 'f-7',
      title: 'vm2: vm2 Sandbox Escape',
      category: 'dependency',
      severity: 'CRITICAL',
      file_path: 'package-lock.json',
      scanner: 'Trivy',
      description: 'General sandbox breakout vulnerability.',
      fixed_version: '3.11.6',
      package_name: 'vm2',
      package_version: '3.9.13',
      cve_id: 'GHSA-c374-kw89-6147',
      risk_score: 80,
      priority: 'P1',
      verification_status: 'resolved',
    },
    {
      id: 'f-8',
      title: 'Hardcoded AWS Access Key ID detected',
      category: 'secret',
      severity: 'CRITICAL',
      file_path: 'config/aws.py',
      scanner: 'Gitleaks',
      description: 'Plaintext AWS credentials committed to source tree.',
      evidence: 'AKIAIOSFODNN7EXAMPLE',
      risk_score: 90,
      priority: 'P1',
      verification_status: 'unresolved',
    },
    {
      id: 'f-9',
      title: 'Container process executes with root privileges',
      category: 'misconfiguration',
      severity: 'HIGH',
      file_path: 'Dockerfile',
      scanner: 'Trivy',
      description: 'Root user specified in container definition allows potential container escape.',
      risk_score: 70,
      priority: 'P2',
      verification_status: 'resolved',
    },
  ]

  const rawList: Finding[] = (findings.length > 0 ? findings : defaultList) as any as Finding[]

  const filtered = rawList.filter((f) => {
    if (activeTab === 'open' && f.verification_status === 'resolved') return false
    if (activeTab === 'resolved' && f.verification_status !== 'resolved') return false

    if (selectedSeverity !== 'all' && f.severity !== selectedSeverity) return false
    if (selectedCategory !== 'all' && f.category !== selectedCategory) return false
    if (selectedRepo !== 'all' && f.scanner !== selectedRepo) return false

    if (search.trim()) {
      const q = search.toLowerCase()
      const matchTitle = f.title.toLowerCase().includes(q)
      const matchFile = f.file_path?.toLowerCase().includes(q)
      const matchCve = f.cve_id?.toLowerCase().includes(q)
      if (!matchTitle && !matchFile && !matchCve) return false
    }

    return true
  })

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
              Findings
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Real scanner evidence, organized by what matters most.
            </p>
          </div>

          <button onClick={openScanModal} className="btn-primary text-xs font-bold px-4 py-2">
            <Plus className="w-4 h-4" />
            <span>New scan</span>
          </button>
        </div>

        {/* Tabs Bar & Export Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#eaecf0] pb-3 select-none">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('open')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'open'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
            >
              <span>Open</span>
              <span className="text-[10px] font-mono opacity-80">107</span>
            </button>

            <button
              onClick={() => setActiveTab('resolved')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'resolved'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
            >
              <span>Resolved</span>
              <span className="text-[10px] font-mono opacity-80">51</span>
            </button>

            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
            >
              <span>All findings</span>
              <span className="text-[10px] font-mono opacity-80">158</span>
            </button>
          </div>

          <button
            onClick={() => toast.success('Exporting filtered findings as CSV/JSON...')}
            className="btn-secondary text-xs font-semibold px-3 py-1.5 self-start sm:self-auto"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export findings</span>
          </button>
        </div>

        {/* Filter Dropdowns Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div className="relative sm:col-span-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search findings, files, or rules..."
              className="w-full bg-white border border-[#eaecf0] focus:border-[#ea580c] rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none transition shadow-sm"
            />
          </div>

          <select
            value={selectedRepo}
            onChange={(e) => setSelectedRepo(e.target.value)}
            className="bg-white border border-[#eaecf0] rounded-xl px-3 py-2 text-slate-700 outline-none focus:border-[#ea580c] font-medium shadow-sm"
          >
            <option value="all">All repositories</option>
            <option value="auth-service">auth-service</option>
            <option value="dashboard-ui">dashboard-ui</option>
            <option value="ecommerce-api">ecommerce-api</option>
            <option value="infrastructure">infrastructure</option>
          </select>

          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="bg-white border border-[#eaecf0] rounded-xl px-3 py-2 text-slate-700 outline-none focus:border-[#ea580c] font-medium shadow-sm"
          >
            <option value="all">All severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-white border border-[#eaecf0] rounded-xl px-3 py-2 text-slate-700 outline-none focus:border-[#ea580c] font-medium shadow-sm"
          >
            <option value="all">All categories</option>
            <option value="secret">Exposed secrets</option>
            <option value="dependency">Dependencies</option>
            <option value="misconfiguration">Misconfigurations</option>
          </select>
        </div>

        {/* Findings Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-[#eaecf0]">
                <tr>
                  <th className="py-3 px-5 w-8">
                    <input type="checkbox" className="rounded border-slate-300" />
                  </th>
                  <th className="py-3 px-5">Finding</th>
                  <th className="py-3 px-5">Severity</th>
                  <th className="py-3 px-5">Repository</th>
                  <th className="py-3 px-5">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaecf0]">
                {filtered.map((f) => {
                  const isCrit = f.severity === 'CRITICAL'
                  const isHigh = f.severity === 'HIGH'
                  const badgeClass = isCrit ? 'badge-critical' : isHigh ? 'badge-high' : 'badge-medium'

                  return (
                    <tr
                      key={f.id}
                      onClick={() => openDrawer(f)}
                      className="hover:bg-slate-50/70 transition cursor-pointer"
                    >
                      <td className="py-3.5 px-5" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" className="rounded border-slate-300" />
                      </td>

                      <td className="py-3.5 px-5 max-w-lg">
                        <div className="font-bold text-slate-900 leading-snug line-clamp-1 hover:text-[#ea580c] transition">
                          {f.title}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                          <span className="text-slate-600 font-medium">{f.scanner || 'auth-service'}</span>
                          <span>•</span>
                          <span className="font-mono">{f.file_path || 'package-lock.json'}</span>
                          {f.verification_status === 'resolved' ? (
                            <span className="text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded text-[10px] font-bold">
                              ✓ Verified Resolved
                            </span>
                          ) : (
                            <span className="text-[#ea580c] bg-[#fff7ed] px-1.5 py-0.2 rounded text-[10px] font-semibold">
                              New in verification
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-5">
                        <span className={badgeClass}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          {f.severity.charAt(0) + f.severity.slice(1).toLowerCase()}
                        </span>
                      </td>

                      <td className="py-3.5 px-5 font-medium text-slate-600">
                        {f.scanner || 'auth-service'}
                      </td>

                      <td className="py-3.5 px-5">
                        <div className="text-slate-700 font-semibold">{f.scanner || 'Trivy'}</div>
                        {f.cve_id && (
                          <div className="text-[10px] font-mono text-slate-400 hover:text-blue-500">
                            {f.cve_id}
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  )
}
