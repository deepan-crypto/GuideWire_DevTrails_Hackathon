import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchPolicies } from '../services/api'
import { Search, Filter, Download, RefreshCw, ChevronDown, ExternalLink, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react'

function RiskBadge({ score }) {
  let color = 'bg-green-100 text-green-700 border-green-200'
  let label = 'Low'
  if (score >= 80) { color = 'bg-red-100 text-red-700 border-red-200'; label = 'Critical' }
  else if (score >= 60) { color = 'bg-amber-100 text-amber-700 border-amber-200'; label = 'Moderate' }
  else if (score >= 40) { color = 'bg-yellow-100 text-yellow-700 border-yellow-200'; label = 'Elevated' }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-semibold border ${color}`}>
      {score >= 80 && <AlertTriangle className="w-3 h-3" />}
      {label} ({score})
    </span>
  )
}

function exportCSV(data, filename) {
  const headers = ['Policy Number', 'Rider Name', 'Plan', 'Risk Zone', 'Risk Score', 'AI Premium', 'Status', 'Start Date']
  const rows = data.map(p => [p.id, p.riderName, p.plan, p.zone, p.riskScore, p.premium, p.status, p.startDate])
  const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function PolicyCenter() {
  const [searchTerm, setSearchTerm] = useState('')
  const navigate = useNavigate()
  const [syncing, setSyncing] = useState(false)
  const [toast, setToast] = useState(null)
  const [policies, setPolicies] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetchPolicies().then(data => {
      if (data && data.length > 0) {
        const mapped = data.map(p => ({
          id: p.policyNumber, riderName: p.riderName, zone: p.zone, riskScore: p.riskScore,
          premium: p.premium, status: p.status, plan: p.plan, startDate: p.startDate
        }))
        setPolicies(mapped)
      }
    }).finally(() => setLoading(false))
  }, [])

  const filtered = policies.filter(p =>
    p.riderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.zone.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleExport = () => {
    exportCSV(filtered, `gig-worker-policies-${new Date().toISOString().slice(0,10)}.csv`)
    setToast('Exported ' + filtered.length + ' policies to CSV')
    setTimeout(() => setToast(null), 3000)
  }

  const handleSync = () => {
    setSyncing(true)
    setToast('Syncing with AI Oracle...')
    setTimeout(() => {
      setSyncing(false)
      setToast('AI Oracle sync complete — All premiums up to date')
      setTimeout(() => setToast(null), 3000)
    }, 2000)
  }

  return (
    <div className="relative">
      {/* Toast notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-gw-header text-white px-4 py-2.5 rounded shadow-lg text-[12px] font-medium flex items-center gap-2 animate-[fadeIn_0.3s_ease-out]">
          <CheckCircle className="w-4 h-4 text-green-400" />
          {toast}
        </div>
      )}

      {/* Server cold-start banner */}
      {loading && (
        <div className="flex items-center gap-2.5 px-4 py-2.5 mb-4 bg-blue-50 border border-blue-200 rounded text-[12px] text-blue-800">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          <span><span className="font-semibold">Connecting to server…</span> The backend may take up to 30s to wake from sleep. Data will load automatically.</span>
        </div>
      )}

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[11px] text-gw-text-muted mb-3">
        <span>PolicyCenter</span>
        <span>›</span>
        <span className="text-gw-text font-medium">Active Policies</span>
        <span>›</span>
        <span className="text-gw-blue font-medium">Gig Worker — Parametric</span>
      </div>

      {/* Page header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-[18px] font-semibold text-gw-text tracking-tight">Gig Worker Policies</h1>
          <p className="text-[12px] text-gw-text-muted mt-0.5">Parametric micro-insurance policies with AI-adjusted dynamic pricing</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gw-border rounded text-[11.5px] font-medium text-gw-text hover:bg-gray-50 transition-colors">
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
          <button onClick={handleSync} disabled={syncing} className="flex items-center gap-1.5 px-3 py-1.5 bg-gw-blue text-white rounded text-[11.5px] font-medium hover:bg-gw-blue-dark transition-colors shadow-sm disabled:opacity-60">
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Oracle'}
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Total Active Policies', value: '1,247', change: '+12%', positive: true },
          { label: 'Avg. AI Premium', value: '₹154/day', change: '+8%', positive: false },
          { label: 'High-Risk Zones', value: '5', change: '+2', positive: false },
          { label: 'Coverage Utilization', value: '94.2%', change: '+1.4%', positive: true },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded border border-gw-border p-3">
            <div className="text-[10.5px] text-gw-text-muted font-medium uppercase tracking-wider">{stat.label}</div>
            <div className="flex items-end gap-2 mt-1">
              <span className="text-[20px] font-bold text-gw-text leading-tight">{stat.value}</span>
              <span className={`text-[10.5px] font-semibold mb-0.5 ${stat.positive ? 'text-green-600' : 'text-amber-600'}`}>
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className="bg-white rounded border border-gw-border">
        {/* Table toolbar */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gw-border">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gw-text-muted" />
              <input
                type="text"
                placeholder="Search by policy, rider, zone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-gw-bg border border-gw-border rounded text-[11.5px] pl-8 pr-3 py-1.5 w-[240px] focus:outline-none focus:border-gw-blue focus:ring-1 focus:ring-gw-blue/20 transition-all"
              />
            </div>
            <button className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gw-bg border border-gw-border rounded text-[11px] text-gw-text-muted hover:text-gw-text transition-colors">
              <Filter className="w-3 h-3" />
              Filters
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>
          <div className="text-[11px] text-gw-text-muted">
            Showing <span className="font-semibold text-gw-text">{filtered.length}</span> of {policies.length} policies
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gw-bg/60">
                <th className="text-left px-4 py-2 text-[10.5px] font-semibold text-gw-text-muted uppercase tracking-wider border-b border-gw-border">Policy Number</th>
                <th className="text-left px-4 py-2 text-[10.5px] font-semibold text-gw-text-muted uppercase tracking-wider border-b border-gw-border">Rider Name</th>
                <th className="text-left px-4 py-2 text-[10.5px] font-semibold text-gw-text-muted uppercase tracking-wider border-b border-gw-border">Plan</th>
                <th className="text-left px-4 py-2 text-[10.5px] font-semibold text-gw-text-muted uppercase tracking-wider border-b border-gw-border">Risk Zone (Micro-zone)</th>
                <th className="text-left px-4 py-2 text-[10.5px] font-semibold text-gw-text-muted uppercase tracking-wider border-b border-gw-border">Risk Score</th>
                <th className="text-left px-4 py-2 text-[10.5px] font-semibold text-gw-text-muted uppercase tracking-wider border-b border-gw-border">AI-Adjusted Premium</th>
                <th className="text-left px-4 py-2 text-[10.5px] font-semibold text-gw-text-muted uppercase tracking-wider border-b border-gw-border">Status</th>
                <th className="text-left px-4 py-2 text-[10.5px] font-semibold text-gw-text-muted uppercase tracking-wider border-b border-gw-border"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((policy, idx) => (
                <tr key={policy.id} onClick={() => navigate(`/policy-center/rider/${policy.id}`)} className={`hover:bg-gw-blue-light/40 transition-colors cursor-pointer ${idx % 2 === 0 ? 'bg-white' : 'bg-gw-bg/30'}`}>
                  <td className="px-4 py-2.5 text-[12px]">
                    <span className="font-mono text-gw-blue font-semibold">{policy.id}</span>
                  </td>
                  <td className="px-4 py-2.5 text-[12px] font-medium">{policy.riderName}</td>
                  <td className="px-4 py-2.5 text-[11.5px]">
                    <span className="bg-gw-blue-light text-gw-blue px-2 py-0.5 rounded text-[10.5px] font-medium">{policy.plan}</span>
                  </td>
                  <td className="px-4 py-2.5 text-[12px] text-gw-text-muted font-mono text-[11px]">{policy.zone}</td>
                  <td className="px-4 py-2.5"><RiskBadge score={policy.riskScore} /></td>
                  <td className="px-4 py-2.5 text-[12px] font-semibold text-gw-text">{policy.premium}</td>
                  <td className="px-4 py-2.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-semibold bg-green-100 text-green-700 border border-green-200">
                      <CheckCircle className="w-3 h-3" />
                      {policy.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <button onClick={(e) => { e.stopPropagation(); navigate(`/policy-center/rider/${policy.id}`); }} className="text-gw-blue hover:text-gw-blue-dark transition-colors">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table footer */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-gw-border bg-gw-bg/40">
          <span className="text-[11px] text-gw-text-muted">Last synced with AI Oracle: <span className="font-medium text-gw-text">2 minutes ago</span></span>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3].map(p => (
              <button key={p} className={`w-7 h-7 rounded text-[11px] font-medium transition-colors ${p === 1 ? 'bg-gw-blue text-white' : 'bg-white border border-gw-border text-gw-text-muted hover:bg-gw-bg'}`}>
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

