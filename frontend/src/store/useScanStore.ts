import { create } from 'zustand'
import { Scan, Finding, ScanProgress } from '../types'

interface Store {
  currentScan: Scan | null
  scans: Scan[]
  findings: Finding[]
  selectedFinding: Finding | null
  scanProgress: ScanProgress | null
  isScanModalOpen: boolean
  isWorkflowModalOpen: boolean
  activeDrawerFinding: Finding | null

  setCurrentScan: (s: Scan | null) => void
  setScans: (s: Scan[]) => void
  setFindings: (f: Finding[]) => void
  setSelectedFinding: (f: Finding | null) => void
  setScanProgress: (p: ScanProgress | null) => void
  updateFinding: (id: string, updates: Partial<Finding>) => void

  openScanModal: () => void
  closeScanModal: () => void
  openWorkflowModal: () => void
  closeWorkflowModal: () => void
  openDrawer: (f: Finding) => void
  closeDrawer: () => void
}

export const useScanStore = create<Store>((set) => ({
  currentScan: null,
  scans: [],
  findings: [],
  selectedFinding: null,
  scanProgress: null,
  isScanModalOpen: false,
  isWorkflowModalOpen: false,
  activeDrawerFinding: null,

  setCurrentScan: (s) => set({ currentScan: s }),
  setScans: (s) => set({ scans: s }),
  setFindings: (f) => set({ findings: f }),
  setSelectedFinding: (f) => set({ selectedFinding: f }),
  setScanProgress: (p) => set({ scanProgress: p }),
  updateFinding: (id, updates) =>
    set((state) => ({
      findings: state.findings.map((f) => (f.id === id ? { ...f, ...updates } : f)),
      selectedFinding:
        state.selectedFinding?.id === id ? { ...state.selectedFinding, ...updates } : state.selectedFinding,
      activeDrawerFinding:
        state.activeDrawerFinding?.id === id ? { ...state.activeDrawerFinding, ...updates } : state.activeDrawerFinding,
    })),

  openScanModal: () => set({ isScanModalOpen: true }),
  closeScanModal: () => set({ isScanModalOpen: false }),
  openWorkflowModal: () => set({ isWorkflowModalOpen: true }),
  closeWorkflowModal: () => set({ isWorkflowModalOpen: false }),
  openDrawer: (f) => set({ activeDrawerFinding: f }),
  closeDrawer: () => set({ activeDrawerFinding: null }),
}))
