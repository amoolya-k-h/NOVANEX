import React, { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import {
  X, UploadCloud, AlertCircle, Shield, Check, Sparkles, FileText, ArrowRight,
  ExternalLink, Loader2
} from 'lucide-react'
import { useScanStore } from '../store/useScanStore'
import { uploadScan, scanProgressSSE, getFindings } from '../api/client'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

export default function ScanModal() {
  const { isScanModalOpen, closeScanModal, setCurrentScan, setFindings } = useScanStore()
  const navigate = useNavigate()

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [uploading, setUploading] = useState(false)
  const [progressMsg, setProgressMsg] = useState('')
  const [progressPct, setProgressPct] = useState(0)

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return
    const file = acceptedFiles[0]
    if (!file.name.endsWith('.zip')) {
      toast.error('Please upload a .zip archive')
      return
    }

    setUploading(true)
    setProgressMsg('Uploading and preparing archive...')
    setProgressPct(15)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('project_name', file.name.replace('.zip', ''))

    try {
      const res = await uploadScan(formData)
      const scanId = res.data.scan_id
      setCurrentScan(res.data)
      setProgressPct(35)
      setProgressMsg('Extracting files and initializing security scanners...')

      // Connect SSE
      scanProgressSSE(scanId, (data) => {
        if (data.progress !== undefined) setProgressPct(Math.max(35, data.progress))
        if (data.message) setProgressMsg(data.message)

        if (data.status === 'completed') {
          setProgressPct(100)
          setProgressMsg('Scan complete! Correlating findings...')
          getFindings(scanId).then((fRes) => {
            setFindings(fRes.data.findings || [])
            setUploading(false)
            setStep(2)
            toast.success('Scan completed successfully!')
          })
        } else if (data.status === 'failed') {
          setUploading(false)
          toast.error(data.message || 'Scan failed')
        }
      })
    } catch (err: any) {
      setUploading(false)
      toast.error(err.response?.data?.detail || 'Failed to upload project')
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/zip': ['.zip'] },
    multiple: false,
    disabled: uploading,
  })

  if (!isScanModalOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-2xl bg-white rounded-3xl border border-[#eaecf0] shadow-2xl p-6 sm:p-7 relative max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={closeScanModal}
          className="absolute right-5 top-5 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start justify-between pr-8">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Scan, review & apply fixes</h2>
            <h3 className="text-sm font-semibold text-slate-800 mt-1">Your code. Your approval.</h3>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              Review supported edits, approve exactly what changes, and download a separate ZIP. Your original is never overwritten.
            </p>
          </div>
          <button className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-xl border border-[#eaecf0] hover:bg-slate-50 transition hidden sm:flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            Browser-local editing
          </button>
        </div>

        {/* Stepper */}
        <div className="mt-6 flex items-center gap-6 border-b border-[#eaecf0] pb-4 text-xs font-medium text-slate-400 select-none">
          <div className={`flex items-center gap-2 ${step >= 1 ? 'text-[#ea580c] font-semibold' : ''}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step >= 1 ? 'bg-[#ea580c] text-white' : 'bg-slate-100 text-slate-500'}`}>
              1
            </span>
            <span>Upload</span>
          </div>
          <div className="w-6 h-px bg-slate-200" />
          <div className={`flex items-center gap-2 ${step >= 2 ? 'text-[#ea580c] font-semibold' : ''}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step >= 2 ? 'bg-[#ea580c] text-white' : 'bg-slate-100 text-slate-500'}`}>
              2
            </span>
            <span>Review & approve</span>
          </div>
          <div className="w-6 h-px bg-slate-200" />
          <div className={`flex items-center gap-2 ${step >= 3 ? 'text-[#ea580c] font-semibold' : ''}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step >= 3 ? 'bg-[#ea580c] text-white' : 'bg-slate-100 text-slate-500'}`}>
              3
            </span>
            <span>Download & verify</span>
          </div>
        </div>

        {/* Body Content */}
        {step === 1 && (
          <div className="mt-6 space-y-5">
            {/* Dropzone Area */}
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-150 ${
                isDragActive
                  ? 'border-[#ea580c] bg-[#fff7ed]'
                  : 'border-[#d0d5dd] hover:border-[#ea580c] hover:bg-[#fafafa]'
              }`}
            >
              <input {...getInputProps()} />
              <div className="w-12 h-12 rounded-2xl bg-[#fff7ed] text-[#ea580c] flex items-center justify-center mx-auto mb-3 border border-[#ffedd5]">
                {uploading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-[#ea580c]" />
                ) : (
                  <UploadCloud className="w-6 h-6" />
                )}
              </div>

              {uploading ? (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-slate-800">{progressMsg}</p>
                  <div className="w-64 h-2 bg-slate-100 rounded-full mx-auto overflow-hidden">
                    <div
                      className="h-full bg-[#ea580c] transition-all duration-300 rounded-full"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500">{progressPct}% completed</p>
                </div>
              ) : (
                <>
                  <p className="text-sm font-semibold text-slate-800">
                    Drop your repository ZIP here
                  </p>
                  <p className="text-xs text-[#ea580c] font-semibold mt-0.5 hover:underline">
                    or browse files
                  </p>
                  <p className="text-[11px] text-slate-400 mt-2">
                    Up to 20 MB • 2,000 entries • No application code is executed
                  </p>
                </>
              )}
            </div>

            {/* Scanner Info Banner */}
            <div className="bg-[#fffbeb] border border-[#fef3c7] rounded-xl p-3.5 flex items-start gap-3 text-xs text-[#92400e]">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#b45309]" />
              <div className="leading-relaxed">
                <strong>Live security scan engine ready.</strong> Local review, approved edits, and ZIP downloads work seamlessly.
                Baseline vulnerability and secret verification are guaranteed.
              </div>
            </div>

            {/* Bottom 2 Feature Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-xl border border-[#eaecf0] bg-slate-50/50">
                <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-[#ea580c]" />
                  Supported, reviewable edits
                </h5>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Non-root users for official Docker images, and replacing hardcoded secrets with safe environment variables.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-[#eaecf0] bg-slate-50/50">
                <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  No silent changes
                </h5>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Only explicitly approved proposals are applied to a new archive. Code and credentials are never sent unredacted.
                </p>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="mt-6 space-y-5 text-center py-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <Check className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Scan Complete & Ready for Review!</h3>
              <p className="text-xs text-slate-500 mt-1">
                Findings have been correlated across Gitleaks, Trivy, and OSV-Scanner.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => {
                  closeScanModal()
                  navigate('/findings')
                }}
                className="btn-primary"
              >
                View Findings & Fixes <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

