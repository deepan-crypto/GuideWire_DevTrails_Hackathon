import { useState, useEffect } from 'react'
import { Search, Filter, Download, RefreshCw, Users, Shield, Clock, MapPin, ChevronDown, CheckCircle, AlertTriangle, Eye, Ban, RotateCcw, Loader2 } from 'lucide-react'
import { fetchTriggerZones } from '../services/api'

const BASE_URL = (import.meta.env.VITE_API_URL || '/api/v1/admin').replace(/\/api\/v1\/admin$/, '')

/* ── Helper components ─────────────────────────────────────────────────── */
function TierBadge({ tier }) {
  if (!tier) return <span className="text-[10.5px] text-gray-400 italic">No policy</span>
  const colors = {
    PRO: 'bg-amber-100 text-amber-700 border-amber-200',
    STANDARD: 'bg-blue-100 text-blue-700 border-blue-200',
    BASIC: 'bg-green-100 text-green-700 border-green-200',
  }
  return <span className={`px-2 py-0.5 rounded text-[10.5px] font-semibold border ${colors[tier] || 'bg-gray-100 text-gray-600'}`}>{tier}</span>
}

function StatusDot({ active }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${active ? 'text-green-700' : 'text-gray-400'}`}>
      <span className={`w-2 h-2 rounded-full ${active ? 'bg-green-500' : 'bg-gray-300'}`} />
      {active ? 'Active' : 'Inactive'}
    </span>
  )
}

function RiskLabel({ level }) {
  const colors = { High: 'text-red-600 bg-red-50', Moderate: 'text-amber-600 bg-amber-50', Low: 'text-green-600 bg-green-50' }
  return <span className={`px-2 py-0.5 rounded text-[10.5px] font-semibold ${colors[level]}`}>{level}</span>
}

function AuditIcon({ type }) {
  const cls = 'w-3.5 h-3.5'
  if (type === 'trigger') return <AlertTriangle className={`${cls} text-red-500`} />
  if (type === 'action') return <Shield className={`${cls} text-blue-500`} />
  if (type === 'export') return <Download className={`${cls} text-purple-500`} />
  if (type === 'view') return <Eye className={`${cls} text-gray-500`} />
  return <Clock className={`${cls} text-gray-400`} />
}

function RiderDetailModal({ rider, onClose }) {
  if (!rider) return null
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-100 w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <span className="font-bold text-[14px] text-gw-text">Rider Profile</span>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold leading-none">&times;</button>
        </div>
        <div className="px-5 py-5 space-y-3">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-full bg-gw-blue text-white flex items-center justify-center font-bold text-[16px]">
              {rider.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
            </div>
            <div>
              <div className="font-bold text-[15px] text-gw-text">{rider.name}</div>
              <div className="text-[11.5px] text-gw-text-muted">{rider.phone} · {rider.platform}</div>
            </div>
          </div>
          {[
            ['Rider ID', `R-${String(rider.id).padStart(4, '0')}`],
            ['City / Zone', `${rider.city} · ${rider.zone}`],
            ['Age', `${rider.age} years`],
            ['Policy Tier', rider.policyTier || 'None'],
            ['Policy Status', rider.isPolicyActive ? '✅ Active' : '❌ Inactive'],
            ['Wallet Balance', `₹${rider.walletBalance.toLocaleString()}`],
            ['Registered', rider.registeredAt],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between text-[11.5px]">
              <span className="text-gw-text-muted font-medium">{k}</span>
              <span className="font-semibold text-gw-text">{v}</span>
            </div>
          ))}
        </div>
        <div className="px-5 py-3 border-t border-gray-100 flex justify-end">
          <button onClick={onClose} className="px-4 py-1.5 bg-gw-blue text-white rounded text-[12px] font-semibold hover:bg-blue-700 transition-colors">Close</button>
        </div>
      </div>
    </div>
  )
}

function exportCSV(data, filename) {
  const headers = ['ID', 'Name', 'Phone', 'City', 'Zone', 'Platform', 'Age', 'Policy Active', 'Tier', 'Wallet Balance', 'Registered']
  const rows = data.map(r => [r.id, r.name, r.phone, r.city, r.zone, r.platform, r.age, r.isPolicyActive, r.policyTier || '-', r.walletBalance, r.registeredAt])
  const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

/* ── Main component ────────────────────────────────────────────────────── */
export default function UserManagement() {
  const [activeTab, setActiveTab] = useState('riders')
  const [search, setSearch] = useState('')
  const [riders, setRiders] = useState([])
  const [toast, setToast] = useState(null)
  const [viewRider, setViewRider] = useState(null)
  const [filterStatus, setFilterStatus] = useState('all')
  const [showFilterMenu, setShowFilterMenu] = useState(false)
  const [loading, setLoading] = useState(true)
  const [zones, setZones] = useState([])
  const [adminUsers, setAdminUsers] = useState([])
  const [auditLog, setAuditLog] = useState([])
  const PAGE_SIZE = 5
  const [page, setPage] = useState(1)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetch(`${BASE_URL}/api/v1/admin/riders`).then(r => r.json()).then(data => {
        if (data && data.length > 0) setRiders(data)
      }).catch(() => { }),
      fetchTriggerZones().then(data => {
        if (data && data.length > 0) {
          setZones(data.map(z => ({
            id: z.id, city: z.name.split(',')[1]?.trim() || z.name,
            area: z.name.split(',')[0]?.trim() || z.id,
            riders: z.riders, risk: z.triggered ? 'High' : (z.temp >= 38 ? 'Moderate' : 'Low'),
            temp: `${z.temp}°C`, rainfall: `${z.rain}mm`
          })))
        }
      }),
    ]).finally(() => setLoading(false))
  }, [])

  const filteredRiders = riders.filter(r => {
    const matchSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.city.toLowerCase().includes(search.toLowerCase()) ||
      r.zone.toLowerCase().includes(search.toLowerCase()) ||
      r.phone.includes(search)
    const matchStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && r.isPolicyActive) ||
      (filterStatus === 'inactive' && !r.isPolicyActive)
    return matchSearch && matchStatus
  })

  const totalPages = Math.max(1, Math.ceil(filteredRiders.length / PAGE_SIZE))
  const pagedRiders = filteredRiders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const handleSuspend = (rider) => {
    setRiders(prev => prev.map(r =>
      r.id === rider.id ? { ...r, isPolicyActive: false, policyTier: null } : r
    ))
    showToast(`Rider ${rider.name} suspended — policy deactivated`)
  }

  const handleReset = (rider) => {
    setRiders(prev => prev.map(r =>
      r.id === rider.id ? { ...r, walletBalance: 500, isPolicyActive: false } : r
    ))
    showToast(`Rider ${rider.name} wallet reset to ₹500`)
  }

  const TABS = [
    { id: 'riders', label: 'Rider Registry', count: riders.length },
    { id: 'admins', label: 'Admin Roles', count: adminUsers.length },
    { id: 'audit', label: 'Audit Log', count: auditLog.length },
    { id: 'zones', label: 'Zone Management', count: zones.length },
  ]

  return (
    <div className="relative">
      {/* Rider detail modal */}
      <RiderDetailModal rider={viewRider} onClose={() => setViewRider(null)} />
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-gw-header text-white px-4 py-2.5 rounded shadow-lg text-[12px] font-medium flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-400" />
          {toast}
        </div>
      )}

      {/* Page header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-[18px] font-bold text-gw-text">User Management</h1>
          <p className="text-[11.5px] text-gw-text-muted mt-0.5">Rider registry, admin roles, and operational audit log</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { exportCSV(riders, `riders-${new Date().toISOString().slice(0, 10)}.csv`); showToast('Exported ' + riders.length + ' riders to CSV') }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gw-border rounded text-[11.5px] font-medium text-gw-text hover:bg-gray-50"
          >
            <Download className="w-3.5 h-3.5" /> Export
          </button>
          <button
            onClick={() => showToast('Data refreshed')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gw-blue text-white rounded text-[11.5px] font-semibold hover:bg-blue-700"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gw-border mb-0 bg-white rounded-t">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-[12px] font-medium border-b-2 transition-colors ${activeTab === tab.id
              ? 'border-gw-blue text-gw-blue bg-blue-50/50'
              : 'border-transparent text-gw-text-muted hover:text-gw-text hover:bg-gray-50'
              }`}
          >
            {tab.label}
            <span className={`ml-1.5 px-1.5 py-0.5 rounded text-[9.5px] font-bold ${activeTab === tab.id ? 'bg-gw-blue text-white' : 'bg-gray-100 text-gray-500'
              }`}>{tab.count}</span>
          </button>
        ))}
      </div>

      {/* ────────── RIDERS TAB ────────── */}
      {activeTab === 'riders' && (
        <div className="bg-white border border-t-0 border-gw-border rounded-b">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gw-border">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text" placeholder="Search riders..."
                  value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
                  className="pl-8 pr-3 py-1.5 border border-gw-border rounded text-[11.5px] w-[240px] focus:outline-none focus:border-gw-blue/50"
                />
              </div>
              <span className="text-[11px] text-gw-text-muted">{filteredRiders.length} of {riders.length} riders</span>
            </div>
            <div className="relative">
              <button
                onClick={() => setShowFilterMenu(m => !m)}
                className="flex items-center gap-1 px-2.5 py-1.5 border border-gw-border rounded text-[11px] text-gw-text-muted hover:bg-gray-50"
              >
                <Filter className="w-3 h-3" /> Filter <ChevronDown className="w-3 h-3" />
              </button>
              {showFilterMenu && (
                <div className="absolute right-0 top-8 w-36 bg-white rounded shadow-lg border border-gray-100 z-20 py-1">
                  {[['all', 'All Riders'], ['active', 'Active Only'], ['inactive', 'Inactive Only']].map(([v, l]) => (
                    <button
                      key={v}
                      onClick={() => { setFilterStatus(v); setShowFilterMenu(false); setPage(1) }}
                      className={`w-full text-left px-3 py-1.5 text-[11px] hover:bg-blue-50 transition-colors ${filterStatus === v ? 'font-semibold text-gw-blue' : 'text-gw-text'
                        }`}
                    >{l}</button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-[11.5px]">
              <thead>
                <tr className="bg-gw-bg border-b border-gw-border">
                  <th className="text-left px-4 py-2 font-semibold text-gw-text-muted">ID</th>
                  <th className="text-left px-4 py-2 font-semibold text-gw-text-muted">Rider Name</th>
                  <th className="text-left px-4 py-2 font-semibold text-gw-text-muted">Phone</th>
                  <th className="text-left px-4 py-2 font-semibold text-gw-text-muted">City / Zone</th>
                  <th className="text-left px-4 py-2 font-semibold text-gw-text-muted">Platform</th>
                  <th className="text-left px-4 py-2 font-semibold text-gw-text-muted">Tier</th>
                  <th className="text-left px-4 py-2 font-semibold text-gw-text-muted">Status</th>
                  <th className="text-right px-4 py-2 font-semibold text-gw-text-muted">Wallet ₹</th>
                  <th className="text-left px-4 py-2 font-semibold text-gw-text-muted">Registered</th>
                  <th className="text-center px-4 py-2 font-semibold text-gw-text-muted">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagedRiders.map((r, i) => (
                  <tr key={r.id} className={`border-b border-gw-border hover:bg-blue-50/30 transition-colors ${i % 2 === 1 ? 'bg-gray-50/50' : ''}`}>
                    <td className="px-4 py-2.5 font-mono text-gw-blue font-semibold">R-{String(r.id).padStart(4, '0')}</td>
                    <td className="px-4 py-2.5 font-medium text-gw-text">{r.name}</td>
                    <td className="px-4 py-2.5 text-gw-text-muted font-mono">{r.phone}</td>
                    <td className="px-4 py-2.5">
                      <div className="text-gw-text">{r.city}</div>
                      <div className="text-[10px] text-gw-text-muted">{r.zone}</div>
                    </td>
                    <td className="px-4 py-2.5 text-gw-text">{r.platform}</td>
                    <td className="px-4 py-2.5"><TierBadge tier={r.policyTier} /></td>
                    <td className="px-4 py-2.5"><StatusDot active={r.isPolicyActive} /></td>
                    <td className="px-4 py-2.5 text-right font-mono font-medium text-gw-text">₹{r.walletBalance.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-gw-text-muted">{r.registeredAt}</td>
                    <td className="px-4 py-2.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          className="p-1 rounded hover:bg-blue-100" title="View"
                          onClick={() => setViewRider(r)}
                        ><Eye className="w-3.5 h-3.5 text-gw-blue" /></button>
                        <button
                          className="p-1 rounded hover:bg-red-100" title="Suspend"
                          onClick={() => handleSuspend(r)}
                        ><Ban className="w-3.5 h-3.5 text-red-400" /></button>
                        <button
                          className="p-1 rounded hover:bg-green-100" title="Reset"
                          onClick={() => handleReset(r)}
                        ><RotateCcw className="w-3.5 h-3.5 text-green-500" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination footer */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-gw-bg border-t border-gw-border text-[11px] text-gw-text-muted">
            <span>Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredRiders.length)} of {filteredRiders.length} riders</span>
            <div className="flex items-center gap-1">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-2 py-1 border border-gw-border rounded bg-white hover:bg-gray-50 disabled:opacity-40"
              >‹ Prev</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-2 py-1 border border-gw-border rounded font-semibold ${p === page ? 'bg-gw-blue text-white' : 'bg-white hover:bg-gray-50'
                    }`}
                >{p}</button>
              ))}
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="px-2 py-1 border border-gw-border rounded bg-white hover:bg-gray-50 disabled:opacity-40"
              >Next ›</button>
            </div>
          </div>
        </div>
      )}

      {/* ────────── ADMINS TAB ────────── */}
      {activeTab === 'admins' && (
        <div className="bg-white border border-t-0 border-gw-border rounded-b">
          <div className="overflow-x-auto">
            <table className="w-full text-[11.5px]">
              <thead>
                <tr className="bg-gw-bg border-b border-gw-border">
                  <th className="text-left px-4 py-2 font-semibold text-gw-text-muted">Name</th>
                  <th className="text-left px-4 py-2 font-semibold text-gw-text-muted">Email</th>
                  <th className="text-left px-4 py-2 font-semibold text-gw-text-muted">Role</th>
                  <th className="text-left px-4 py-2 font-semibold text-gw-text-muted">Status</th>
                  <th className="text-left px-4 py-2 font-semibold text-gw-text-muted">Last Login</th>
                  <th className="text-left px-4 py-2 font-semibold text-gw-text-muted">Permissions</th>
                </tr>
              </thead>
              <tbody>
                {adminUsers.map((u, i) => (
                  <tr key={u.id} className={`border-b border-gw-border ${i % 2 === 1 ? 'bg-gray-50/50' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-gw-blue text-white flex items-center justify-center text-[10px] font-bold">
                          {u.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                        </div>
                        <span className="font-medium text-gw-text">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gw-text-muted">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10.5px] font-semibold border ${u.role === 'Super Admin' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                        u.role === 'System' ? 'bg-gray-100 text-gray-600 border-gray-200' :
                          'bg-blue-100 text-blue-700 border-blue-200'
                        }`}>{u.role}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-green-700">
                        <span className="w-2 h-2 rounded-full bg-green-500" /> {u.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gw-text-muted font-mono text-[10.5px]">{u.lastLogin}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {u.role === 'Super Admin' && ['Read', 'Write', 'Delete', 'Admin'].map(p => (
                          <span key={p} className="px-1.5 py-0.5 bg-green-50 text-green-700 rounded text-[9px] font-semibold">{p}</span>
                        ))}
                        {u.role === 'Claims Manager' && ['Read', 'Write'].map(p => (
                          <span key={p} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[9px] font-semibold">{p}</span>
                        ))}
                        {u.role === 'System' && (
                          <span className="px-1.5 py-0.5 bg-gray-50 text-gray-600 rounded text-[9px] font-semibold">Automated</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Info box */}
          <div className="m-4 p-3 bg-blue-50 border border-blue-200 rounded flex items-start gap-2.5">
            <Shield className="w-4 h-4 text-gw-blue mt-0.5 shrink-0" />
            <div className="text-[11px] text-blue-800">
              <span className="font-semibold">RBAC Policy:</span> Role-based access control is enforced. Super Admin has full system access. Claims Managers can view and process claims but cannot modify system configuration. System accounts are automated and cannot be used for manual login.
            </div>
          </div>
        </div>
      )}

      {/* ────────── AUDIT LOG TAB ────────── */}
      {activeTab === 'audit' && (
        <div className="bg-white border border-t-0 border-gw-border rounded-b">
          <div className="px-4 py-3 border-b border-gw-border flex items-center justify-between">
            <span className="text-[11.5px] text-gw-text-muted">Today — {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            <button className="flex items-center gap-1 px-2.5 py-1.5 border border-gw-border rounded text-[11px] text-gw-text-muted hover:bg-gray-50">
              <Filter className="w-3 h-3" /> Filter by type
            </button>
          </div>
          <div className="divide-y divide-gw-border">
            {auditLog.map((log, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50/50">
                <div className="mt-0.5"><AuditIcon type={log.type} /></div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11.5px] text-gw-text">{log.action}</div>
                  <div className="text-[10px] text-gw-text-muted mt-0.5">by {log.user}</div>
                </div>
                <span className="text-[10px] text-gw-text-muted font-mono shrink-0">{log.time}</span>
              </div>
            ))}
          </div>
          <div className="px-4 py-2.5 bg-gw-bg border-t border-gw-border text-[11px] text-gw-text-muted text-center">
            Showing last 8 entries · <button className="text-gw-blue font-semibold hover:underline">View full history</button>
          </div>
        </div>
      )}

      {/* ────────── ZONES TAB ────────── */}
      {activeTab === 'zones' && (
        <div className="bg-white border border-t-0 border-gw-border rounded-b">
          <div className="px-4 py-3 border-b border-gw-border">
            <div className="flex items-center gap-2 text-[11px]">
              <MapPin className="w-3.5 h-3.5 text-gw-blue" />
              <span className="text-gw-text-muted">Micro-zone assignments — Weather data refreshed every 60 minutes by actuarial cron job</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[11.5px]">
              <thead>
                <tr className="bg-gw-bg border-b border-gw-border">
                  <th className="text-left px-4 py-2 font-semibold text-gw-text-muted">Zone ID</th>
                  <th className="text-left px-4 py-2 font-semibold text-gw-text-muted">City</th>
                  <th className="text-left px-4 py-2 font-semibold text-gw-text-muted">Area</th>
                  <th className="text-center px-4 py-2 font-semibold text-gw-text-muted">Riders</th>
                  <th className="text-center px-4 py-2 font-semibold text-gw-text-muted">Risk Level</th>
                  <th className="text-center px-4 py-2 font-semibold text-gw-text-muted">Temperature</th>
                  <th className="text-center px-4 py-2 font-semibold text-gw-text-muted">Rainfall</th>
                  <th className="text-center px-4 py-2 font-semibold text-gw-text-muted">Trigger Status</th>
                </tr>
              </thead>
              <tbody>
                {zones.map((z, i) => {
                  const temp = parseInt(z.temp)
                  const rain = parseInt(z.rainfall)
                  const heatTrigger = temp >= 45
                  const rainTrigger = rain >= 80
                  return (
                    <tr key={z.id} className={`border-b border-gw-border ${i % 2 === 1 ? 'bg-gray-50/50' : ''}`}>
                      <td className="px-4 py-2.5 font-mono text-gw-blue font-semibold">{z.id}</td>
                      <td className="px-4 py-2.5 text-gw-text font-medium">{z.city}</td>
                      <td className="px-4 py-2.5 text-gw-text-muted">{z.area}</td>
                      <td className="px-4 py-2.5 text-center font-semibold">{z.riders}</td>
                      <td className="px-4 py-2.5 text-center"><RiskLabel level={z.risk} /></td>
                      <td className="px-4 py-2.5 text-center">
                        <span className={`font-mono font-semibold ${heatTrigger ? 'text-red-600' : 'text-gw-text'}`}>{z.temp}</span>
                        {heatTrigger && <span className="ml-1 text-[9px] text-red-500 font-bold">⚠ HEAT</span>}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span className={`font-mono font-semibold ${rainTrigger ? 'text-blue-600' : 'text-gw-text'}`}>{z.rainfall}</span>
                        {rainTrigger && <span className="ml-1 text-[9px] text-blue-500 font-bold">⚠ RAIN</span>}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        {(heatTrigger || rainTrigger) ? (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-[10px] font-bold border border-red-200">TRIGGERED</span>
                        ) : (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-[10px] font-bold border border-green-200">NORMAL</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {/* Legend */}
          <div className="px-4 py-2.5 bg-gw-bg border-t border-gw-border text-[10px] text-gw-text-muted flex items-center gap-4">
            <span>Thresholds:</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-500 rounded-full" /> Heat ≥ 45°C</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-blue-500 rounded-full" /> Rain ≥ 80mm</span>
            <span className="ml-auto">Last sync: {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      )}
    </div>
  )
}
