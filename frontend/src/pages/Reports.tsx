import React, { useState, useEffect } from 'react'
import {
  Download, FileText, Code2, ShieldAlert, Check, ArrowRight, Shield,
  Share2, ExternalLink, RefreshCw
} from 'lucide-react'
import Layout from '../components/Layout'
import { useScanStore } from '../store/useScanStore'
import { downloadHtmlReport, downloadJsonReport, listScans } from '../api/client'
import toast from 'react-hot-toast'

export default function Reports() {
  const { currentScan, scans, setScans } = useScanStore()
  const [selectedScanId, setSelectedScanId] = useState<string>('')

  useEffect(() => {
    listScans().then((res) => {
      const scanList = res.data || []
      setScans(scanList)
      if (scanList.length > 0 && !selectedScanId) {
        setSelectedScanId(currentScan?.id || scanList[0].id)
      }
    })
  }, [])

  const scanId = selectedScanId || currentScan?.id || (scans.length > 0 ? scans[0].id : '')
  const activeScan = scans.find((s) => s.id === scanId)

  const handleDownloadHtml = () => {
    if (!scanId) {
      toast.error('No scan selected to generate report')
      return
    }
    downloadHtmlReport(scanId)
    toast.success('Opening HTML security report in new tab')
  }

  const handleDownloadJson = () => {
    if (!scanId) {
      toast.error('No scan selected to generate report')
      return
    }
    downloadJsonReport(scanId)
    toast.success('Downloading JSON evidence export')
  }

  return (
    <Layout>
      <div className="max-w-[1400px] mx-auto space-y-7">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 tracking-wider uppercase mb-1">
              <Shield className="w-3.5 h-3.5" />
              Security Deliverables & Compliance Export
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Security Reports
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Export verified vulnerability findings, AI analysis, remediation steps, and scanner evidence.
            </p>
          </div>

          {scans.length > 0 && (
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400 font-semibold">Select Scan:</label>
              <select
                value={selectedScanId}
                onChange={(e) => setSelectedScanId(e.target.value)}
                className="bg-[#141824] border border-[#212738] rounded-xl px-3 py-2 text-xs font-semibold text-white outline-none focus:border-blue-500"
              >
                {scans.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.project_name} ({s.total_findings} findings)
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Selected Project Summary Card */}
        {activeScan ? (
          <div className="card p-6 border-blue-500/20 bg-gradient-to-r from-[#131722] to-[#171d2e] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase text-blue-400 tracking-wider">
                Active Report Target
              </span>
              <h2 className="text-lg font-bold text-white mt-1">{activeScan.project_name}</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Scan ID: <span className="font-mono text-slate-300">{activeScan.id}</span> • Type: <span className="uppercase">{activeScan.scan_type || 'initial'}</span>
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <div className="text-center px-3 py-1.5 rounded-lg bg-[#0c0e14] border border-[#1f2638]">
                <div className="text-white text-base font-black">{activeScan.total_findings}</div>
                <div className="text-[10px] text-slate-500 uppercase">Findings</div>
              </div>
              <div className="text-center px-3 py-1.5 rounded-lg bg-[#0c0e14] border border-[#1f2638]">
                <div className="text-red-400 text-base font-black">{activeScan.critical_count}</div>
                <div className="text-[10px] text-slate-500 uppercase">Critical</div>
              </div>
              <div className="text-center px-3 py-1.5 rounded-lg bg-[#0c0e14] border border-[#1f2638]">
                <div className="text-orange-400 text-base font-black">{activeScan.high_count}</div>
                <div className="text-[10px] text-slate-500 uppercase">High</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="card p-6 text-center text-xs text-slate-400">
            No scans available yet. Run a security scan first to generate and download reports.
          </div>
        )}

        {/* 2 Big Export Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: HTML Report */}
          <div className="card p-7 space-y-6 card-hover flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20 shadow-inner">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Standalone HTML Security Report</h3>
                <p className="text-xs text-slate-400 mt-1">
                  A comprehensive, standalone document styled for engineering leads, security auditors, and stakeholders.
                </p>
              </div>

              <div className="space-y-2.5 pt-2 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <span>Severity breakdowns and exact file:line locations</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <span>Masked evidence with secrets redacted for compliance</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <span>AI remediation guidance and patched package versions</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <span>Interactive CSS theme ready for offline viewing & PDF export</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#212738]">
              <button
                onClick={handleDownloadHtml}
                disabled={!scanId}
                className="w-full btn-primary text-xs font-bold py-3 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" /> Download HTML Report
              </button>
            </div>
          </div>

          {/* Card 2: JSON Report */}
          <div className="card p-7 space-y-6 card-hover flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20 shadow-inner">
                <Code2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Machine-Readable JSON Evidence</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Structured JSON payload suitable for automated CI/CD gating, SIEM ingestion, or custom reporting pipelines.
                </p>
              </div>

              <div className="space-y-2.5 pt-2 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <span>Complete normalized finding objects with CWE / CVE IDs</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <span>Deterministic fingerprint hashes for scan comparison</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <span>Scanner execution status and timing metadata</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <span>Compatible with standard vulnerability aggregators</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#212738]">
              <button
                onClick={handleDownloadJson}
                disabled={!scanId}
                className="w-full btn-secondary text-xs font-bold py-3 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" /> Download JSON Evidence
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
