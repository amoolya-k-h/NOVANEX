import React, { useEffect, useState, useMemo } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import {
  Search, Plus, Download, ChevronDown, CheckCircle2, AlertTriangle,
  FileCode, ExternalLink, Filter, ArrowUpDown, Shield, RefreshCw, X
} from 'lucide-react'
import Layout from '../components/Layout'
import { useScanStore } from '../store/useScanStore'
import { getFindings, listScans } from '../api/client'
import { Finding } from '../types'
import { SeverityBadge } from '../components/SeverityBadge'
import toast from 'react-hot-toast'

export default function Findings() {
  const [searchParams, setSearchParams] = useSearchParams()
  const scanIdFromUrl = searchParams.get('scan')

  const { openDrawer, findings, setFindings, scans, setScans } = useScanStore()

  const [loading, setLoading] = useState(true)
  const [selectedScanId, setSelectedScanId] = useState<string>(scanIdFromUrl || 'all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSeverity, setSelectedSeverity] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [sortBy, setSortBy] = useState<'risk' | 'severity' | 'date' | 'title'>('risk')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Load scans and findings
  const loadData = () => {
    setLoading(true)
    listScans()
      .then((sRes) => {
        const scanList = sRes.data || []
        setScans(scanList)

        let targetScanId = scanIdFromUrl
        if (!targetScanId && scanList.length > 0) {
          targetScanId = scanList[0].id
        }

        if (targetScanId && targetScanId !== 'all') {
          setSelectedScanId(targetScanId)
          return getFindings(targetScanId).then((fRes) => {
            setFindings(fRes.data.findings || [])
          })
        } else if (scanList.length > 0) {
          return getFindings(scanList[0].id).then((fRes) => {
            setFindings(fRes.data.findings || [])
          })
        } else {
          setFindings([])
        }
      })
      .catch((err) => {
        console.error('Failed to fetch findings:', err)
      })
      .finally(() => {
        setLoading(false)
      })
  }

  useEffect(() => {
    loadData()
  }, [scanIdFromUrl])

  const handleScanChange = (newScanId: string) => {
    setSelectedScanId(newScanId)
    if (newScanId === 'all') {
      setSearchParams({})
      if (scans.length > 0) {
        getFindings(scans[0].id).then((res) => setFindings(res.data.findings || []))
      }
    } else {
      setSearchParams({ scan: newScanId })
      getFindings(newScanId).then((res) => setFindings(res.data.findings || []))
    }
  }

  // Filter and sort findings
  const filteredFindings = useMemo(() => {
    return findings
      .filter((f) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase()
          const matchTitle = f.title?.toLowerCase().includes(q)
          const matchFile = f.file_path?.toLowerCase().includes(q)
          const matchCve = f.cve_id?.toLowerCase().includes(q)
          const matchScanner = f.scanner?.toLowerCase().includes(q)
          if (!matchTitle && !matchFile && !matchCve && !matchScanner) return false
        }

        // Severity filter
        if (selectedSeverity !== 'all') {
          if (f.severity?.toUpperCase() !== selectedSeverity.toUpperCase()) return false
        }

        // Category filter
        if (selectedCategory !== 'all') {
          const cat = f.category?.toLowerCase()
          if (selectedCategory === 'secret' && cat !== 'secret') return false
          if (selectedCategory === 'dependency' && cat !== 'dependency') return false
          if (selectedCategory === 'sast' && !['sast', 'code'].includes(cat)) return false
          if (selectedCategory === 'misconfig' && !['misconfiguration', 'iac'].includes(cat)) return false
        }

        // Status filter
        if (selectedStatus !== 'all') {
          const isResolved = (f.verification_status || '').toLowerCase() === 'resolved' || f.status === 'resolved'
          if (selectedStatus === 'resolved' && !isResolved) return false
          if (selectedStatus === 'open' && isResolved) return false
        }

        return true
      })
      .sort((a, b) => {
        const sevWeight: Record<string, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 }
        if (sortBy === 'severity') {
          const diff = (sevWeight[b.severity?.toUpperCase()] || 0) - (sevWeight[a.severity?.toUpperCase()] || 0)
          return sortOrder === 'desc' ? diff : -diff
        }
        if (sortBy === 'risk') {
          const diff = (b.risk_score || 0) - (a.risk_score || 0)
          return sortOrder === 'desc' ? diff : -diff
        }
        if (sortBy === 'title') {
          return sortOrder === 'desc'
            ? b.title.localeCompare(a.title)
            : a.title.localeCompare(b.title)
        }
        return 0
      })
  }, [findings, searchQuery, selectedSeverity, selectedCategory, selectedStatus, sortBy, sortOrder])

  return (
    <Layout>
      <div className="space-y-6 max-w-[1440px] mx-auto">
        {/* TOP HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">
              <Shield className="w-3.5 h-3.5" />
              Vulnerability Inventory & Explorer
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Findings Explorer
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Search, filter, and inspect verified vulnerabilities across exposed secrets, dependencies, SAST code, and configurations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              className="btn-secondary text-xs py-2 px-3 flex items-center gap-2"
              title="Refresh findings"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <Link to="/upload" className="btn-primary text-xs py-2 px-4 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span>New Scan</span>
            </Link>
          </div>
        </div>

        {/* CONTROLS BAR: Project Selector, Search, and Filters */}
        <div className="card p-4 space-y-3">
          <div className="flex flex-col md:flex-row items-center gap-3">
            {/* Scan / Project Selector */}
            <div className="w-full md:w-64 flex-shrink-0">
              <select
                value={selectedScanId}
                onChange={(e) => handleScanChange(e.target.value)}
                className="w-full bg-[#181d2a] border border-[#26314d] text-xs font-semibold text-white rounded-xl px-3 py-2.5 outline-none focus:border-blue-500"
              >
                {scans.length === 0 ? (
                  <option value="none">No scans available</option>
                ) : (
                  scans.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.project_name} ({s.scan_type || 'scan'}) — {s.total_findings} findings
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search findings by title, file, CVE, or detection scanner..."
                className="w-full bg-[#181d2a] border border-[#26314d] rounded-xl pl-10 pr-8 py-2 text-xs text-white placeholder-slate-400 outline-none focus:border-blue-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Quick Filter Pills */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#1f2638] text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-400 font-semibold flex items-center gap-1 mr-1">
                <Filter className="w-3.5 h-3.5" /> Filters:
              </span>

              {/* Severity Filter */}
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="bg-[#181d2a] border border-[#26314d] rounded-lg px-2.5 py-1 text-slate-300 text-xs font-medium outline-none"
              >
                <option value="all">All Severities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-[#181d2a] border border-[#26314d] rounded-lg px-2.5 py-1 text-slate-300 text-xs font-medium outline-none"
              >
                <option value="all">All Categories</option>
                <option value="secret">Exposed Secrets</option>
                <option value="dependency">Dependencies</option>
                <option value="sast">Insecure Code (SAST)</option>
                <option value="misconfig">Misconfigurations</option>
              </select>

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-[#181d2a] border border-[#26314d] rounded-lg px-2.5 py-1 text-slate-300 text-xs font-medium outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="open">Open / Unresolved</option>
                <option value="resolved">Verified / Resolved</option>
              </select>
            </div>

            {/* Sorting */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-semibold">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-[#181d2a] border border-[#26314d] rounded-lg px-2.5 py-1 text-slate-300 text-xs font-medium outline-none"
              >
                <option value="risk">Risk Score</option>
                <option value="severity">Severity Level</option>
                <option value="title">Title (A-Z)</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-1 rounded bg-[#181d2a] border border-[#26314d] text-slate-400 hover:text-white"
                title={`Order: ${sortOrder.toUpperCase()}`}
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* FINDINGS TABLE OR EMPTY STATE */}
        {filteredFindings.length === 0 ? (
          <div className="card p-12 text-center space-y-4 border-dashed border-[#26314d]">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">No Vulnerabilities Match Filter</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                {findings.length === 0
                  ? 'No scan findings in the database. Run a security scan to populate results.'
                  : 'Try clearing your search query or adjusting the severity and category filters.'}
              </p>
            </div>
            {findings.length === 0 && (
              <Link to="/upload" className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-2">
                <Plus className="w-3.5 h-3.5" /> Start New Scan
              </Link>
            )}
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="px-6 py-3 bg-[#151926] border-b border-[#212738] flex items-center justify-between text-xs text-slate-400">
              <span>Showing <strong>{filteredFindings.length}</strong> findings</span>
              <span className="font-mono text-[11px]">Click any finding row to open detailed security dossier</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#181d2a] text-slate-400 uppercase text-[10px] tracking-wider border-b border-[#212738]">
                  <tr>
                    <th className="py-3 px-6 font-bold">Severity</th>
                    <th className="py-3 px-6 font-bold">Vulnerability Title</th>
                    <th className="py-3 px-6 font-bold">Category</th>
                    <th className="py-3 px-6 font-bold">File & Line</th>
                    <th className="py-3 px-6 font-bold">Detection Tool</th>
                    <th className="py-3 px-6 font-bold">Status</th>
                    <th className="py-3 px-6 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1f2638]">
                  {filteredFindings.map((f) => {
                    const isResolved = (f.verification_status || '').toLowerCase() === 'resolved' || f.status === 'resolved'

                    return (
                      <tr
                        key={f.id}
                        onClick={() => openDrawer(f)}
                        className="hover:bg-[#161b2a] transition cursor-pointer group"
                      >
                        {/* Severity Badge */}
                        <td className="py-3.5 px-6 whitespace-nowrap">
                          <SeverityBadge severity={f.severity} />
                        </td>

                        {/* Title & CVE */}
                        <td className="py-3.5 px-6">
                          <div className="font-bold text-white group-hover:text-blue-400 transition leading-snug line-clamp-2">
                            {f.title}
                          </div>
                          {f.cve_id && (
                            <span className="inline-block mt-1 text-[10px] font-mono text-slate-400 bg-[#0c0e14] px-1.5 py-0.5 rounded border border-[#212738]">
                              {f.cve_id}
                            </span>
                          )}
                        </td>

                        {/* Category */}
                        <td className="py-3.5 px-6 whitespace-nowrap">
                          <span className="capitalize text-slate-300 font-medium px-2 py-0.5 rounded bg-[#1b2234] border border-[#26314d]">
                            {f.category}
                          </span>
                        </td>

                        {/* Affected File & Line */}
                        <td className="py-3.5 px-6 font-mono text-[11px] text-slate-300">
                          {f.file_path ? (
                            <div className="flex items-center gap-1.5 truncate max-w-xs">
                              <FileCode className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                              <span className="truncate" title={f.file_path}>{f.file_path}</span>
                              {f.line_number && (
                                <span className="text-slate-500">:{f.line_number}</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-500">Project level</span>
                          )}
                        </td>

                        {/* Scanner Engine */}
                        <td className="py-3.5 px-6 whitespace-nowrap font-semibold text-slate-300">
                          {f.scanner || 'RepoGuard'}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-6 whitespace-nowrap">
                          {isResolved ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold text-green-400 bg-green-500/10 border border-green-500/30">
                              <CheckCircle2 className="w-3 h-3" /> Resolved
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30">
                              <AlertTriangle className="w-3 h-3" /> Open
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-6 text-right whitespace-nowrap">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              openDrawer(f)
                            }}
                            className="text-xs font-semibold text-blue-400 hover:text-blue-300 inline-flex items-center gap-1"
                          >
                            Details <ExternalLink className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
