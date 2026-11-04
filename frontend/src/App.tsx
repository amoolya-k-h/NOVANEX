import { Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Repositories from './pages/Repositories'
import Findings from './pages/Findings'
import Analyst from './pages/Analyst'
import Remediation from './pages/Remediation'
import ScanHistory from './pages/ScanHistory'
import Reports from './pages/Reports'
import Settings from './pages/Settings'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/overview" element={<Navigate to="/" replace />} />
      <Route path="/repositories" element={<Repositories />} />
      <Route path="/findings" element={<Findings />} />
      <Route path="/analyst" element={<Analyst />} />
      <Route path="/remediation" element={<Remediation />} />
      <Route path="/history" element={<ScanHistory />} />
      <Route path="/reports" element={<Reports />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
