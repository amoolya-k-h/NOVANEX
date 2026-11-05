import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Clock, CheckCircle, Plus, Search, FolderGit2, ArrowRight,
  Shield, Download, RefreshCw, AlertTriangle
} from 'lucide-react'
import Layout from '../components/Layout'
import { useScanStore } from '../store/useScanStore'
import { listScans, downloadHtmlReport } from '../api/client'

export default function ScanHistory() {
  const { scans, setScans } = useScanStore()
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')

  const fetchScans = () => {
    setLoading(true)
    listScans()
      .then((res) => {
        setScans(res.data || [])
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchScans()
  }, [])

  const filteredScans = scans.filter((s) => {
    if (search.trim()) {
      const q = search.toLowerCase()
      if (!s.project_name?.toLowerCase().includes(q) && !s.id?.toLowerCase().includes(q)) {
        return false
      }
    }
    if (filterType !== 'all') {
      if (filterType === 'initial' && s.scan_type === 'verification') return false
      if (filterType === 'verification' && s.scan_type !== 'verification') return false
    }
    return true
  })

  return (
    <Layout>
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">
              <Clock className="w-3.5 h-3.5" />
              Audit Log & Scan History
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Scan History
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Historical timeline of security scans, verification runs, and vulnerability reduction trends.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchScans}
              className="btn-secondary text-xs py-2 px-3 flex items-center gap-2"
              title="Refresh scan history"
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

        {/* Filter & Search Bar */}
        <div className="card p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative flex-1 w-full sm:max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by project name or scan ID..."
              className="w-full bg-[#181d2a] border border-[#26314d] rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-400 outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-slate-400 font-semibold">Type:</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-[#181d2a] border border-[#26314d] text-xs font-semibold text-white rounded-xl px-3 py-1.5 outline-none"
            >
              <option value="all">All Scans ({scans.length})</option>
              <option value="initial">Initial Scans</option>
              <option value="verification">Verification Rescans</option>
            </select>
          </div>
        </div>

        {/* Scans Table */}
        {filteredScans.length === 0 ? (
          <div className="card p-12 text-center space-y-4 border-dashed border-[#26314d]">
            <Clock className="w-10 h-10 text-slate-500 mx-auto" />
            <h3 className="text-base font-bold text-white">No Scan Records Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {scans.length === 0
                ? 'No scans have been performed yet. Start a new scan to begin auditing your repositories.'
                : 'No historical scans match your search query.'}
            </p>
            {scans.length === 0 && (
              <Link to="/upload" className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-2">
                <Plus className="w-3.5 h-3.5" /> Start First Scan
              </Link>
            )}
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#181d2a] text-slate-400 uppercase text-[10px] tracking-wider border-b border-[#212738]">
                  <tr>
                    <th className="py-3 px-6 font-bold">Project Name</th>
                    <th className="py-3 px-6 font-bold">Scan Type</th>
                    <th className="py-3 px-6 font-bold">Status</th>
                    <th className="py-3 px-6 font-bold">Total Findings</th>
                    <th className="py-3 px-6 font-bold">Critical / High</th>
                    <th className="py-3 px-6 font-bold">Completed At</th>
                    <th className="py-3 px-6 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1f2638]">
                  {filteredScans.map((s) => (
                    <tr key={s.id} className="hover:bg-[#161a27] transition">
                      <td className="py-3.5 px-6 font-bold text-white">
                        <Link to={`/findings?scan=${s.id}`} className="hover:text-blue-400 flex items-center gap-2">
                          <FolderGit2 className="w-4 h-4 text-slate-500" />
                          <span>{s.project_name}</span>
                        </Link>
                        <span className="text-[10px] text-slate-500 font-mono block mt-0.5 truncate max-w-xs">
                          {s.id}
                        </span>
                      </td>

                      <td className="py-3.5 px-6">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold ${
                          s.scan_type === 'verification'
                            ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                        }`}>
                          {s.scan_type || 'initial'}
                        </span>
                      </td>

                      <td className="py-3.5 px-6">
                        <span className="inline-flex items-center gap-1.5 text-green-400 font-semibold">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span className="capitalize">{s.status || 'completed'}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-6 font-bold text-slate-200">
                        {s.total_findings || 0}
                      </td>

                      <td className="py-3.5 px-6">
                        <span className="text-red-400 font-semibold">{s.critical_count || 0}</span>
                        <span className="text-slate-600 mx-1">/</span>
                        <span className="text-orange-400 font-semibold">{s.high_count || 0}</span>
                      </td>

                      <td className="py-3.5 px-6 text-slate-400">
                        {s.completed_at || s.created_at
                          ? new Date(s.completed_at || s.created_at).toLocaleString()
                          : 'Recent'}
                      </td>

                      <td className="py-3.5 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-3">
                          <Link
                            to={`/findings?scan=${s.id}`}
                            className="text-blue-400 hover:text-blue-300 font-semibold inline-flex items-center gap-1"
                          >
                            Findings <ArrowRight className="w-3 h-3" />
                          </Link>
                          <button
                            onClick={() => downloadHtmlReport(s.id)}
                            className="text-slate-400 hover:text-white"
                            title="Download Report"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
