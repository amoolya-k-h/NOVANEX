import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, Plus, FolderGit2, ArrowRight, ExternalLink, ShieldCheck,
  CheckCircle, AlertTriangle
} from 'lucide-react'
import Layout from '../components/Layout'
import { useScanStore } from '../store/useScanStore'

export default function Repositories() {
  const navigate = useNavigate()
  const { openScanModal } = useScanStore()
  const [search, setSearch] = useState('')

  const repos = [
    {
      id: 'auth-service',
      name: 'auth-service',
      tag: 'Fixture repository',
      desc: 'Controlled authentication-service fixture for dependency and exposed-secret detection',
      lang: 'TypeScript',
      branch: 'develop',
      findings: 65,
      crit: 34,
      high: 17,
      med: 12,
      low: 2,
      lastScan: 'Nov 1 at 10:48',
    },
    {
      id: 'dashboard-ui',
      name: 'dashboard-ui',
      tag: 'Fixture repository',
      desc: 'Controlled frontend fixture with vulnerable-dependency and configuration examples.',
      lang: 'JavaScript',
      branch: 'main',
      findings: 28,
      crit: 0,
      high: 14,
      med: 14,
      low: 0,
      lastScan: 'Nov 1 at 10:47',
    },
    {
      id: 'ecommerce-api',
      name: 'ecommerce-api',
      tag: 'Fixture repository',
      desc: 'Controlled Node/JS commerce API fixture. Actual Gitleaks and Trivy evidence, including seven verification rescans.',
      lang: 'TypeScript',
      branch: 'main',
      findings: 3,
      crit: 0,
      high: 2,
      med: 0,
      low: 1,
      lastScan: 'Nov 1 at 10:48',
    },
    {
      id: 'infrastructure',
      name: 'infrastructure',
      tag: 'Fixture repository',
      desc: 'Controlled Terraform fixture with supported cloud configuration weaknesses.',
      lang: 'Other',
      branch: '2 branches',
      findings: 11,
      crit: 0,
      high: 6,
      med: 1,
      low: 4,
      lastScan: 'Nov 1 at 10:47',
    },
  ]

  const filtered = repos.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.desc.toLowerCase().includes(search.toLowerCase())
  )

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
              Repositories
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Every repository. One place to understand and improve your security.
            </p>
          </div>

          <button onClick={openScanModal} className="btn-primary text-xs font-bold px-4 py-2">
            <Plus className="w-4 h-4" />
            <span>New scan</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative w-full max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Find a repository..."
              className="w-full bg-white border border-[#eaecf0] focus:border-[#ea580c] rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none transition shadow-sm"
            />
          </div>
          <span className="text-xs text-slate-400 font-medium">4 repositories</span>
        </div>

        {/* Repository Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map((repo) => (
            <div
              key={repo.id}
              className="card p-6 card-hover flex flex-col justify-between space-y-5"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xs border border-purple-100">
                      <FolderGit2 className="w-4 h-4" />
                    </div>
                    <h3 className="font-extrabold text-slate-900 text-base">{repo.name}</h3>
                  </div>
                  <span className="badge-neutral text-[10px]">{repo.tag}</span>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed min-h-[36px]">
                  {repo.desc}
                </p>

                <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium mt-3">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    {repo.lang}
                  </span>
                  <span>•</span>
                  <span>{repo.branch}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-[#eaecf0] space-y-4">
                <div>
                  <div className="text-[11px] text-slate-400 font-medium mb-1.5">Open findings</div>
                  <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    {repo.findings}
                  </div>
                </div>

                {/* Severity Counters Breakdown */}
                <div className="grid grid-cols-4 gap-2 text-center text-xs py-2 bg-slate-50 rounded-xl border border-[#eaecf0]">
                  <div>
                    <div className="font-extrabold text-red-600">{repo.crit}</div>
                    <div className="text-[10px] text-slate-400">Critical</div>
                  </div>
                  <div>
                    <div className="font-extrabold text-orange-600">{repo.high}</div>
                    <div className="text-[10px] text-slate-400">High</div>
                  </div>
                  <div>
                    <div className="font-extrabold text-amber-600">{repo.med}</div>
                    <div className="text-[10px] text-slate-400">Medium</div>
                  </div>
                  <div>
                    <div className="font-extrabold text-slate-600">{repo.low}</div>
                    <div className="text-[10px] text-slate-400">Low</div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-[11px] text-slate-400">Last scanned {repo.lastScan}</span>
                  <button
                    onClick={() => navigate('/findings')}
                    className="text-xs font-bold text-slate-800 hover:text-[#ea580c] transition flex items-center gap-1"
                  >
                    View security findings <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Card 5: Scan a new repository */}
          <div
            onClick={openScanModal}
            className="border-2 border-dashed border-[#eaecf0] hover:border-[#ea580c] bg-white hover:bg-[#fff7ed]/30 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-150 min-h-[320px] space-y-3"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center border border-[#eaecf0]">
              <Plus className="w-5 h-5 text-[#ea580c]" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Scan a new repository</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                Upload a project ZIP and start understanding your security.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

