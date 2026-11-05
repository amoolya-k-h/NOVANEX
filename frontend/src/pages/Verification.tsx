import { useState, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion } from 'framer-motion'
import {
  CheckCircle, XCircle, AlertTriangle, Upload, Shield, RefreshCw,
  ArrowRight, Lock, CheckCircle2, FileCode, ExternalLink, Download
} from 'lucide-react'
import { startVerification, getComparison, scanProgressSSE, listScans, downloadHtmlReport, getScan } from '../api/client'
import { useScanStore } from '../store/useScanStore'
import Layout from '../components/Layout'
import ScanProgress from '../components/ScanProgress'
import { SeverityBadge } from '../components/SeverityBadge'
import { Finding } from '../types'
import toast from 'react-hot-toast'

export default function Verification() {
  const { currentScan, setCurrentScan, scans, setScans } = useScanStore()
  const [selectedScanId, setSelectedScanId] = useState<string>('')
  const [file, setFile] = useState<File | null>(null)
  const [scanning, setScanning] = useState(false)
  const [progress, setProgress] = useState<any>(null)
  const [comparison, setComparison] = useState<any>(null)
  const [loadingScans, setLoadingScans] = useState(true)

  useEffect(() => {
    listScans()
      .then((res) => {
        const scanList = res.data || []
        setScans(scanList)
        if (scanList.length > 0) {
          const initId = currentScan?.id || scanList[0].id
          setSelectedScanId(initId)
          if (!currentScan) {
            setCurrentScan(scanList[0])
          }
        }
      })
      .finally(() => setLoadingScans(false))
  }, [])

  const handleScanChange = (id: string) => {
    setSelectedScanId(id)
    const match = scans.find((s) => s.id === id)
    if (match) setCurrentScan(match)
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => setFile(files[0]),
    accept: { 'application/zip': ['.zip'] },
    multiple: false,
  })

  const handleVerify = async () => {
    if (!file || !selectedScanId) {
      toast.error('Please select original scan and upload fixed project ZIP')
      return
    }
    setScanning(true)
    setProgress(null)
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await startVerification(selectedScanId, fd)
      const { verification_scan_id } = res.data
      toast.success('Verification scan running...')

      let compDone = false
      const finishComp = async () => {
        if (compDone) return
        compDone = true
        try {
          const comp = await getComparison(selectedScanId, verification_scan_id)
          setComparison(comp.data)
          toast.success('Verification comparison complete!')
        } catch {
          toast.error('Failed to load verification comparison')
        } finally {
          setScanning(false)
        }
      }

      const es = scanProgressSSE(verification_scan_id, async (data) => {
        setProgress(data)
        if (data.status === 'completed') {
          finishComp()
        } else if (data.status === 'failed') {
          toast.error('Verification scan failed')
          setScanning(false)
        }
      })

      // Polling fallback every 1.5s in case SSE is blocked
      const vPoll = setInterval(async () => {
        if (compDone) {
          clearInterval(vPoll)
          return
        }
        try {
          const sRes = await getScan(verification_scan_id)
          if (sRes.data.status === 'completed') {
            clearInterval(vPoll)
            try { es.close() } catch {}
            finishComp()
          } else if (sRes.data.status === 'failed') {
            clearInterval(vPoll)
            try { es.close() } catch {}
            toast.error('Verification scan failed')
            setScanning(false)
          }
        } catch {}
      }, 1500)
    } catch {
      setScanning(false)
    }
  }

  const GROUPS = [
    { key: 'resolved', label: 'Verified Resolved Findings', color: 'text-green-400', border: 'border-green-500/20', bg: 'bg-green-500/5' },
    { key: 'unresolved', label: 'Remaining Unresolved Findings', color: 'text-orange-400', border: 'border-orange-500/20', bg: 'bg-orange-500/5' },
    { key: 'new', label: 'Newly Discovered Findings', color: 'text-red-400', border: 'border-red-500/20', bg: 'bg-red-500/5' },
  ]

  const activeScan = scans.find((s) => s.id === selectedScanId) || currentScan

  return (
    <Layout>
      <div className="max-w-[1400px] mx-auto space-y-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-green-400 uppercase tracking-wider mb-1">
            <CheckCircle className="w-3.5 h-3.5" />
            Verification & Rescan Comparison
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Security Verification
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Upload fixed project code to re-run scanners, compare fingerprints against the baseline, and verify resolution.
          </p>
        </div>

        {/* Credential Rotation Notice */}
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-white">Credential Rotation Warning:</div>
            <p className="leading-relaxed text-slate-300">
              Removing a secret from source code removes the exposure from git, but <strong>does not invalidate the active secret</strong>.
              Always rotate or revoke exposed API keys and database passwords in the provider console to eliminate persistent unauthorized access.
            </p>
          </div>
        </div>

        {!comparison && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Step 1: Select Baseline Scan */}
            <div className="lg:col-span-5 space-y-4">
              <div className="card p-6 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  1. Select Baseline Scan
                </h3>
                <p className="text-xs text-slate-400">
                  Select the original scan containing the vulnerabilities you want to verify against:
                </p>

                {scans.length === 0 ? (
                  <div className="p-4 rounded-xl bg-[#0c0e14] border border-[#212738] text-xs text-slate-500 text-center">
                    No prior scans detected. Run an initial scan first.
                  </div>
                ) : (
                  <div className="space-y-3">
                    <select
                      value={selectedScanId}
                      onChange={(e) => handleScanChange(e.target.value)}
                      className="w-full bg-[#0c0e14] border border-[#26314d] text-xs font-semibold text-white rounded-xl px-3 py-2.5 outline-none focus:border-green-500"
                    >
                      {scans.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.project_name} — {s.total_findings} findings ({s.created_at ? new Date(s.created_at).toLocaleDateString() : ''})
                        </option>
                      ))}
                    </select>

                    {activeScan && (
                      <div className="p-4 rounded-xl bg-[#0c0e14] border border-[#212738] space-y-2 text-xs">
                        <div className="flex justify-between text-slate-400">
                          <span>Project:</span>
                          <span className="font-bold text-white">{activeScan.project_name}</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Total Findings:</span>
                          <span className="font-bold text-slate-200">{activeScan.total_findings}</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Critical / High:</span>
                          <span className="text-red-400 font-bold">{activeScan.critical_count} / {activeScan.high_count}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Step 2: Upload Fixed Project ZIP */}
            <div className="lg:col-span-7 space-y-4">
              <div className="card p-6 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  2. Upload Fixed Project Archive
                </h3>
                <p className="text-xs text-slate-400">
                  Upload the updated project ZIP with your remediation changes applied:
                </p>

                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
                    isDragActive
                      ? 'border-green-500 bg-green-500/10'
                      : file
                      ? 'border-green-500/40 bg-green-500/5'
                      : 'border-[#262e42] hover:border-green-500/50 bg-[#0c0e14]'
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                  {file ? (
                    <div>
                      <p className="text-green-400 font-bold text-sm">{file.name}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB • Ready for verification
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-slate-200 font-semibold text-sm">Drop fixed project ZIP here</p>
                      <p className="text-xs text-slate-500 mt-1">or click to browse from disk</p>
                    </div>
                  )}
                </div>

                {scanning ? (
                  <div className="card p-6 space-y-3">
                    <p className="text-xs font-bold text-slate-300">Executing verification rescan...</p>
                    {progress && <ScanProgress progress={progress} />}
                  </div>
                ) : (
                  <button
                    onClick={handleVerify}
                    disabled={!file || !selectedScanId}
                    className="btn-primary w-full py-3 text-sm font-bold flex items-center justify-center gap-2 shadow-lg bg-green-600 hover:bg-green-500"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Run Verification Rescan</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* COMPARISON RESULTS */}
        {comparison && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Stat Counters */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="card bg-slate-500/5 border-slate-500/20 p-5 text-center">
                <div className="text-3xl font-black text-white">{comparison.summary.total_original}</div>
                <div className="text-xs text-slate-400 mt-1 uppercase font-semibold">Total Original</div>
              </div>

              <div className="card bg-green-500/10 border-green-500/30 p-5 text-center">
                <div className="text-3xl font-black text-green-400">{comparison.summary.resolved_count}</div>
                <div className="text-xs text-green-400 mt-1 uppercase font-semibold">Verified Resolved</div>
              </div>

              <div className="card bg-orange-500/10 border-orange-500/30 p-5 text-center">
                <div className="text-3xl font-black text-orange-400">{comparison.summary.unresolved_count}</div>
                <div className="text-xs text-orange-400 mt-1 uppercase font-semibold">Remaining Issues</div>
              </div>

              <div className="card bg-red-500/10 border-red-500/30 p-5 text-center">
                <div className="text-3xl font-black text-red-400">{comparison.summary.new_count}</div>
                <div className="text-xs text-red-400 mt-1 uppercase font-semibold">Newly Introduced</div>
              </div>
            </div>

            {/* Resolution Rate Progress Bar */}
            <div className="card p-6 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold text-white">Vulnerability Resolution Rate</span>
                <span className="text-green-400 font-extrabold text-base">{comparison.summary.resolution_rate}%</span>
              </div>
              <div className="h-3 bg-[#0c0e14] rounded-full overflow-hidden border border-[#212738]">
                <motion.div
                  className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${comparison.summary.resolution_rate}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>
              <p className="text-xs text-slate-400">
                {comparison.summary.resolved_count} out of {comparison.summary.total_original} vulnerabilities were confirmed eliminated in this rescan.
              </p>
            </div>

            {/* Group Lists */}
            {GROUPS.map(({ key, label, color, border, bg }) => {
              const items: Finding[] = comparison[key] || []
              if (!items.length) return null
              return (
                <div key={key} className="space-y-3">
                  <h3 className={`text-sm font-bold ${color} flex items-center gap-2`}>
                    <span>{label}</span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#161a27] border border-[#26314d]">
                      {items.length}
                    </span>
                  </h3>
                  <div className="space-y-2">
                    {items.map((f: any) => (
                      <div key={f.id} className={`card ${bg} p-4 border ${border} flex items-center justify-between gap-4`}>
                        <div className="min-w-0 space-y-1">
                          <p className="text-xs font-bold text-white truncate">{f.title}</p>
                          {f.file_path && (
                            <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                              <FileCode className="w-3.5 h-3.5 text-slate-500" />
                              <span>{f.file_path}</span>
                              {f.line_number && <span>:{f.line_number}</span>}
                            </div>
                          )}
                        </div>
                        <SeverityBadge severity={f.severity} />
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}

            <div className="flex items-center gap-3 pt-4">
              <button onClick={() => setComparison(null)} className="btn-secondary text-xs py-2 px-4">
                Run Another Verification
              </button>
              {selectedScanId && (
                <button
                  onClick={() => downloadHtmlReport(selectedScanId)}
                  className="btn-primary text-xs py-2 px-4 flex items-center gap-2"
                >
                  <Download className="w-3.5 h-3.5" /> Download Full Verification Report
                </button>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </Layout>
  )
}
