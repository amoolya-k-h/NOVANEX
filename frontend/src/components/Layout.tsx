import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Shield, BarChart2, FolderGit2, AlertTriangle, Brain, Wrench, Clock, FileText,
  Search, HelpCircle, Bell, ChevronDown, CheckCircle2, ArrowRight, Settings,
  ExternalLink, Sparkles, Plus, CheckCircle, Lock
} from 'lucide-react'
import { useScanStore } from '../store/useScanStore'
import WorkflowModal from './WorkflowModal'
import ScanModal from './ScanModal'
import FindingDrawer from './FindingDrawer'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const loc = useLocation()
  const navigate = useNavigate()
  const {
    openWorkflowModal,
    openScanModal,
    activeDrawerFinding,
    closeDrawer,
    findings,
    scans,
  } = useScanStore()

  const [showRecentActivity, setShowRecentActivity] = useState(false)
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false)

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: BarChart2 },
    { path: '/upload', label: 'New Scan', icon: Plus, highlight: true },
    { path: '/repositories', label: 'Repositories', icon: FolderGit2 },
    { path: '/findings', label: 'Findings', icon: AlertTriangle, badge: findings.length > 0 ? String(findings.length) : undefined },
    { path: '/analyst', label: 'AI Analyst', icon: Brain, pill: 'AI' },
    { path: '/remediation', label: 'Remediation', icon: Wrench },
    { path: '/verification', label: 'Verification', icon: CheckCircle },
    { path: '/history', label: 'Scan History', icon: Clock, badge: scans.length > 0 ? String(scans.length) : undefined },
    { path: '/reports', label: 'Reports', icon: FileText },
  ]

  const getPageTitle = () => {
    const item = navItems.find((n) => n.path === loc.pathname)
    if (item) return item.label
    if (loc.pathname === '/settings') return 'Settings'
    if (loc.pathname === '/') return 'Landing'
    return 'Dashboard'
  }

  return (
    <div className="min-h-screen bg-[#0c0e14] flex text-slate-100">
      {/* LEFT SIDEBAR */}
      <aside className="w-64 bg-[#11141f] border-r border-[#1f2433] flex flex-col fixed h-full z-20 select-none">
        {/* Logo Brand */}
        <div className="p-5 pb-4 border-b border-[#1f2433]">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-white text-lg tracking-tight">
              Repo<span className="text-amber-400">Guard</span> <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono ml-1">AI</span>
            </span>
          </Link>

          {/* Quick Action Button */}
          <Link
            to="/upload"
            className="mt-4 w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md transition"
          >
            <Plus className="w-3.5 h-3.5" /> Start Security Scan
          </Link>
        </div>

        {/* Navigation Items */}
        <div className="px-4 pt-3">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 mb-1.5">
            Security Modules
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = loc.pathname === item.path || (item.path !== '/dashboard' && loc.pathname.startsWith(item.path))
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  active
                    ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-[#161a27]'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-blue-400' : 'text-slate-500'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-mono font-bold text-slate-300 bg-[#1e2436] px-1.5 py-0.5 rounded-md border border-[#2d364f]">
                    {item.badge}
                  </span>
                )}
                {item.pill && (
                  <span className="text-[9px] font-bold text-violet-300 bg-violet-500/20 px-1.5 py-0.5 rounded-md border border-violet-500/30 tracking-wider">
                    {item.pill}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Bottom Banner */}
        <div className="p-3 border-t border-[#1f2433]">
          <div className="bg-[#141824] border border-[#21283b] rounded-xl p-3 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-200">
              <Lock className="w-3.5 h-3.5 text-blue-400" />
              <span>Detect • Explain • Fix • Verify</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Real vulnerability scanning grounded with Gemini AI.
            </p>
            <button
              onClick={openWorkflowModal}
              className="text-[11px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 pt-1"
            >
              How it works <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 text-[10px] text-slate-500 text-center border-t border-[#1f2433]/70 flex items-center justify-between">
          <span>v1.0.0</span>
          <Link to="/settings" className="hover:text-slate-300 flex items-center gap-1">
            <Settings className="w-3 h-3" /> Settings
          </Link>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div className="flex-1 ml-64 min-h-screen flex flex-col bg-[#0c0e14]">
        {/* TOP HEADER */}
        <header className="bg-[#11141f]/90 backdrop-blur-sm border-b border-[#1f2433] px-8 py-3.5 flex items-center justify-between sticky top-0 z-30 select-none">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
            <Link to="/dashboard" className="hover:text-slate-200">RepoGuard</Link>
            <span className="text-slate-600">/</span>
            <span className="text-white font-bold">{getPageTitle()}</span>
          </div>

          {/* Right Header Elements */}
          <div className="flex items-center gap-3">
            {/* Help / Workflow Button */}
            <button
              onClick={openWorkflowModal}
              title="A complete security workflow"
              className="w-8 h-8 rounded-lg border border-[#212738] bg-[#141824] hover:bg-[#1a2030] text-slate-400 hover:text-slate-200 flex items-center justify-center transition text-xs font-bold"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {/* Quick Upload Action */}
            <Link
              to="/upload"
              className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Scan</span>
            </Link>

            {/* User Profile Avatar */}
            <Link
              to="/settings"
              title="Settings"
              className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold text-xs flex items-center justify-center hover:bg-blue-500/20 transition"
            >
              RG
            </Link>
          </div>
        </header>

        {/* Page Children */}
        <main className="flex-1 p-8 bg-[#0c0e14]">{children}</main>
      </div>

      {/* Global Modals & Drawers */}
      <WorkflowModal />
      <ScanModal />
      <FindingDrawer finding={activeDrawerFinding} onClose={closeDrawer} />
    </div>
  )
}
