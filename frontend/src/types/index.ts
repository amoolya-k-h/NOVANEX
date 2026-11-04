export type ScanStatus = 'pending' | 'scanning' | 'processing' | 'ai_analysis' | 'completed' | 'failed'
export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO'
export type Category = 'secret' | 'dependency' | 'misconfiguration'
export type Priority = 'P1' | 'P2' | 'P3' | 'P4'

export interface Scan {
  id: string
  project_name: string
  project_description?: string
  status: ScanStatus
  created_at: string
  completed_at?: string
  total_findings: number
  critical_count: number
  high_count: number
  medium_count: number
  low_count: number
  scan_type: string
  parent_scan_id?: string
  error_message?: string
  scanner_errors?: Record<string, string>
}

export interface Finding {
  id: string
  scan_id: string
  category: Category
  scanner: string
  title: string
  description?: string
  severity: Severity
  file_path?: string
  line_number?: number
  evidence?: string
  evidence_redacted: boolean
  risk_score: number
  priority: Priority
  risk_factors?: Record<string, any>
  cve_id?: string
  cwe_id?: string
  cvss_score?: number
  fix_available: boolean
  fixed_version?: string
  reference_urls?: string[]
  package_name?: string
  package_version?: string
  ecosystem?: string
  ai_explanation?: string
  ai_remediation?: string
  status: string
  verification_status?: string
  fingerprint?: string
  created_at: string
}

export interface ScanProgress {
  status: string
  progress: number
  current_step: string
  gitleaks_done: boolean
  trivy_done: boolean
  osv_done: boolean
  findings_count: number
  error?: string
}

