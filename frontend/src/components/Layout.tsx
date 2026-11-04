import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Shield, BarChart2, FolderGit2, AlertTriangle, Brain, Wrench, Clock, FileText,
  Search, HelpCircle, Bell, ChevronDown, CheckCircle2, ArrowRight, Settings,
  ExternalLink, Sparkles
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
  } = useScanStore()

  const [showRecentActivity, setShowRecentActivity] = useState(false)
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false)

  const navItems = [
    { path: '/', label: 'Overview', icon: BarChart2 },
    { path: '/repositories', label: 'Repositories', icon: FolderGit2, badge: '4' },
    { path: '/findings', label: 'Findings', icon: AlertTriangle, badge: findings.length > 0 ? String(findings.length) : '107' },
    { path: '/analyst', label: 'AI Analyst', icon: Brain, pill: 'BETA' },
    { path: '/remediation', label: 'Remediation', icon: Wrench },
    { path: '/history', label: 'Scan history', icon: Clock },
    { path: '/reports', label: 'Reports', icon: FileText },
  ]

  const getPageTitle = () => {
    const item = navItems.find((n) => n.path === loc.pathname)
    if (item) return item.label
    if (loc.pathname === '/settings') return 'Settings'
    return 'Overview'
  }

  return (
    <div className="min-h-screen bg-[#fbfbfc] flex text-slate-800">
      {/* LEFT SIDEBAR */}
      <aside className="w-64 bg-white border-r border-[#eaecf0] flex flex-col fixed h-full z-20 select-none">
        {/* Logo Brand */}
        <div className="p-5 pb-4">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#ea580c] flex items-center justify-center text-white shadow-sm">
              <Shield className="w-5 h-5 fill-white" />
            </div>
            <span className="font-extrabold text-slate-900 text-lg tracking-tight">
              RepoGuard <span className="font-semibold text-slate-700">AI</span>
            </span>
          </Link>

          {/* Workspace Selector */}
          <div className="relative mt-4">
            <button
              onClick={() => setShowWorkspaceMenu(!showWorkspaceMenu)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 border border-[#eaecf0] hover:bg-slate-100 transition text-xs font-semibold text-slate-700"
            >
              <div className="flex items-center gap-2 truncate">
                <span className="text-slate-400 font-mono text-[11px]">&lt;/&gt;</span>
                <span className="truncate">Personal workspace</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showWorkspaceMenu && (
              <div className="absolute left-0 top-11 w-full bg-white border border-[#eaecf0] rounded-xl shadow-lg p-1.5 z-30 text-xs">
                <div className="px-2.5 py-1.5 font-bold text-slate-400 text-[10px] uppercase">Workspaces</div>
                <button
                  onClick={() => setShowWorkspaceMenu(false)}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg bg-[#fff7ed] text-[#ea580c] font-semibold flex items-center justify-between"
                >
                  <span>Personal workspace</span>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </button>
                <div className="border-t border-[#eaecf0] my-1" />
                <button
                  onClick={() => {
                    setShowWorkspaceMenu(false)
                    navigate('/settings')
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-50 text-slate-600 flex items-center gap-2"
                >
                  <Settings className="w-3.5 h-3.5" /> Workspace settings
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Items */}
        <div className="px-4 pt-2">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1.5">
            Workspace
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = loc.pathname === item.path || (item.path !== '/' && loc.pathname.startsWith(item.path))
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  active
                    ? 'bg-[#fff7ed] text-[#ea580c] border border-[#ffedd5]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-[#ea580c]' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[11px] font-mono font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">
                    {item.badge}
                  </span>
                )}
                {item.pill && (
                  <span className="text-[9px] font-bold text-[#ea580c] bg-[#ffedd5] px-1.5 py-0.5 rounded-md tracking-wider">
                    {item.pill}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Bottom Banner */}
        <div className="p-3 border-t border-[#eaecf0]">
          <div className="bg-[#fbfbfc] border border-[#eaecf0] rounded-2xl p-3.5 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <Shield className="w-3.5 h-3.5 text-[#ea580c]" />
              <span>Ship with confidence.</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              A little more security. A lot more peace of mind.
            </p>
            <button
              onClick={openWorkflowModal}
              className="text-[11px] font-bold text-[#ea580c] hover:underline flex items-center gap-1 pt-1"
            >
              Explore the workflow <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 text-[10px] text-slate-400 text-center border-t border-[#eaecf0]/60">
          Detect. Explain. Fix. Verify.
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div className="flex-1 ml-64 min-h-screen flex flex-col">
        {/* TOP HEADER */}
        <header className="bg-white border-b border-[#eaecf0] px-8 py-3.5 flex items-center justify-between sticky top-0 z-30 select-none">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <span>Workspace</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-900 font-bold">{getPageTitle()}</span>
          </div>

          {/* Right Header Elements */}
          <div className="flex items-center gap-3">
            {/* Search Bar */}
            <div className="relative w-64 hidden sm:block">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search anything... ⌘K"
                className="w-full bg-[#fbfbfc] border border-[#eaecf0] focus:border-[#ea580c] rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 outline-none transition"
              />
            </div>

            {/* Help / Workflow Button */}
            <button
              onClick={openWorkflowModal}
              title="A complete security workflow"
              className="w-8 h-8 rounded-full border border-[#eaecf0] hover:bg-slate-50 text-slate-500 hover:text-slate-800 flex items-center justify-center transition text-xs font-bold"
            >
              ?
            </button>

            {/* Recent Activity Bell */}
            <div className="relative">
              <button
                onClick={() => setShowRecentActivity(!showRecentActivity)}
                className="w-8 h-8 rounded-full border border-[#eaecf0] hover:bg-slate-50 text-slate-500 hover:text-slate-800 flex items-center justify-center transition relative"
              >
                <Bell className="w-4 h-4" />
                <span className="w-2 h-2 rounded-full bg-[#ea580c] absolute top-1 right-1" />
              </button>

              {showRecentActivity && (
                <div className="absolute right-0 top-10 w-72 bg-white border border-[#eaecf0] rounded-2xl shadow-xl p-4 z-40 text-xs animate-fadeIn">
                  <div className="flex items-center justify-between pb-2 border-b border-[#eaecf0] mb-3">
                    <span className="font-bold text-slate-800">Recent activity</span>
                    <button onClick={() => setShowRecentActivity(false)} className="text-slate-400 hover:text-slate-700">
                      ✕
                    </button>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-slate-800">auth-service • Dependency Check</div>
                        <div className="text-[11px] text-slate-400">65 findings • Nov 1, 10:48</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-slate-800">ecommerce-api • Rescan 7</div>
                        <div className="text-[11px] text-slate-400">3 findings • Nov 1, 10:48</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-slate-800">infrastructure • Baseline</div>
                        <div className="text-[11px] text-slate-400">11 findings • Nov 1, 10:47</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Avatar */}
            <Link
              to="/settings"
              title="Settings"
              className="w-8 h-8 rounded-full bg-[#fff7ed] border border-[#ffedd5] text-[#ea580c] font-bold text-xs flex items-center justify-center hover:shadow-sm transition"
            >
              G
            </Link>
          </div>
        </header>

        {/* Page Children */}
        <main className="flex-1 bg-[#fbfbfc] p-8">{children}</main>
      </div>

      {/* Global Modals & Drawers */}
      <WorkflowModal />
      <ScanModal />
      <FindingDrawer finding={activeDrawerFinding} onClose={closeDrawer} />
    </div>
  )
}
