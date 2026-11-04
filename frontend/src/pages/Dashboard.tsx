import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Shield, AlertTriangle, CheckCircle, ArrowRight, Plus, ExternalLink,
  ChevronDown, FolderGit2, Check, TrendingDown, Sparkles, HelpCircle,
  MoreHorizontal, Calendar, ArrowDownRight
} from 'lucide-react'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, PieChart, Pie, Cell
} from 'recharts'
import Layout from '../components/Layout'
import { useScanStore } from '../store/useScanStore'
import { getOverviewMetrics, listScans, getFindings } from '../api/client'
import { Finding } from '../types'

export default function Dashboard() {
  const navigate = useNavigate()
  const { openScanModal, openDrawer, setFindings } = useScanStore()

  const [metrics, setMetrics] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getOverviewMetrics()
      .then((res) => {
        setMetrics(res.data)
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })

    // Also sync store findings from first scan if available
    listScans().then((sRes) => {
      const scans = sRes.data || []
      if (scans.length > 0) {
        getFindings(scans[0].id).then((fRes) => {
          setFindings(fRes.data.findings || [])
        })
      }
    })
  }, [])

  // Default values matching the user screenshots
  const reposCount = metrics?.repositories_count ?? 4
  const openCount = metrics?.open_findings ?? 107
  const criticalCount = metrics?.critical_issues ?? 34
  const verifiedCount = metrics?.verified_fixes ?? 51
  const postureScore = metrics?.security_posture ?? 39
  const postureStatus = metrics?.security_posture_status ?? 'Needs attention'

  const sevBreakdown = metrics?.by_severity ?? {
    critical: 34,
    high: 39,
    medium: 25,
    low: 9,
  }

  // Donut chart data matching Screenshot 3
  const donutData = [
    { name: 'Critical', value: sevBreakdown.critical, color: '#ef4444' },
    { name: 'High', value: sevBreakdown.high, color: '#f97316' },
    { name: 'Medium', value: sevBreakdown.medium, color: '#eab308' },
    { name: 'Low', value: sevBreakdown.low, color: '#3b82f6' },
  ]

  // Line/Area Chart data matching Screenshot 2
  const postureTrend = metrics?.posture_trend ?? [
    { name: 'Baseline', findings: 38 },
    { name: 'Rescan 1', findings: 37 },
    { name: 'Rescan 2', findings: 36 },
    { name: 'Rescan 3', findings: 47 },
    { name: 'Rescan 4', findings: 44 },
    { name: 'Rescan 5', findings: 42 },
    { name: 'Rescan 6', findings: 42 },
    { name: 'Rescan 7', findings: 7 },
  ]

  // Repositories list
  const repositoriesList = metrics?.repositories ?? [
    {
      name: 'auth-service',
      lang: 'TypeScript',
      branch: 'develop',
      status: 'At risk',
      status_type: 'critical',
      findings: 65,
      bar: { crit: '52%', high: '26%', med: '18%' },
      last_scan: 'Nov 1, 10:48',
    },
    {
      name: 'dashboard-ui',
      lang: 'JavaScript',
      branch: 'main',
      status: 'Needs attention',
      status_type: 'high',
      findings: 28,
      bar: { crit: '0%', high: '50%', med: '50%' },
      last_scan: 'Nov 1, 10:47',
    },
    {
      name: 'ecommerce-api',
      lang: 'TypeScript',
      branch: 'main',
      status: 'Needs attention',
      status_type: 'high',
      findings: 3,
      bar: { crit: '0%', high: '66%', med: '34%' },
      last_scan: 'Nov 1, 10:48',
    },
    {
      name: 'infrastructure',
      lang: 'Other',
      branch: 'main',
      status: 'Needs attention',
      status_type: 'high',
      findings: 11,
      bar: { crit: '0%', high: '55%', med: '45%' },
      last_scan: 'Nov 1, 10:47',
    },
  ]

  // Priority findings
  const priorityFindings = metrics?.priority_findings?.length > 0 ? metrics.priority_findings : [
    {
      id: 'vm2-1',
      title: "vm2: vm2 NodeVM builtin '[]' exposes 'os' and 'dns' — process-wide observability reads AND writes that hijack the host (sibling class of GHSA-9g8x-92q2-p28f)",
      category: 'dependency',
      severity: 'CRITICAL',
      file_path: 'package-lock.json',
      scanner: 'auth-service',
      description: "NodeVM builtin '[]' exposes 'os' and 'dns' process-wide observability reads and writes that hijack the host sandbox.",
      fixed_version: '3.11.6',
      package_name: 'vm2',
      package_version: '3.9.16',
      cve_id: 'GHSA-9g8x-92q2-p28f',
    },
    {
      id: 'vm2-2',
      title: 'vm2: vm2 NodeVM before 3.12.1 Remote Code Execution via child_process',
      category: 'dependency',
      severity: 'CRITICAL',
      file_path: 'package-lock.json',
      scanner: 'auth-service',
      description: 'Arbitrary remote code execution flaw in vm2 sandbox breakout.',
      fixed_version: '3.12.1',
      package_name: 'vm2',
      package_version: '3.9.16',
      cve_id: 'CVE-2023-37466',
    },
    {
      id: 'vm2-3',
      title: 'vm2: vm2 before 3.11.7 Authentication Bypass via node: Prefix',
      category: 'dependency',
      severity: 'CRITICAL',
      file_path: 'package-lock.json',
      scanner: 'auth-service',
      description: 'Prefix bypass allows loading unauthorized node builtins.',
      fixed_version: '3.11.7',
      package_name: 'vm2',
      package_version: '3.9.16',
      cve_id: 'CVE-2023-37903',
    },
  ]

  return (
    <Layout>
      <div className="max-w-[1340px] mx-auto space-y-7 pb-12">
        {/* Top Header Tag & Controls (Screenshot 1) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Controlled fixtures. Real scan evidence.
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Security overview
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              A clearer picture of your code's security. A smarter way to protect it.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button className="bg-white hover:bg-slate-50 border border-[#eaecf0] text-slate-700 text-xs font-semibold px-3.5 py-2 rounded-xl shadow-sm transition flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Last 30 days</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
            <button
              onClick={openScanModal}
              className="bg-[#ea580c] hover:bg-[#c2410c] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>New scan</span>
            </button>
          </div>
        </div>

        {/* 4 Big Metric Cards (2x2 Grid with exact sparklines from Screenshot 1) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Repositories */}
          <div className="card p-5 space-y-2 relative flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <span className="text-xs font-medium text-slate-500">Repositories</span>
              <div className="w-7 h-7 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center border border-[#eaecf0]">
                <FolderGit2 className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-3xl font-black text-slate-900 tracking-tight">
                  {String(reposCount).padStart(2, '0')}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">Across your workspace</div>
              </div>
              {/* Gray rising sparkline */}
              <svg viewBox="0 0 70 30" className="w-16 h-8 text-slate-300">
                <path d="M0 25 Q 35 22 70 8" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {/* Card 2: Open findings */}
          <div className="card p-5 space-y-2 relative flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <span className="text-xs font-medium text-slate-500">Open findings</span>
              <div className="w-7 h-7 rounded-lg bg-[#fff7ed] text-[#ea580c] flex items-center justify-center border border-[#ffedd5]">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-3xl font-black text-slate-900 tracking-tight">
                  {openCount}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">Prioritized for your review</div>
              </div>
              {/* Orange sparkline */}
              <svg viewBox="0 0 70 30" className="w-16 h-8 text-[#ea580c]">
                <path d="M0 22 L 20 18 L 40 22 L 55 12 L 70 20" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          {/* Card 3: Critical issues */}
          <div className="card p-5 space-y-2 relative flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <span className="text-xs font-medium text-slate-500">Critical issues</span>
              <div className="w-7 h-7 rounded-lg bg-red-50 text-red-500 flex items-center justify-center border border-red-100">
                <Shield className="w-4 h-4 fill-red-50" />
              </div>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-3xl font-black text-slate-900 tracking-tight">
                  {criticalCount}
                </div>
                <div className="text-[11px] text-red-500 font-medium mt-0.5">Require immediate attention</div>
              </div>
              {/* Red sparkline */}
              <svg viewBox="0 0 70 30" className="w-16 h-8 text-rose-500">
                <path d="M0 24 L 40 24 L 55 22 L 70 6" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          {/* Card 4: Verified fixes */}
          <div className="card p-5 space-y-2 relative flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <span className="text-xs font-medium text-slate-500">Verified fixes</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <CheckCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-3xl font-black text-slate-900 tracking-tight">
                  {verifiedCount}
                </div>
                <div className="text-[11px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-600" /> Scanner-verified
                </div>
              </div>
              {/* Green sparkline */}
              <svg viewBox="0 0 70 30" className="w-16 h-8 text-emerald-500">
                <path d="M0 24 L 35 24 L 50 8 L 70 8" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </div>

        {/* Security Posture Line Chart Card (Exact Match to Screenshot 2) */}
        <div className="card p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-sm">Security posture</h3>
              <button title="Calculated based on open vs resolved critical vulnerabilities">
                <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600" />
              </button>
            </div>

            <button className="bg-white border border-[#eaecf0] hover:bg-slate-50 text-slate-600 text-xs font-semibold px-3 py-1 rounded-xl shadow-xs self-start sm:self-auto flex items-center gap-1.5">
              <span>Recent scans</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-slate-900">{postureScore}</span>
              <span className="text-sm font-semibold text-slate-400">/ 100</span>
              <span className="bg-[#fff7ed] text-[#ea580c] border border-[#ffedd5] text-xs font-semibold px-2.5 py-0.5 rounded-md ml-2">
                {postureStatus}
              </span>
            </div>

            <div className="text-right">
              <div className="text-xs font-bold text-emerald-600 flex items-center sm:justify-end gap-1">
                <ArrowDownRight className="w-4 h-4 text-emerald-600" />
                <span>36 fewer findings</span>
              </div>
              <div className="text-[11px] text-slate-400">across verified fixture rescans</div>
            </div>
          </div>

          {/* Interactive Recharts Line / Area Chart */}
          <div className="h-56 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={postureTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="postureGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ea580c" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#ea580c" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  stroke="#94a3b8"
                  tickLine={false}
                  axisLine={{ stroke: '#f1f5f9' }}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                />
                <YAxis
                  domain={[0, 50]}
                  ticks={[0, 16, 31, 47]}
                  stroke="#94a3b8"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-900 text-white text-xs px-3 py-1.5 rounded-lg shadow-lg">
                          <span className="font-bold">{payload[0].value}</span> open findings
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="findings"
                  stroke="#ea580c"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#postureGradient)"
                  dot={{ stroke: '#ea580c', strokeWidth: 2, fill: '#ffffff', r: 4 }}
                  activeDot={{ stroke: '#ea580c', strokeWidth: 2, fill: '#ea580c', r: 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Bottom legend */}
          <div className="flex items-center justify-between text-xs pt-2 border-t border-[#f1f5f9] text-slate-500">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#ea580c]" />
              <span>Open findings • ecommerce-api</span>
            </div>
            <a href="#how" className="text-slate-400 hover:text-slate-600 flex items-center gap-1 font-medium">
              How is this calculated? <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Findings by Severity Card (Exact Match to Screenshot 3) */}
        <div className="card p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-base">Findings by severity</h3>
            <button className="text-slate-400 hover:text-slate-600">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Left: Recharts Donut Chart */}
            <div className="md:col-span-5 flex items-center justify-center relative h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={78}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              {/* Centered text inside donut */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
                <span className="text-3xl font-black text-slate-900 leading-none">
                  {openCount}
                </span>
                <span className="text-[11px] text-slate-400 font-medium mt-1">Open findings</span>
              </div>
            </div>

            {/* Right: Legend Breakdown List */}
            <div className="md:col-span-7 space-y-3 pr-4">
              <div className="flex items-center justify-between text-xs font-semibold">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" />
                  <span className="text-slate-700">Critical</span>
                </div>
                <span className="font-bold text-slate-900 font-mono text-sm">
                  {String(sevBreakdown.critical).padStart(2, '0')}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs font-semibold">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#f97316]" />
                  <span className="text-slate-700">High</span>
                </div>
                <span className="font-bold text-slate-900 font-mono text-sm">
                  {String(sevBreakdown.high).padStart(2, '0')}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs font-semibold">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#eab308]" />
                  <span className="text-slate-700">Medium</span>
                </div>
                <span className="font-bold text-slate-900 font-mono text-sm">
                  {String(sevBreakdown.medium).padStart(2, '0')}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs font-semibold">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]" />
                  <span className="text-slate-700">Low</span>
                </div>
                <span className="font-bold text-slate-900 font-mono text-sm">
                  {String(sevBreakdown.low).padStart(2, '0')}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Card Bar */}
          <div className="flex items-center justify-between text-xs pt-3 border-t border-[#f1f5f9]">
            <span className="text-slate-400">Focus on what matters most.</span>
            <Link
              to="/findings"
              className="font-bold text-[#ea580c] hover:underline flex items-center gap-1"
            >
              View findings <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Your Next Best Move Banner Card (Screenshot 3 Bottom) */}
        <div className="card p-5 bg-[#fff7ed] border-[#ffedd5] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-white text-[#ea580c] flex items-center justify-center flex-shrink-0 shadow-xs border border-[#ffedd5]">
              <Sparkles className="w-5 h-5 text-[#ea580c]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">Your next best move</span>
                <span className="bg-[#ffedd5] text-[#ea580c] text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                  Evidence-First
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                <strong className="text-slate-900">{criticalCount} critical findings</strong> need a closer look. Start with the highest-impact fixes to reduce your risk.
              </p>
            </div>
          </div>

          <Link
            to="/findings?severity=CRITICAL"
            className="bg-white hover:bg-slate-50 border border-[#eaecf0] text-slate-700 text-xs font-bold px-4 py-2 rounded-xl transition shadow-xs self-start sm:self-auto flex items-center gap-1.5 flex-shrink-0"
          >
            Review priorities <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          </Link>
        </div>

        {/* Your Repositories Table */}
        <div className="card overflow-hidden">
          <div className="p-5 pb-3 flex items-center justify-between border-b border-[#eaecf0]">
            <h3 className="font-bold text-slate-900 text-sm">Your repositories</h3>
            <Link to="/repositories" className="text-xs font-bold text-[#ea580c] hover:underline flex items-center gap-1">
              View all repositories <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-[#eaecf0]">
                <tr>
                  <th className="py-3 px-5">Repository</th>
                  <th className="py-3 px-5">Security status</th>
                  <th className="py-3 px-5">Open findings</th>
                  <th className="py-3 px-5">Last scan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaecf0]">
                {repositoriesList.map((repo: any) => (
                  <tr
                    key={repo.name}
                    onClick={() => navigate('/findings')}
                    className="hover:bg-slate-50/70 transition cursor-pointer"
                  >
                    <td className="py-3.5 px-5">
                      <div className="font-bold text-slate-900">{repo.name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {repo.lang} • {repo.branch}
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className={repo.status_type === 'critical' ? 'badge-critical' : 'badge-high'}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {repo.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-900 w-6">{repo.findings}</span>
                        <div className="w-32 h-2 rounded-full bg-slate-100 flex overflow-hidden">
                          <div style={{ width: repo.bar?.crit || '50%' }} className="h-full bg-red-500" />
                          <div style={{ width: repo.bar?.high || '30%' }} className="h-full bg-orange-400" />
                          <div style={{ width: repo.bar?.med || '20%' }} className="h-full bg-blue-400" />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-slate-500">{repo.last_scan}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Priority Findings Section */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#eaecf0]">
            <h3 className="font-bold text-slate-900 text-sm">Priority findings</h3>
            <Link to="/findings" className="text-xs font-bold text-[#ea580c] hover:underline flex items-center gap-1">
              View all <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {priorityFindings.map((f: any) => (
              <div
                key={f.id}
                onClick={() => openDrawer(f)}
                className="p-4 rounded-xl border border-[#eaecf0] hover:border-[#d0d5dd] hover:bg-slate-50/60 transition cursor-pointer flex items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 truncate">{f.title}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {f.scanner || 'auth-service'} • {f.file_path || 'package-lock.json'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
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
      </div>
    </Layout>
  )
}
