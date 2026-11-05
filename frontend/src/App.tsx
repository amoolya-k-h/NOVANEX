import { Routes, Route, Navigate } from 'react-router-dom'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import Upload from './pages/Upload'
import Repositories from './pages/Repositories'
import Findings from './pages/Findings'
import Analyst from './pages/Analyst'
import Remediation from './pages/Remediation'
import Verification from './pages/Verification'
import ScanHistory from './pages/ScanHistory'
import Reports from './pages/Reports'
import Settings from './pages/Settings'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/overview" element={<Navigate to="/dashboard" replace />} />
      <Route path="/upload" element={<Upload />} />
      <Route path="/scan" element={<Navigate to="/upload" replace />} />
      <Route path="/repositories" element={<Repositories />} />
      <Route path="/findings" element={<Findings />} />
      <Route path="/analyst" element={<Analyst />} />
      <Route path="/remediation" element={<Remediation />} />
      <Route path="/verification" element={<Verification />} />
      <Route path="/history" element={<ScanHistory />} />
      <Route path="/reports" element={<Reports />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
