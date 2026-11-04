import React from 'react'
import {
  Download, FileText, Code2, ShieldAlert, Check, ArrowRight, Shield,
  Share2, ExternalLink
} from 'lucide-react'
import Layout from '../components/Layout'
import { useScanStore } from '../store/useScanStore'
import { downloadHtmlReport } from '../api/client'
import toast from 'react-hot-toast'

export default function Reports() {
  const { currentScan, scans } = useScanStore()

  const scanId = currentScan?.id || (scans.length > 0 ? scans[0].id : 'latest-scan')

  const handleDownloadHtml = () => {
    downloadHtmlReport(scanId)
    toast.success('Opening HTML security report')
  }

  const handleDownloadJson = () => {
    window.open(`/api/reports/${scanId}/json`, '_blank')
    toast.success('Downloading JSON evidence export')
  }

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
              Reports
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Turn security evidence into clear, shareable reports.
            </p>
          </div>

          <button
            onClick={() => toast.success('Generated fresh snapshot')}
            className="btn-secondary text-xs font-semibold px-4 py-2"
          >
            Latest workspace snapshot
          </button>
        </div>

        {/* Banner Card */}
        <div className="card p-7 bg-[#fbfbfc] border-[#eaecf0] space-y-1">
          <h2 className="text-lg font-extrabold text-slate-900">Security you can show.</h2>
          <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
            Share the evidence, recommended actions, and verified outcomes. Every report includes scan coverage and methodology.
          </p>
        </div>

        {/* 2 Big Export Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: HTML Report */}
          <div className="card p-7 space-y-6 card-hover flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-[#fff7ed] text-[#ea580c] flex items-center justify-center border border-[#ffedd5]">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">HTML security report</h3>
                <p className="text-xs text-slate-500 mt-0.5">A clear, readable report for your team.</p>
              </div>

              <div className="space-y-2.5 pt-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Severity breakdown and finding locations</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Scanner versions and coverage limitations</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Print-ready and easy to share</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#eaecf0]">
              <button
                onClick={handleDownloadHtml}
                className="w-full btn-secondary text-xs font-bold py-2.5"
              >
                <Download className="w-4 h-4" /> Download HTML report
              </button>
            </div>
          </div>

          {/* Card 2: JSON Report */}
          <div className="card p-7 space-y-6 card-hover flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-700 flex items-center justify-center border border-[#eaecf0]">
                <Code2 className="w-5 h-5 text-[#ea580c]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">JSON evidence export</h3>
                <p className="text-xs text-slate-500 mt-0.5">Structured findings for your workflow.</p>
              </div>

              <div className="space-y-2.5 pt-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>All repositories, scans, and redacted findings</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Verification references and rule identifiers</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Transparent scoring methodology</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#eaecf0]">
              <button
                onClick={handleDownloadJson}
                className="w-full btn-secondary text-xs font-bold py-2.5"
              >
                <Download className="w-4 h-4" /> Download JSON export
              </button>
            </div>
          </div>
        </div>

        {/* Disclaimer Box */}
        <div className="card p-6 bg-slate-50/60 border border-[#eaecf0] flex items-start gap-3.5">
          <ShieldAlert className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <h4 className="font-bold text-slate-900 mb-1">Evidence, not a security guarantee</h4>
            <p className="text-slate-500">
              These reports describe actual scans of controlled fixture repositories. They do not describe your own project. Missing coverage and incomplete scans are disclosed, and no report claims a project is completely secure.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  )
}
