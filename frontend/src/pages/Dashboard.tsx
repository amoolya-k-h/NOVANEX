import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Shield, AlertTriangle, CheckCircle, ArrowRight, Plus, ExternalLink,
  ChevronDown, FolderGit2, Check, TrendingDown, Sparkles, HelpCircle,
  Clock, ShieldAlert, BarChart3, Info, Lock, RefreshCw, Zap
} from 'lucide-react'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts'
import Layout from '../components/Layout'
import { useScanStore } from '../store/useScanStore'
import { getOverviewMetrics, listScans, getFindings } from '../api/client'
import { Finding } from '../types'
import { SeverityBadge } from '../components/SeverityBadge'

export default function Dashboard() {
  const navigate = useNavigate()
  const { setFindings, setScans, scans, openDrawer } = useScanStore()

  const [metrics, setMetrics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [recentScans, setRecentScans] = useState<any[]>([])

  const fetchDashboardData = () => {
    setLoading(true)
    Promise.all([
      getOverviewMetrics(),
      listScans()
    ])
      .then(([mRes, sRes]) => {
        setMetrics(mRes.data)
        const scanList = sRes.data || []
        setRecentScans(scanList)
        setScans(scanList)
        if (scanList.length > 0) {
          getFindings(scanList[0].id).then((fRes) => {
            setFindings(fRes.data.findings || [])
          })
        }
      })
      .catch((err) => {
        console.error('Failed to load dashboard metrics:', err)
      })
      .finally(() => {
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const hasScans = metrics?.has_scans && (metrics?.total_scans > 0 || recentScans.length > 0)

  // Real statistics from backend
  const totalScans = metrics?.total_scans ?? 0
  const totalVulns = metrics?.total_vulnerabilities ?? 0
  const criticalCount = metrics?.critical_issues ?? 0
  const highCount = metrics?.high_issues ?? 0
  const mediumCount = metrics?.medium_issues ?? 0
  const lowCount = metrics?.low_issues ?? 0
  const resolvedCount = metrics?.verified_fixes ?? 0
  const unresolvedCount = metrics?.unresolved_vulnerabilities ?? 0
  const securityPosture = metrics?.security_posture ?? 100
  const postureStatus = metrics?.security_posture_status ?? 'Good'
  const scoreCalculation = metrics?.score_calculation || 'Score = max(0, 100 - (15×Critical + 8×High + 3×Medium + 1×Low) + 3×Resolved)'

  // Severity chart data
  const severityData = [
    { name: 'Critical', value: criticalCount, color: '#ef4444' },
    { name: 'High', value: highCount, color: '#f97316' },
    { name: 'Medium', value: mediumCount, color: '#eab308' },
    { name: 'Low', value: lowCount, color: '#3b82f6' },
  ].filter(d => d.value > 0)

  // Category chart data
  const categoryData = metrics?.by_category
    ? Object.entries(metrics.by_category).map(([name, count]) => ({
        name,
        count,
      })).filter((c: any) => c.count > 0)
    : []

  // Trend data
  const trendData = metrics?.posture_trend && metrics.posture_trend.length > 0
    ? metrics.posture_trend
    : (recentScans.length > 0
        ? recentScans.slice().reverse().map((s, idx) => ({
            name: s.project_name || `Scan ${idx + 1}`,
            findings: s.total_findings || 0,
            critical: s.critical_count || 0,
          }))
        : [])

  return (
    <Layout>
      <div className="space-y-8 max-w-[1440px] mx-auto">
        {/* TOP HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">
              <Shield className="w-3.5 h-3.5" />
              Developer Security Posture
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Security Dashboard
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Continuous detection, AI analysis, remediation, and verification results across all projects.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchDashboardData}
              className="btn-secondary text-xs py-2 px-3 flex items-center gap-2"
              title="Refresh metrics"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <Link to="/upload" className="btn-primary text-xs py-2 px-4 flex items-center gap-2 shadow-lg">
              <Plus className="w-4 h-4" />
              <span>New Scan</span>
            </Link>
          </div>
        </div>

        {/* EMPTY STATE */}
        {!hasScans && !loading && (
          <div className="card p-12 text-center max-w-2xl mx-auto space-y-6 border-dashed border-[#2d3748]">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto shadow-inner">
              <Shield className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">No Security Scans Performed Yet</h2>
              <p className="text-sm text-slate-400 leading-relaxed max-w-md mx-auto">
                Upload your first project ZIP to detect hardcoded secrets, vulnerable dependencies, insecure code patterns, and configuration flaws.
              </p>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/upload" className="btn-primary py-2.5 px-6 text-sm flex items-center gap-2">
                <Plus className="w-4 h-4" /> Start Your First Scan
              </Link>
              <Link to="/verification" className="btn-secondary py-2.5 px-4 text-sm">
                How Verification Works
              </Link>
            </div>
          </div>
        )}

        {/* REAL METRICS DASHBOARD */}
        {hasScans && (
          <>
            {/* STATS OVERVIEW CARDS */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Security Score Card */}
              <div className="card p-5 relative overflow-hidden flex flex-col justify-between border-blue-500/20 bg-gradient-to-br from-[#131722] to-[#171d2e]">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Security Score
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                      securityPosture >= 80 ? 'bg-green-500/10 text-green-400 border border-green-500/30' :
                      securityPosture >= 60 ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30' :
                      'bg-red-500/10 text-red-400 border border-red-500/30'
                    }`}>
                      {postureStatus}
                    </span>
                  </div>
                  <div className="text-4xl font-black text-white mt-3">
                    {securityPosture}<span className="text-lg font-normal text-slate-500">/100</span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-[#1f2638] text-[11px] text-slate-400 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                  <span className="truncate" title={scoreCalculation}>Calculated from weighted severities</span>
                </div>
              </div>

              {/* Total Scans Card */}
              <div className="card p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <span>Total Scans</span>
                    <Clock className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className="text-4xl font-black text-white mt-3">
                    {totalScans}
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-[#1f2638] text-[11px] text-slate-400">
                  {metrics?.repositories_count || 1} project(s) analyzed
                </div>
              </div>

              {/* Total Vulnerabilities Card */}
              <div className="card p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <span>Vulnerabilities</span>
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="text-4xl font-black text-white mt-3">
                    {totalVulns}
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-[#1f2638] text-[11px] text-slate-400 flex justify-between">
                  <span className="text-red-400 font-semibold">{criticalCount} critical</span>
                  <span className="text-orange-400 font-semibold">{highCount} high</span>
                </div>
              </div>

              {/* Resolution Card */}
              <div className="card p-5 flex flex-col justify-between border-green-500/20">
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <span>Resolved / Verified</span>
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  </div>
                  <div className="text-4xl font-black text-green-400 mt-3">
                    {resolvedCount}
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-[#1f2638] text-[11px] text-slate-400 flex justify-between">
                  <span>{unresolvedCount} remaining</span>
                  <span className="text-green-400 font-bold">
                    {totalVulns > 0 ? Math.round((resolvedCount / totalVulns) * 100) : 0}% rate
                  </span>
                </div>
              </div>
            </div>

            {/* SEVERITY BREAKDOWN BAR PILLS */}
            <div className="card p-4">
              <div className="text-xs font-semibold text-slate-400 mb-3 flex items-center justify-between">
                <span>Severity Distribution</span>
                <span className="text-[11px] font-mono text-slate-500">{totalVulns} total detected</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-red-400 font-bold uppercase">Critical</div>
                    <div className="text-2xl font-black text-white">{criticalCount}</div>
                  </div>
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                </div>
                <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-orange-400 font-bold uppercase">High</div>
                    <div className="text-2xl font-black text-white">{highCount}</div>
                  </div>
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                </div>
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-amber-400 font-bold uppercase">Medium</div>
                    <div className="text-2xl font-black text-white">{mediumCount}</div>
                  </div>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                </div>
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-blue-400 font-bold uppercase">Low</div>
                    <div className="text-2xl font-black text-white">{lowCount}</div>
                  </div>
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                </div>
              </div>
            </div>

            {/* CHARTS GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Chart 1: Trend over Scans */}
              <div className="card p-6 lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-white">Vulnerability Trend Across Scans</h3>
                    <p className="text-xs text-slate-400">Total detected issues over scan history</p>
                  </div>
                  <span className="text-xs font-mono text-slate-500 bg-[#1a202c] px-2 py-1 rounded">
                    Chronological
                  </span>
                </div>
                <div className="h-64">
                  {trendData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2638" />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#131722', borderColor: '#212738', borderRadius: 8, fontSize: 12, color: '#fff' }}
                        />
                        <Area type="monotone" dataKey="findings" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#trendGradient)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-slate-500">
                      Not enough scan history yet
                    </div>
                  )}
                </div>
              </div>

              {/* Chart 2: Severity Distribution Donut */}
              <div className="card p-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Severity Breakdown</h3>
                  <p className="text-xs text-slate-400">Proportion by risk level</p>
                </div>
                <div className="h-52 my-2">
                  {severityData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={severityData}
                          innerRadius={50}
                          outerRadius={75}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {severityData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: '#131722', borderColor: '#212738', borderRadius: 8, fontSize: 12, color: '#fff' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-slate-500">
                      No active vulnerabilities
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {severityData.map(d => (
                    <div key={d.name} className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-slate-400">{d.name}:</span>
                      <span className="font-bold text-white ml-auto">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* CATEGORY DISTRIBUTION & SCORE FORMULA */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Category Breakdown */}
              <div className="card p-6 lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-white">Vulnerability Categories</h3>
                    <p className="text-xs text-slate-400">Secrets, Dependencies, Insecure Code, Misconfiguration</p>
                  </div>
                  <BarChart3 className="w-4 h-4 text-slate-500" />
                </div>
                <div className="h-56">
                  {categoryData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2638" />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#131722', borderColor: '#212738', borderRadius: 8, fontSize: 12, color: '#fff' }}
                        />
                        <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-slate-500">
                      No category data available
                    </div>
                  )}
                </div>
              </div>

              {/* Documented Score Calculation Card */}
              <div className="card p-6 space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <ShieldAlert className="w-4 h-4 text-blue-400" />
                  <span>Security Score Model</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  RepoGuard AI calculates transparent security posture from deterministic risk penalties and remediation bonuses:
                </p>
                <div className="bg-[#0c0e14] border border-[#1f2638] rounded-xl p-3 font-mono text-[11px] text-blue-300 leading-relaxed">
                  {scoreCalculation}
                </div>
                <div className="space-y-1.5 text-xs text-slate-400">
                  <div className="flex justify-between">
                    <span>Critical Penalty:</span>
                    <span className="text-red-400 font-mono">-15 pts each</span>
                  </div>
                  <div className="flex justify-between">
                    <span>High Severity Penalty:</span>
                    <span className="text-orange-400 font-mono">-8 pts each</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Medium Severity Penalty:</span>
                    <span className="text-amber-400 font-mono">-3 pts each</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Low Severity Penalty:</span>
                    <span className="text-blue-400 font-mono">-1 pt each</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Verified Fix Reward:</span>
                    <span className="text-green-400 font-mono">+3 pts each</span>
                  </div>
                </div>
              </div>
            </div>

            {/* RECENT SCAN HISTORY TABLE */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-white">Recent Security Scans</h3>
                  <p className="text-xs text-slate-400">Latest analysis runs and findings counts</p>
                </div>
                <Link to="/history" className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1">
                  View all history <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#181d2a] text-slate-400 uppercase text-[10px] tracking-wider border-b border-[#212738]">
                    <tr>
                      <th className="py-2.5 px-4 font-bold">Project Name</th>
                      <th className="py-2.5 px-4 font-bold">Scan Type</th>
                      <th className="py-2.5 px-4 font-bold">Status</th>
                      <th className="py-2.5 px-4 font-bold">Findings</th>
                      <th className="py-2.5 px-4 font-bold">Critical / High</th>
                      <th className="py-2.5 px-4 font-bold">Date</th>
                      <th className="py-2.5 px-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1f2638]">
                    {recentScans.slice(0, 5).map((s) => (
                      <tr key={s.id} className="hover:bg-[#161a27] transition">
                        <td className="py-3 px-4 font-semibold text-white">
                          <Link to={`/findings?scan=${s.id}`} className="hover:text-blue-400 flex items-center gap-2">
                            <FolderGit2 className="w-4 h-4 text-slate-500" />
                            <span>{s.project_name}</span>
                          </Link>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase ${
                            s.scan_type === 'verification' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          }`}>
                            {s.scan_type || 'initial'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 text-green-400">
                            <CheckCircle className="w-3.5 h-3.5" /> Completed
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-200">
                          {s.total_findings || 0}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-red-400 font-semibold">{s.critical_count || 0}</span>
                          <span className="text-slate-600 mx-1">/</span>
                          <span className="text-orange-400 font-semibold">{s.high_count || 0}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-400">
                          {s.created_at ? new Date(s.created_at).toLocaleString() : 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            to={`/findings?scan=${s.id}`}
                            className="text-blue-400 hover:text-blue-300 font-semibold inline-flex items-center gap-1"
                          >
                            Explore <ArrowRight className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}
