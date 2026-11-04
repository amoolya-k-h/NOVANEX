import React, { useState } from 'react'
import { Plus, CheckCircle2, ChevronDown, Clock, FolderGit2 } from 'lucide-react'
import Layout from '../components/Layout'
import { useScanStore } from '../store/useScanStore'

export default function ScanHistory() {
  const { openScanModal } = useScanStore()
  const [selectedRepo, setSelectedRepo] = useState('all')

  const scanRecords = [
    {
      id: 's-1',
      name: 'auth-service - Dependency Check',
      type: 'Verification',
      repo: 'auth-service',
      status: 'Completed',
      findings: 65,
      date: 'Nov 1, 10:48',
    },
    {
      id: 's-2',
      name: 'ecommerce-api - Rescan 7',
      type: 'Verification',
      repo: 'ecommerce-api',
      status: 'Completed',
      findings: 3,
      date: 'Nov 1, 10:48',
    },
    {
      id: 's-3',
      name: 'infrastructure - Baseline',
      type: 'Baseline',
      repo: 'infrastructure',
      status: 'Completed',
      findings: 11,
      date: 'Nov 1, 10:47',
    },
    {
      id: 's-4',
      name: 'dashboard-ui - Baseline',
      type: 'Baseline',
      repo: 'dashboard-ui',
      status: 'Completed',
      findings: 28,
      date: 'Nov 1, 10:47',
    },
    {
      id: 's-5',
      name: 'ecommerce-api - Rescan 6',
      type: 'Verification',
      repo: 'ecommerce-api',
      status: 'Completed',
      findings: 41,
      date: 'Nov 1, 10:47',
    },
    {
      id: 's-6',
      name: 'ecommerce-api - Rescan 5',
      type: 'Verification',
      repo: 'ecommerce-api',
      status: 'Completed',
      findings: 42,
      date: 'Nov 1, 10:47',
    },
    {
      id: 's-7',
      name: 'ecommerce-api - Rescan 4',
      type: 'Verification',
      repo: 'ecommerce-api',
      status: 'Completed',
      findings: 44,
      date: 'Nov 1, 10:47',
    },
    {
      id: 's-8',
      name: 'ecommerce-api - Rescan 3',
      type: 'Verification',
      repo: 'ecommerce-api',
      status: 'Completed',
      findings: 47,
      date: 'Nov 1, 10:47',
    },
    {
      id: 's-9',
      name: 'ecommerce-api - Rescan 2',
      type: 'Verification',
      repo: 'ecommerce-api',
      status: 'Completed',
      findings: 36,
      date: 'Nov 1, 10:47',
    },
    {
      id: 's-10',
      name: 'ecommerce-api - Rescan 1',
      type: 'Verification',
      repo: 'ecommerce-api',
      status: 'Completed',
      findings: 38,
      date: 'Nov 1, 10:47',
    },
    {
      id: 's-11',
      name: 'ecommerce-api - Baseline',
      type: 'Baseline',
      repo: 'ecommerce-api',
      status: 'Completed',
      findings: 39,
      date: 'Nov 1, 10:47',
    },
  ]

  const filtered = selectedRepo === 'all' ? scanRecords : scanRecords.filter((s) => s.repo === selectedRepo)

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
              Scan history
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              A transparent record of every scan and verification.
            </p>
          </div>

          <button onClick={openScanModal} className="btn-primary text-xs font-bold px-4 py-2">
            <Plus className="w-4 h-4" />
            <span>New scan</span>
          </button>
        </div>

        {/* Counter & Filter */}
        <div className="flex items-center justify-between text-xs select-none">
          <div className="font-bold text-slate-800">
            {filtered.length} scans recorded
          </div>
          <div className="relative">
            <select
              value={selectedRepo}
              onChange={(e) => setSelectedRepo(e.target.value)}
              className="bg-white border border-[#eaecf0] rounded-xl px-3 py-1.5 pr-8 text-slate-700 outline-none focus:border-[#ea580c] font-medium shadow-sm cursor-pointer appearance-none"
            >
              <option value="all">All repositories</option>
              <option value="auth-service">auth-service</option>
              <option value="ecommerce-api">ecommerce-api</option>
              <option value="dashboard-ui">dashboard-ui</option>
              <option value="infrastructure">infrastructure</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>

        {/* Scans Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-[#eaecf0]">
                <tr>
                  <th className="py-3 px-5">Scan</th>
                  <th className="py-3 px-5">Repository</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5">Findings</th>
                  <th className="py-3 px-5">Completed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaecf0]">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-5">
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <span>{s.name}</span>
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          {s.type}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-5 text-slate-600 font-medium">
                      {s.repo}
                    </td>

                    <td className="py-3.5 px-5">
                      <span className="badge-low text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Completed
                      </span>
                    </td>

                    <td className="py-3.5 px-5 font-bold text-slate-900">
                      {s.findings}
                    </td>

                    <td className="py-3.5 px-5 text-slate-500">
                      {s.date}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  )
}

