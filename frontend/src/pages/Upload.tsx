import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload as UploadIcon, X, Shield, CheckCircle } from 'lucide-react'
import { uploadScan, scanProgressSSE } from '../api/client'
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
  const [scanId, setScanId] = useState<string | null>(null)
  const [progress, setProgress] = useState<any>(null)

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) {
      setFile(accepted[0])
      if (!projectName) setProjectName(accepted[0].name.replace('.zip', ''))
    }
  }, [projectName])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'application/zip': ['.zip'] }, maxSize: 100 * 1024 * 1024, multiple: false
  })

  const handleSubmit = async () => {
    if (!file || !projectName) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('project_name', projectName)
      if (projectDesc) fd.append('project_description', projectDesc)
      const res = await uploadScan(fd)
      const scan = res.data
      setScanId(scan.id)
      setCurrentScan(scan)
      toast.success('Project uploaded! Scanning in progress...')
      scanProgressSSE(scan.id, (data) => {
        setProgress(data)
        setScanProgress(data)
        if (data.status === 'completed') {
          toast.success(`Scan complete! ${data.findings_count} findings detected.`)
          setTimeout(() => navigate(`/findings?scan=${scan.id}`), 1500)
        } else if (data.status === 'failed') {
          toast.error('Scan failed: ' + (data.error || 'Unknown error'))
          setUploading(false)
        }
      })
    } catch {
      setUploading(false)
    }
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Scan Your Project</h1>
          <p className="text-slate-400">Upload a ZIP file to start AI-powered security analysis</p>
        </div>
        <AnimatePresence mode="wait">
          {!scanId ? (
            <motion.div key="upload" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
              <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${isDragActive ? 'border-blue-500 bg-blue-500/10' : file ? 'border-green-500/50 bg-green-500/5' : 'border-[#2d3748] hover:border-[#4a5568] bg-[#1a1f2e]'}`}>
                <input {...getInputProps()} />
                {file ? (
                  <div className="flex items-center justify-center gap-3">
                    <CheckCircle className="w-8 h-8 text-green-400" />
                    <div className="text-left">
                      <p className="font-medium text-white">{file.name}</p>
                      <p className="text-sm text-slate-400">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                    </div>
                    <button className="ml-4 text-slate-500 hover:text-slate-300" onClick={(e) => { e.stopPropagation(); setFile(null) }}>
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <UploadIcon className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-300 font-medium mb-1">{isDragActive ? 'Drop it here!' : 'Drag & drop your ZIP file'}</p>
                    <p className="text-sm text-slate-500">or click to browse · Max 100MB</p>
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Project Name *</label>
                  <input type="text" value={projectName} onChange={e => setProjectName(e.target.value)} placeholder="my-awesome-project"
                    className="w-full bg-[#1a1f2e] border border-[#2d3748] rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Description (optional)</label>
                  <textarea value={projectDesc} onChange={e => setProjectDesc(e.target.value)} placeholder="Brief description..." rows={3}
                    className="w-full bg-[#1a1f2e] border border-[#2d3748] rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors resize-none" />
                </div>
              </div>
              <div className="flex items-start gap-3 bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <Shield className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-slate-300"><strong className="text-blue-400">Secure Processing:</strong> Isolated environment. Secrets redacted before AI. No code executed.</p>
              </div>
              <button onClick={handleSubmit} disabled={!file || !projectName || uploading} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
                <Shield className="w-5 h-5" />{uploading ? 'Uploading...' : 'Start Security Scan'}
              </button>
            </motion.div>
          ) : (
            <motion.div key="progress" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-8 space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-blue-400 animate-pulse" />
                </div>
                <div>
                  <h2 className="font-bold text-white">Scanning {projectName}</h2>
                  <p className="text-sm text-slate-400">ID: {scanId.slice(0, 8)}...</p>
                </div>
              </div>
              {progress && <ScanProgress progress={progress} />}
              {progress?.status === 'completed' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 text-green-400">
                  <CheckCircle className="w-5 h-5" /><span>Scan complete! Redirecting...</span>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  )
}

