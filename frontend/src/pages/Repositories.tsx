import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Search, Plus, FolderGit2, ArrowRight, ExternalLink, ShieldCheck,
  CheckCircle, AlertTriangle, Shield, RefreshCw
} from 'lucide-react'
import Layout from '../components/Layout'
import { useScanStore } from '../store/useScanStore'
import { listScans } from '../api/client'

export default function Repositories() {
  const navigate = useNavigate()
  const { scans, setScans } = useScanStore()
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

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

  // Aggregate by project_name
  const repoMap: Record<string, any> = {}
  for (const s of scans) {
    const name = s.project_name || 'Unnamed Project'
    if (!repoMap[name]) {
      repoMap[name] = {
        name,
        latestScanId: s.id,
        totalScans: 1,
        findings: s.total_findings || 0,
        crit: s.critical_count || 0,
        high: s.high_count || 0,
        med: s.medium_count || 0,
        low: s.low_count || 0,
        lastScan: s.created_at ? new Date(s.created_at).toLocaleString() : 'Recent',
      }
    } else {
      repoMap[name].totalScans += 1
    }
  }

  const repoList = Object.values(repoMap)

  const filteredRepos = repoList.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Layout>
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">
              <FolderGit2 className="w-3.5 h-3.5" />
              Repository Inventory & Coverage
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Repositories
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Monitored software projects with security findings and verification statuses.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchScans}
              className="btn-secondary text-xs py-2 px-3 flex items-center gap-2"
              title="Refresh repositories"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <Link to="/upload" className="btn-primary text-xs py-2 px-4 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span>Scan New Project</span>
            </Link>
          </div>
        </div>

        {/* Search Bar */}
        <div className="card p-4">
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search repositories by project name..."
              className="w-full bg-[#181d2a] border border-[#26314d] rounded-xl pl-10 pr-3 py-2 text-xs text-white placeholder-slate-400 outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Repository Cards Grid */}
        {filteredRepos.length === 0 ? (
          <div className="card p-12 text-center space-y-4 border-dashed border-[#26314d]">
            <FolderGit2 className="w-12 h-12 text-slate-500 mx-auto" />
            <h3 className="text-base font-bold text-white">No Repositories Monitored Yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {scans.length === 0
                ? 'Upload a project ZIP to register your first repository and run vulnerability analysis.'
                : 'No repositories match your search query.'}
            </p>
            {scans.length === 0 && (
              <Link to="/upload" className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-2">
                <Plus className="w-3.5 h-3.5" /> Scan Your First Repository
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRepos.map((repo) => (
              <div
                key={repo.name}
                className="card p-6 card-hover flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                      <FolderGit2 className="w-5 h-5" />
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                        repo.crit > 0
                          ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                          : repo.high > 0
                          ? 'bg-orange-500/10 text-orange-400 border border-orange-500/30'
                          : 'bg-green-500/10 text-green-400 border border-green-500/30'
                      }`}
                    >
                      {repo.crit > 0 ? 'At Risk' : repo.high > 0 ? 'Needs Attention' : 'Healthy'}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white mt-3 truncate">{repo.name}</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {repo.totalScans} scan(s) performed • Last active {repo.lastScan}
                  </p>

                  {/* Findings breakdown */}
                  <div className="grid grid-cols-4 gap-2 pt-4 text-center text-xs">
                    <div className="p-2 rounded-lg bg-[#0c0e14] border border-[#1f2638]">
                      <div className="font-bold text-white">{repo.findings}</div>
                      <div className="text-[10px] text-slate-500">Total</div>
                    </div>
                    <div className="p-2 rounded-lg bg-[#0c0e14] border border-[#1f2638]">
                      <div className="font-bold text-red-400">{repo.crit}</div>
                      <div className="text-[10px] text-slate-500">Critical</div>
                    </div>
                    <div className="p-2 rounded-lg bg-[#0c0e14] border border-[#1f2638]">
                      <div className="font-bold text-orange-400">{repo.high}</div>
                      <div className="text-[10px] text-slate-500">High</div>
                    </div>
                    <div className="p-2 rounded-lg bg-[#0c0e14] border border-[#1f2638]">
                      <div className="font-bold text-amber-400">{repo.med}</div>
                      <div className="text-[10px] text-slate-500">Med</div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#1f2638] flex items-center justify-between">
                  <Link
                    to={`/findings?scan=${repo.latestScanId}`}
                    className="text-xs font-bold text-blue-400 hover:text-blue-300 inline-flex items-center gap-1"
                  >
                    View Findings <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <Link
                    to={`/verification`}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Verify Fixes
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
