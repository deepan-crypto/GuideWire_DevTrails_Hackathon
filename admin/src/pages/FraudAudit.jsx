import { useState, useEffect } from 'react'
import { ShieldAlert, ShieldCheck, AlertTriangle, RefreshCw, Search, Eye, Wifi, MapPin, Cpu, Network, Radio } from 'lucide-react'
import { fetchFraudLogs, fetchMarketStatus } from '../services/api'

const REASON_BADGES = {
  MOCK_LOCATION_DETECTED:        { label: 'Mock Location',    color: 'bg-red-100 text-red-700 border-red-200' },
  VPN_DATACENTER_IP_DETECTED:    { label: 'VPN/Datacenter',   color: 'bg-orange-100 text-orange-700 border-orange-200' },
  RTT_LATENCY_VPN_BOUNCE:        { label: 'RTT Anomaly',      color: 'bg-amber-100 text-amber-700 border-amber-200' },
  DEAD_METADATA_SYNTHETIC_GPS:   { label: 'Dead Metadata',    color: 'bg-purple-100 text-purple-700 border-purple-200' },
  BSSID_CLUSTER_SYNDICATE_DETECTED: { label: 'BSSID Cluster', color: 'bg-pink-100 text-pink-700 border-pink-200' },
  ML_ISOLATION_FOREST_ANOMALY:   { label: 'ML Anomaly',       color: 'bg-violet-100 text-violet-700 border-violet-200' },
}

const LAYER_ICONS = {
  'Mock Location':    MapPin,
  'VPN/Datacenter':   Network,
  'RTT Anomaly':      Wifi,
  'Dead Metadata':    Cpu,
  'BSSID Cluster':    Radio,
  'ML Anomaly':       ShieldAlert,
}

export default function FraudAudit() {
  const [logs, setLogs] = useState([])
  const [marketStatus, setMarketStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // 'all' | 'blocked' | 'passed'
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    const [fraudData, marketData] = await Promise.all([
      fetchFraudLogs(),
      fetchMarketStatus(),
    ])
    if (fraudData) setLogs(fraudData)
    if (marketData) setMarketStatus(marketData)
    setLoading(false)
  }

  const filteredLogs = logs.filter(log => {
    if (filter === 'blocked' && !log.fraudFlag) return false
    if (filter === 'passed' && log.fraudFlag) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        (log.claimId || '').toLowerCase().includes(q) ||
        (log.riderName || '').toLowerCase().includes(q) ||
        (log.zone || '').toLowerCase().includes(q)
      )
    }
    return true
  })

  const blockedCount = logs.filter(l => l.fraudFlag).length
  const passedCount = logs.filter(l => !l.fraudFlag).length
  const avgConfidence = logs.length > 0
    ? (logs.reduce((s, l) => s + (l.confidenceScore || 0), 0) / logs.length * 100).toFixed(1)
    : 0

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldAlert className="text-red-500" size={22} />
            Fraud Audit Log
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Zero-Trust Fraud Defense — Isolation Forest + Multi-layer Detection
          </p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Market Crash Protocol Banner */}
      {marketStatus?.crash_detected && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="text-red-500 mt-0.5 shrink-0" size={18} />
          <div>
            <p className="text-sm font-bold text-red-800">
              🚨 Dynamic Solvency Protocol ACTIVE
            </p>
            <p className="text-xs text-red-600 mt-1">
              Market crash detected. Pro & Standard tier purchases are locked. Only Basic tier is available.
              Order volume drop: {marketStatus.order_volume_drop_pct}%
            </p>
          </div>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <div className="text-2xl font-bold text-gray-900">{logs.length}</div>
          <div className="text-xs text-gray-500 mt-1">Total Scans</div>
        </div>
        <div className="bg-white rounded-lg border border-red-100 p-4">
          <div className="text-2xl font-bold text-red-600">{blockedCount}</div>
          <div className="text-xs text-gray-500 mt-1">Blocked</div>
        </div>
        <div className="bg-white rounded-lg border border-green-100 p-4">
          <div className="text-2xl font-bold text-green-600">{passedCount}</div>
          <div className="text-xs text-gray-500 mt-1">Passed</div>
        </div>
        <div className="bg-white rounded-lg border border-blue-100 p-4">
          <div className="text-2xl font-bold text-blue-600">{avgConfidence}%</div>
          <div className="text-xs text-gray-500 mt-1">Avg Confidence</div>
        </div>
      </div>

      {/* Detection Layers Overview */}
      <div className="bg-white rounded-lg border border-gray-100 p-4">
        <h3 className="text-sm font-bold text-gray-800 mb-3">🛡️ Detection Layers — Isolation Forest + Rule-Based</h3>
        <div className="grid grid-cols-6 gap-3">
          {Object.entries(REASON_BADGES).map(([key, val]) => {
            const count = logs.filter(l => (l.fraudReasons || '').includes(key)).length
            return (
              <div key={key} className={`rounded-lg p-3 border text-center ${val.color}`}>
                <div className="text-lg font-bold">{count}</div>
                <div className="text-[10px] font-semibold mt-1">{val.label}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input
            type="text"
            placeholder="Search by claim, rider, zone..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-300"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          {[
            { key: 'all', label: 'All' },
            { key: 'blocked', label: `Blocked (${blockedCount})` },
            { key: 'passed', label: `Passed (${passedCount})` },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                filter === tab.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">CLAIM ID</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">RIDER</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">ZONE</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">ML VERDICT</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">CONFIDENCE</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">FRAUD REASONS</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">RTT (ms)</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map(log => {
                const reasons = (log.fraudReasons || '').split(',').filter(Boolean)
                return (
                  <tr key={log.id} className={`border-b border-gray-50 hover:bg-gray-25 ${log.fraudFlag ? 'bg-red-50/30' : ''}`}>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{log.claimId}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 text-xs">{log.riderName || '—'}</div>
                      <div className="text-[10px] text-gray-400">ID: {log.riderId}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{log.zone || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        log.mlPrediction === 'ANOMALY'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {log.mlPrediction === 'ANOMALY' ? <AlertTriangle size={10} /> : <ShieldCheck size={10} />}
                        {log.mlPrediction || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              (log.confidenceScore || 0) >= 0.8 ? 'bg-green-500' :
                              (log.confidenceScore || 0) >= 0.5 ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${(log.confidenceScore || 0) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-gray-600">
                          {((log.confidenceScore || 0) * 100).toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {reasons.length > 0 ? reasons.map(r => {
                          const badge = REASON_BADGES[r]
                          return badge ? (
                            <span key={r} className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-semibold border ${badge.color}`}>
                              {badge.label}
                            </span>
                          ) : null
                        }) : (
                          <span className="text-[10px] text-gray-300">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-gray-600">
                      {log.networkRttMs ? `${log.networkRttMs.toFixed(0)}ms` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        log.verdict === 'BLOCKED'
                          ? 'bg-red-100 text-red-700 border border-red-200'
                          : log.verdict === 'FLAGGED'
                          ? 'bg-amber-100 text-amber-700 border border-amber-200'
                          : 'bg-green-100 text-green-700 border border-green-200'
                      }`}>
                        {log.verdict === 'BLOCKED' ? '🚫' : log.verdict === 'FLAGGED' ? '⚠️' : '✅'}
                        {log.verdict || '—'}
                      </span>
                    </td>
                  </tr>
                )
              })}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-400 text-sm">
                    No fraud logs found matching your criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
