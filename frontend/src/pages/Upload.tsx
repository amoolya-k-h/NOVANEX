import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload as UploadIcon, X, Shield, CheckCircle, AlertTriangle, FileCode,
  Sparkles, ArrowRight, Lock, Server, FileText, Check
} from 'lucide-react'
import { uploadScan, scanProgressSSE, getScan } from '../api/client'
import { useScanStore } from '../store/useScanStore'
import Layout from '../components/Layout'
import ScanProgress from '../components/ScanProgress'
import toast from 'react-hot-toast'

export default function Upload() {
  const navigate = useNavigate()
  const { setCurrentScan, setScanProgress } = useScanStore()
  const [file, setFile] = useState<File | null>(null)
  const [projectName, setProjectName] = useState('')
  const [projectDesc, setProjectDesc] = useState('')
  const [uploading, setUploading] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [scanId, setScanId] = useState<string | null>(null)
  const [progress, setProgress] = useState<any>(null)

  const onDrop = useCallback((accepted: File[], rejected: any[]) => {
    setValidationError(null)
    if (rejected && rejected.length > 0) {
      const err = rejected[0].errors[0]
      if (err.code === 'file-too-large') {
        setValidationError('File exceeds the 100MB limit. Please upload a project ZIP under 100MB.')
      } else if (err.code === 'file-invalid-type') {
        setValidationError('Invalid file format. RepoGuard AI currently supports standard ZIP (.zip) archives.')
      } else {
        setValidationError(err.message || 'File validation failed.')
      }
      return
    }

    if (accepted[0]) {
      const f = accepted[0]
      if (!f.name.toLowerCase().endsWith('.zip')) {
        setValidationError('Selected file is not a valid ZIP archive.')
        return
      }
      setFile(f)
      if (!projectName) {
        setProjectName(f.name.replace(/\.zip$/i, ''))
      }
    }
  }, [projectName])

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { 'application/zip': ['.zip'] },
    maxSize: 100 * 1024 * 1024,
    multiple: false,
    noClick: !!file,
  })

  const handleSubmit = async () => {
    if (!file) {
      setValidationError('Please select or drag-and-drop a ZIP project archive.')
      return
    }
    if (!projectName.trim()) {
      setValidationError('Please specify a project name.')
      return
    }

    setValidationError(null)
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('project_name', projectName.trim())
      if (projectDesc.trim()) fd.append('project_description', projectDesc.trim())

      const res = await uploadScan(fd)
      const scan = res.data
      setScanId(scan.id)
      setCurrentScan(scan)
      toast.success('Project uploaded successfully. Security scanners running...')

      let completedHandled = false
      const finishScan = (findingsCount: number) => {
        if (completedHandled) return
        completedHandled = true
        setProgress((prev: any) => ({ ...prev, status: 'completed', progress: 100, current_step: 'Scan complete!' }))
        toast.success(`Scan complete! ${findingsCount} findings detected.`)
        setTimeout(() => navigate(`/findings?scan=${scan.id}`), 1000)
      }

      const es = scanProgressSSE(scan.id, (data) => {
        setProgress(data)
        setScanProgress(data)
        if (data.status === 'completed') {
          finishScan(data.findings_count || 0)
        } else if (data.status === 'failed') {
          toast.error('Scan failed: ' + (data.error || 'Unknown error'))
          setUploading(false)
        }
      })

      // Polling fallback every 1.5s in case SSE is blocked or buffered
      const pollInterval = setInterval(async () => {
        if (completedHandled) {
          clearInterval(pollInterval)
          return
        }
        try {
          const sRes = await getScan(scan.id)
          if (sRes.data.status === 'completed') {
            clearInterval(pollInterval)
            try { es.close() } catch {}
            finishScan(sRes.data.total_findings || 0)
          } else if (sRes.data.status === 'failed') {
            clearInterval(pollInterval)
            try { es.close() } catch {}
            toast.error('Scan failed: ' + (sRes.data.error_message || 'Unknown error'))
            setUploading(false)
          }
        } catch {
          // ignore transient poll error
        }
      }, 1500)
    } catch (err: any) {
      setUploading(false)
      const msg = err.response?.data?.detail || err.message || 'Upload failed.'
      setValidationError(msg)
    }
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">
            <Shield className="w-3.5 h-3.5" />
            Project Ingestion & Scan Initiation
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            New Security Scan
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Upload your software project repository as a ZIP archive for deep multi-engine vulnerability analysis.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {!scanId ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              {/* Validation Error Alert */}
              {validationError && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Upload Validation Error:</span> {validationError}
                  </div>
                </div>
              )}

              {/* Drag & Drop Upload Card */}
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer relative ${
                  isDragActive
                    ? 'border-blue-500 bg-blue-500/10'
                    : file
                    ? 'border-green-500/40 bg-green-500/5'
                    : 'border-[#262e42] hover:border-blue-500/50 bg-[#121622]'
                }`}
              >
                <input {...getInputProps()} />

                {file ? (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-[#161c2c] border border-[#26314d]">
                    <div className="flex items-center gap-3 text-left">
                      <div className="w-10 h-10 rounded-xl bg-green-500/10 text-green-400 flex items-center justify-center flex-shrink-0 border border-green-500/20">
                        <CheckCircle className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm">{file.name}</p>
                        <p className="text-xs text-slate-400">
                          {(file.size / (1024 * 1024)).toFixed(2)} MB • Ready for scanning
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          open()
                        }}
                        className="btn-secondary text-xs py-1.5 px-3"
                      >
                        Change File
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setFile(null)
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 py-4">
                    <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto shadow-inner">
                      <UploadIcon className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="text-base font-bold text-white">
                        {isDragActive ? 'Drop your ZIP file here' : 'Drag & drop project ZIP archive here'}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        or click anywhere to browse files on your computer
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1b2234] border border-[#2b3652] text-xs text-slate-300">
                      <span>Max file size: 100MB</span>
                      <span>•</span>
                      <span>Format: .ZIP</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Form Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="e.g. backend-api or demo-service"
                    className="w-full bg-[#131722] border border-[#212738] rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Description (Optional)
                  </label>
                  <input
                    type="text"
                    value={projectDesc}
                    onChange={(e) => setProjectDesc(e.target.value)}
                    placeholder="e.g. Python FastAPI microservice"
                    className="w-full bg-[#131722] border border-[#212738] rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
              </div>

              {/* Security Sandbox Guarantee Card */}
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-slate-300 text-xs flex items-start gap-3">
                <Lock className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-white">Safe Execution & Data Protection Guarantee:</div>
                  <p className="leading-relaxed text-slate-400">
                    Uploaded archives are extracted inside ephemeral temporary directories. Code is <strong>never executed</strong>.
                    Secrets are automatically masked and redacted prior to any AI processing.
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={handleSubmit}
                disabled={!file || !projectName.trim() || uploading}
                className="btn-primary w-full py-3 text-sm font-bold flex items-center justify-center gap-2 shadow-lg"
              >
                <Shield className="w-4 h-4" />
                <span>{uploading ? 'Uploading & Starting Scan...' : 'Start Security Scan'}</span>
              </button>

              {/* SUPPORTED FORMATS CARD */}
              <div className="card p-6 space-y-4">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Supported Project Formats & Detection Engines
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                  <div className="p-3 rounded-xl bg-[#0c0e14] border border-[#1f2638] space-y-1.5">
                    <div className="font-bold text-blue-400 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" /> Exposed Secrets
                    </div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      AWS keys, GitHub PATs, Stripe tokens, DB passwords, Slack webhooks, generic credentials.
                    </p>
                    <div className="text-[10px] text-slate-500 font-mono">Engine: Gitleaks</div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#0c0e14] border border-[#1f2638] space-y-1.5">
                    <div className="font-bold text-purple-400 flex items-center gap-1.5">
                      <FileCode className="w-3.5 h-3.5" /> Vulnerable Deps
                    </div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      Known CVEs in PyPI & npm manifests (<code className="text-slate-300">requirements.txt</code>, <code className="text-slate-300">package.json</code>).
                    </p>
                    <div className="text-[10px] text-slate-500 font-mono">Engine: OSV-Scanner</div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#0c0e14] border border-[#1f2638] space-y-1.5">
                    <div className="font-bold text-amber-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> Insecure Code (SAST)
                    </div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      SQL injection patterns, command injection, path traversal, weak crypto hashes.
                    </p>
                    <div className="text-[10px] text-slate-500 font-mono">Engine: Semgrep</div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#0c0e14] border border-[#1f2638] space-y-1.5">
                    <div className="font-bold text-green-400 flex items-center gap-1.5">
                      <Server className="w-3.5 h-3.5" /> Misconfigurations
                    </div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      Container root user, EOL base images, exposed DB ports, debug mode, wildcard CORS.
                    </p>
                    <div className="text-[10px] text-slate-500 font-mono">Engine: Trivy</div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            /* LIVE SCAN PROGRESS VIEW */
            <motion.div
              key="progress"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-8 space-y-6"
            >
              <div className="flex items-center justify-between pb-4 border-b border-[#212738]">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-blue-400 animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Scanning {projectName}</h2>
                    <p className="text-xs text-slate-400 font-mono">Scan ID: {scanId}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-blue-400 bg-blue-500/10 border border-blue-500/30 px-2.5 py-1 rounded-full">
                    {progress?.status ? progress.status.toUpperCase() : 'INITIALIZING'}
                  </span>
                </div>
              </div>

              {progress && <ScanProgress progress={progress} />}

              {progress?.status === 'completed' && (
                <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 flex items-center justify-between text-green-400 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 flex-shrink-0" />
                    <span>Analysis complete! Redirecting to Findings Explorer...</span>
                  </div>
                  <button
                    onClick={() => navigate(`/findings?scan=${scanId}`)}
                    className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
                  >
                    View Findings Now <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  )
}
