import axios from 'axios'
import toast from 'react-hot-toast'

const api = axios.create({ baseURL: '/api', timeout: 120000 })

api.interceptors.response.use(
  (r) => r,
  (err) => {
    const msg = err.response?.data?.detail || err.message || 'Request failed'
    toast.error(msg)
    return Promise.reject(err)
  }
)

export default api

export const uploadScan = (fd: FormData) =>
  api.post('/scans/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })

export const getScan = (id: string) => api.get(`/scans/${id}`)
export const listScans = () => api.get('/scans/')
export const getOverviewMetrics = () => api.get('/scans/overview/metrics')
export const getFindings = (scanId: string, params?: any) => api.get(`/findings/scan/${scanId}`, { params })
export const getFinding = (id: string) => api.get(`/findings/${id}`)
export const getFindingDiff = (findingId: string) => api.get(`/ai/diff/${findingId}`)
export const sendAIChat = (findingId: string, message: string, history?: any[]) =>
  api.post('/ai/chat', { finding_id: findingId, message, history })
export const resolveFinding = (findingId: string) => api.post(`/findings/${findingId}/resolve`)
export const startVerification = (origId: string, fd: FormData) =>
  api.post(`/verify/${origId}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
export const getComparison = (origId: string, verifId: string) => api.get(`/verify/${origId}/compare/${verifId}`)
export const downloadHtmlReport = (id: string) => window.open(`/api/reports/${id}/html`, '_blank')

export const streamAIExplanation = (findingId: string, onChunk: (t: string) => void, onDone: () => void) => {
  const es = new EventSource(`/api/ai/explain/${findingId}/stream`)
  es.onmessage = (e) => {
    const d = JSON.parse(e.data)
    if (d.done) { es.close(); onDone() }
    else if (d.chunk) onChunk(d.chunk)
  }
  es.onerror = () => { es.close(); onDone() }
  return es
}

export const streamAIRemediation = (findingId: string, onChunk: (t: string) => void, onDone: () => void) => {
  const es = new EventSource(`/api/ai/remediate/${findingId}/stream`)
  es.onmessage = (e) => {
    const d = JSON.parse(e.data)
    if (d.done) { es.close(); onDone() }
    else if (d.chunk) onChunk(d.chunk)
  }
  es.onerror = () => { es.close(); onDone() }
  return es
}

export const scanProgressSSE = (scanId: string, onProgress: (d: any) => void) => {
  const es = new EventSource(`/api/scans/${scanId}/progress`)
  es.onmessage = (e) => {
    const d = JSON.parse(e.data)
    onProgress(d)
    if (d.status === 'completed' || d.status === 'failed') es.close()
  }
  es.onerror = () => es.close()
  return es
}

