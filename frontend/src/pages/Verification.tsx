import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, AlertCircle, Upload, Shield } from 'lucide-react'
import { startVerification, getComparison, scanProgressSSE } from '../api/client'
import { useScanStore } from '../store/useScanStore'
import Layout from '../components/Layout'
import ScanProgress from '../components/ScanProgress'
import { SeverityBadge } from '../components/SeverityBadge'
import { Finding } from '../types'
import toast from 'react-hot-toast'

export default function Verification() {
  const { currentScan } = useScanStore()
  const [file, setFile] = useState<File | null>(null)
  const [scanning, setScanning] = useState(false)
  const [progress, setProgress] = useState<any>(null)
  const [comparison, setComparison] = useState<any>(null)

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => setFile(files[0]),
    accept: { 'application/zip': ['.zip'] },
    multiple: false,
  })

  const handleVerify = async () => {
    if (!file || !currentScan) {
      toast.error('Please select original scan and upload fixed project ZIP')
      return
    }
    setScanning(true)
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await startVerification(currentScan.id, fd)
      const { verification_scan_id } = res.data
      toast.success('Verification scan started!')
      scanProgressSSE(verification_scan_id, async (data) => {
        setProgress(data)
        if (data.status === 'completed') {
          const comp = await getComparison(currentScan.id, verification_scan_id)
          setComparison(comp.data)
          setScanning(false)
        } else if (data.status === 'failed') {
          toast.error('Verification scan failed')
          setScanning(false)
        }
      })
    } catch {
      setScanning(false)
    }
  }

  const GROUPS = [
    { key: 'resolved', label: '✅ Resolved Findings', color: 'text-green-400', border: 'border-green-500/20' },
    { key: 'unresolved', label: '⚠️ Unresolved Findings', color: 'text-orange-400', border: 'border-orange-500/20' },
    { key: 'new', label: '🔴 New Findings', color: 'text-red-400', border: 'border-red-500/20' },
  ]

  return (
    <Layout>
      <div className="p-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-green-400" />Security Verification
          </h1>
          <p className="text-slate-400 mt-1">Upload your fixed project to verify remediation was successful</p>
        </div>

        {!comparison && (
          <div className="max-w-xl space-y-6">
            <div className="card p-4">
              <div className="text-sm text-slate-400">
                Original scan: <span className="text-white font-medium">{currentScan?.project_name || 'None selected'}</span>
                {currentScan && <span className="text-slate-600 ml-2">({currentScan.total_findings} findings)</span>}
              </div>
            </div>

            <div {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${isDragActive ? 'border-green-500 bg-green-500/10' : file ? 'border-green-500/50 bg-green-500/5' : 'border-[#2d3748] hover:border-[#4a5568] bg-[#1a1f2e]'}`}>
              <input {...getInputProps()} />
              <Upload className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              {file ? (
                <div>
                  <p className="text-green-400 font-medium">{file.name}</p>
                  <p className="text-xs text-slate-500 mt-1">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                </div>
              ) : (
                <div>
                  <p className="text-slate-300">Upload fixed project ZIP</p>
                  <p className="text-xs text-slate-600 mt-1">The project with your fixes applied</p>
                </div>
              )}
            </div>

            {scanning ? (
              <div className="card p-6">
                <p className="text-sm text-slate-400 mb-4">Running verification scan...</p>
                {progress && <ScanProgress progress={progress} />}
              </div>
            ) : (
              <button onClick={handleVerify} disabled={!file || !currentScan}
                className="btn-primary w-full flex items-center justify-center gap-2">
                <Shield className="w-4 h-4" />Run Verification Scan
              </button>
            )}
          </div>
        )}

        {comparison && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'Total Original', value: comparison.summary.total_original, color: 'text-slate-200', bg: 'bg-slate-500/10' },
                { label: '✅ Resolved', value: comparison.summary.resolved_count, color: 'text-green-400', bg: 'bg-green-500/10' },
                { label: '⚠️ Unresolved', value: comparison.summary.unresolved_count, color: 'text-orange-400', bg: 'bg-orange-500/10' },
                { label: '🔴 New Issues', value: comparison.summary.new_count, color: 'text-red-400', bg: 'bg-red-500/10' },
              ].map(s => (
                <div key={s.label} className={`card ${s.bg} p-5 text-center`}>
                  <div className={`text-3xl font-black ${s.color}`}>{s.value}</div>
                  <div className="text-xs text-slate-500 mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="card p-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400">Resolution Rate</span>
                <span className="text-green-400 font-bold">{comparison.summary.resolution_rate}%</span>
              </div>
              <div className="h-3 bg-[#0d1117] rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${comparison.summary.resolution_rate}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>
            </div>

            {GROUPS.map(({ key, label, color, border }) => {
              const items: Finding[] = comparison[key] || []
              if (!items.length) return null
              return (
                <div key={key}>
                  <h3 className={`text-sm font-semibold ${color} mb-3`}>{label} ({items.length})</h3>
                  <div className="space-y-2">
                    {items.map((f: any) => (
                      <div key={f.id} className={`card p-3 border ${border} flex items-center justify-between`}>
                        <div className="min-w-0">
                          <p className="text-sm text-slate-200 truncate">{f.title}</p>
                          {f.file_path && <p className="text-xs text-slate-500 truncate">📁 {f.file_path}</p>}
                        </div>
                        <SeverityBadge severity={f.severity} />
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}

            <button onClick={() => setComparison(null)} className="btn-secondary">
              Run Another Verification
            </button>
          </motion.div>
        )}
      </div>
    </Layout>
  )
}

