import React, { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import {
  Wrench, CheckCircle, AlertTriangle, ArrowRight, ShieldCheck,
  FileCheck2, Plus, Sparkles, ChevronDown, Check, FileCode, ExternalLink, RefreshCw
} from 'lucide-react'
import Layout from '../components/Layout'
import { useScanStore } from '../store/useScanStore'
import { getFindings, listScans } from '../api/client'
import { Finding } from '../types'
import { SeverityBadge } from '../components/SeverityBadge'
import CodeRemediationStudio from '../components/CodeRemediationStudio'

export default function Remediation() {
  const [searchParams, setSearchParams] = useSearchParams()
  const findingIdFromUrl = searchParams.get('finding')

  const { findings, setFindings, scans, setScans } = useScanStore()
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null)
  const [loading, setLoading] = useState(false)
  const [subTab, setSubTab] = useState<'needs_review' | 'remediated' | 'verified'>('needs_review')

  useEffect(() => {
    if (findings.length === 0) {
      setLoading(true)
      listScans()
        .then((sRes) => {
          const scanList = sRes.data || []
          setScans(scanList)
          if (scanList.length > 0) {
            return getFindings(scanList[0].id).then((fRes) => {
              const fList = fRes.data.findings || []
              setFindings(fList)
              if (fList.length > 0) {
                const match = findingIdFromUrl ? fList.find((f: any) => f.id === findingIdFromUrl) : fList[0]
                setSelectedFinding(match || fList[0])
              }
            })
          }
        })
        .finally(() => setLoading(false))
    } else {
      const match = findingIdFromUrl
        ? findings.find((f) => f.id === findingIdFromUrl)
        : findings[0]
      setSelectedFinding(match || findings[0])
    }
  }, [findingIdFromUrl, findings.length])

  const needsReviewItems = findings.filter(
    (f) => f.status !== 'remediated' && (f.verification_status || '') !== 'resolved'
  )
  const remediatedItems = findings.filter(
    (f) => f.status === 'remediated' || (f.verification_status || '') === 'pending_verification'
  )
  const verifiedItems = findings.filter(
    (f) => (f.verification_status || '').toLowerCase() === 'resolved' || f.status === 'resolved'
  )

  const activeList =
    subTab === 'needs_review'
      ? needsReviewItems
      : subTab === 'remediated'
      ? remediatedItems
      : verifiedItems

  return (
    <Layout>
      <div className="max-w-[1440px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">
              <Wrench className="w-3.5 h-3.5" />
              AI Code Remediation & Patch Approval
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Remediation Studio
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Review AI-generated diffs, download unified patches, and approve safe code modifications prior to verification.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/verification" className="btn-secondary text-xs py-2 px-3 flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-green-400" />
              <span>Verify Applied Fixes</span>
            </Link>
          </div>
        </div>

        {findings.length === 0 && !loading ? (
          <div className="card p-12 text-center space-y-4 border-dashed border-[#26314d]">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto">
              <Wrench className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">No Vulnerabilities Available to Remediate</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Run a security scan to detect issues and unlock automated AI code patch suggestions.
            </p>
            <Link to="/upload" className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-2">
              <Plus className="w-3.5 h-3.5" /> Start Scan
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN: Findings Queue */}
            <div className="lg:col-span-4 space-y-3">
              {/* Filter Tabs */}
              <div className="card p-1.5 flex items-center gap-1 bg-[#151926]">
                <button
                  onClick={() => setSubTab('needs_review')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition text-center ${
                    subTab === 'needs_review'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Open ({needsReviewItems.length})
                </button>
                <button
                  onClick={() => setSubTab('remediated')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition text-center ${
                    subTab === 'remediated'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Patched ({remediatedItems.length})
                </button>
                <button
                  onClick={() => setSubTab('verified')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition text-center ${
                    subTab === 'verified'
                      ? 'bg-green-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Verified ({verifiedItems.length})
                </button>
              </div>

              {/* Items List */}
              <div className="space-y-2 max-h-[750px] overflow-y-auto pr-1">
                {activeList.length === 0 ? (
                  <div className="card p-8 text-center text-xs text-slate-500">
                    No findings in this category.
                  </div>
                ) : (
                  activeList.map((f) => {
                    const isSelected = selectedFinding?.id === f.id
                    return (
                      <div
                        key={f.id}
                        onClick={() => {
                          setSelectedFinding(f)
                          setSearchParams({ finding: f.id })
                        }}
                        className={`card p-3.5 cursor-pointer transition ${
                          isSelected
                            ? 'border-blue-500 bg-[#161d2d] shadow-md'
                            : 'hover:border-[#2b354e] hover:bg-[#151926]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <SeverityBadge severity={f.severity} />
                          <span className="text-[10px] font-mono text-slate-400 uppercase bg-[#0c0e14] px-1.5 py-0.5 rounded border border-[#1f2638]">
                            {f.category}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-white leading-snug line-clamp-2">
                          {f.title}
                        </h4>
                        {f.file_path && (
                          <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 mt-2 truncate">
                            <FileCode className="w-3 h-3 text-slate-500 flex-shrink-0" />
                            <span className="truncate">{f.file_path}</span>
                            {f.line_number && <span className="text-slate-500">:{f.line_number}</span>}
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: Code Remediation Studio */}
            <div className="lg:col-span-8">
              {selectedFinding ? (
                <CodeRemediationStudio
                  finding={selectedFinding}
                  standalone={true}
                  onResolved={(fId) => {
                    const item = findings.find((f) => f.id === fId)
                    if (item) {
                      item.status = 'remediated'
                      item.verification_status = 'pending_verification'
                    }
                  }}
                />
              ) : (
                <div className="card p-12 text-center text-slate-400 text-xs">
                  Select a vulnerability from the queue to inspect the code diff and remediation patch.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
