import { useState, useEffect } from 'react'
import { Search, Filter, Download, RefreshCw, Users, Shield, Clock, MapPin, ChevronDown, CheckCircle, AlertTriangle, Eye, Ban, RotateCcw, Loader2, X, UserCheck, UserX } from 'lucide-react'
import { fetchRiders } from '../services/api'

/* ── Mock data (fallback when backend is unavailable) ──────────────────── */
const MOCK_RIDERS = [
  { id: 1, name: 'Amit Sharma', phone: '9876543210', city: 'Delhi', zone: 'MZ-DEL-04', platform: 'Swiggy', age: 28, isPolicyActive: true, policyTier: 'PRO', walletBalance: 1200, registeredAt: '2026-03-10' },
  { id: 2, name: 'Priya Patel', phone: '9123456789', city: 'Mumbai', zone: 'MZ-MUM-02', platform: 'Zomato', age: 24, isPolicyActive: true, policyTier: 'STANDARD', walletBalance: 850, registeredAt: '2026-03-11' },
  { id: 3, name: 'Ravi Kumar', phone: '9988776655', city: 'Chennai', zone: 'MZ-CHN-01', platform: 'Dunzo', age: 31, isPolicyActive: true, policyTier: 'BASIC', walletBalance: 300, registeredAt: '2026-03-12' },
  { id: 4, name: 'Deepika Nair', phone: '9112233445', city: 'Bengaluru', zone: 'MZ-BLR-03', platform: 'Swiggy', age: 26, isPolicyActive: false, policyTier: null, walletBalance: 0, registeredAt: '2026-03-13' },
  { id: 5, name: 'Karthik Raj', phone: '9556677880', city: 'Hyderabad', zone: 'MZ-HYD-01', platform: 'Rapido', age: 29, isPolicyActive: true, policyTier: 'PRO', walletBalance: 2100, registeredAt: '2026-03-14' },
  { id: 6, name: 'Sneha Gupta', phone: '9334455667', city: 'Pune', zone: 'MZ-PUN-02', platform: 'Zomato', age: 23, isPolicyActive: true, policyTier: 'STANDARD', walletBalance: 640, registeredAt: '2026-03-15' },
  { id: 7, name: 'Mohammad Ali', phone: '9445566778', city: 'Delhi', zone: 'MZ-DEL-07', platform: 'Uber', age: 34, isPolicyActive: true, policyTier: 'BASIC', walletBalance: 180, registeredAt: '2026-03-16' },
  { id: 8, name: 'Lakshmi Iyer', phone: '9667788990', city: 'Chennai', zone: 'MZ-CHN-03', platform: 'Dunzo', age: 27, isPolicyActive: false, policyTier: null, walletBalance: 0, registeredAt: '2026-03-17' },
  { id: 9, name: 'Rahul Verma', phone: '9778899001', city: 'Mumbai', zone: 'MZ-MUM-05', platform: 'Swiggy', age: 30, isPolicyActive: true, policyTier: 'PRO', walletBalance: 3200, registeredAt: '2026-03-18' },
  { id: 10, name: 'Ananya Das', phone: '9889900112', city: 'Kolkata', zone: 'MZ-KOL-01', platform: 'Rapido', age: 25, isPolicyActive: true, policyTier: 'STANDARD', walletBalance: 920, registeredAt: '2026-03-19' },
]

const ADMIN_USERS = [
  { id: 1, name: 'Saravana Karthiek', email: 'saravana@riskwire.in', role: 'Super Admin', status: 'Active', lastLogin: '2026-03-26 20:30' },
  { id: 2, name: 'Deepan', email: 'deepan@riskwire.in', role: 'Claims Manager', status: 'Active', lastLogin: '2026-03-26 19:45' },
  { id: 3, name: 'DevTrails Bot', email: 'bot@riskwire.in', role: 'System', status: 'Active', lastLogin: '2026-03-26 20:50' },
]

const AUDIT_LOG = [
  { time: '20:48:32', user: 'System', action: 'Actuarial engine ran — 0 triggers detected', type: 'system' },
  { time: '20:30:15', user: 'Saravana K.', action: 'Exported policy report (10 records)', type: 'export' },
  { time: '19:55:00', user: 'System', action: 'ML Oracle pricing sync completed — 9 zones updated', type: 'system' },
  { time: '19:45:22', user: 'Deepan', action: 'Viewed Rider #5 (Karthik Raj) profile', type: 'view' },
  { time: '18:30:00', user: 'System', action: 'Heat trigger detected in MZ-DEL-04 — 2 payouts auto-approved', type: 'trigger' },
  { time: '17:12:45', user: 'Saravana K.', action: 'Approved manual claim CLM-2026-008', type: 'action' },
  { time: '16:00:00', user: 'System', action: 'Daily backup completed — 10 riders, 10 policies, 10 claims', type: 'system' },
  { time: '14:22:10', user: 'Deepan', action: 'Updated zone mapping for MZ-CHN-03', type: 'action' },
  { time: '13:15:00', user: 'System', action: 'New rider registered: Ananya Das (Kolkata)', type: 'system' },
  { time: '12:45:30', user: 'Saravana K.', action: 'Modified risk threshold for MZ-MUM-02', type: 'action' },
  { time: '11:20:00', user: 'System', action: 'Rain trigger detected in MZ-MUM-02 — 3 payouts processed', type: 'trigger' },
  { time: '10:30:00', user: 'System', action: 'Scheduled premium recalculation completed', type: 'system' },
]

const ZONES = [
  { id: 'MZ-DEL-04', city: 'Delhi', area: 'Connaught Place', riders: 2, risk: 'High', temp: '46°C', rainfall: '12mm' },
  { id: 'MZ-MUM-02', city: 'Mumbai', area: 'Andheri', riders: 2, risk: 'Moderate', temp: '34°C', rainfall: '85mm' },
  { id: 'MZ-CHN-01', city: 'Chennai', area: 'T. Nagar', riders: 1, risk: 'High', temp: '44°C', rainfall: '15mm' },
  { id: 'MZ-BLR-03', city: 'Bengaluru', area: 'Koramangala', riders: 1, risk: 'Low', temp: '30°C', rainfall: '22mm' },
  { id: 'MZ-HYD-01', city: 'Hyderabad', area: 'Hitech City', riders: 1, risk: 'Moderate', temp: '42°C', rainfall: '8mm' },
  { id: 'MZ-PUN-02', city: 'Pune', area: 'Hinjewadi', riders: 1, risk: 'Low', temp: '33°C', rainfall: '18mm' },
  { id: 'MZ-DEL-07', city: 'Delhi', area: 'Dwarka', riders: 1, risk: 'High', temp: '47°C', rainfall: '5mm' },
  { id: 'MZ-CHN-03', city: 'Chennai', area: 'OMR', riders: 1, risk: 'Moderate', temp: '43°C', rainfall: '30mm' },
  { id: 'MZ-KOL-01', city: 'Kolkata', area: 'Salt Lake', riders: 1, risk: 'Low', temp: '36°C', rainfall: '45mm' },
]

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

function exportCSV(data, filename) {
  const headers = ['ID', 'Name', 'Phone', 'City', 'Zone', 'Platform', 'Age', 'Policy Active', 'Tier', 'Wallet Balance', 'Registered']
  const rows = data.map(r => [r.id, r.name || '', r.phone || '', r.city || '', r.zone || '', r.platform || '', r.age || 0, r.isPolicyActive ?? false, r.policyTier || '-', r.walletBalance ?? 0, r.registeredAt || ''])
  const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

const PAGE_SIZE = 10

/* ── Main component ────────────────────────────────────────────────────── */
export default function UserManagement() {
  const [activeTab, setActiveTab] = useState('riders')
  const [search, setSearch] = useState('')
  const [riders, setRiders] = useState(MOCK_RIDERS)
  const [toast, setToast] = useState(null)
  const [loading, setLoading] = useState(true)

  // Rider list state
  const [currentPage, setCurrentPage] = useState(1)
  const [filterTier, setFilterTier] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showFilters, setShowFilters] = useState(false)

  // Rider detail modal
  const [selectedRider, setSelectedRider] = useState(null)
  const [suspendedRiders, setSuspendedRiders] = useState(new Set())

  // Audit log filter
  const [auditFilter, setAuditFilter] = useState('all')
  const [showAllAudit, setShowAllAudit] = useState(false)

  const loadRiders = () => {
    setLoading(true)
    fetchRiders()
      .then(data => {
        if (data && data.length > 0) {
          // Normalize API data to match expected shape with safe defaults
          const normalized = data.map(r => ({
            id: r.id,
            name: r.name || 'Unknown',
            phone: r.phone || '—',
            city: r.city || '—',
            zone: r.zone || '—',
            platform: r.platform || '—',
            age: r.age || 0,
            isPolicyActive: r.isPolicyActive ?? false,
            policyTier: r.policyTier || null,
            walletBalance: r.walletBalance ?? 0,
            registeredAt: r.registeredAt || new Date().toISOString().slice(0, 10),
          }))
          setRiders(normalized)
        }
      })
      .catch((err) => { console.warn('Failed to load riders:', err) })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadRiders()
  }, [])

  const filteredRiders = riders.filter(r => {
    const matchesSearch =
      (r.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.city || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.zone || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.phone || '').includes(search)
    if (!matchesSearch) return false
    if (filterTier !== 'all' && r.policyTier !== filterTier) return false
    if (filterStatus === 'active' && !r.isPolicyActive) return false
    if (filterStatus === 'inactive' && r.isPolicyActive) return false
    return true
  })

  // Pagination for riders
  const totalPages = Math.max(1, Math.ceil(filteredRiders.length / PAGE_SIZE))
  const paginatedRiders = filteredRiders.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  useEffect(() => { setCurrentPage(1) }, [search, filterTier, filterStatus])

  // Audit filtering
  const filteredAudit = AUDIT_LOG.filter(log => auditFilter === 'all' || log.type === auditFilter)
  const displayedAudit = showAllAudit ? filteredAudit : filteredAudit.slice(0, 8)

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const handleViewRider = (rider) => {
    setSelectedRider(rider)
  }

  const handleSuspendRider = (rider) => {
    const newSet = new Set(suspendedRiders)
    if (newSet.has(rider.id)) {
      newSet.delete(rider.id)
      showToast(`Rider ${rider.name} has been reactivated`)
    } else {
      newSet.add(rider.id)
      showToast(`Rider ${rider.name} has been suspended`)
    }
    setSuspendedRiders(newSet)
  }

  const handleResetRider = (rider) => {
    showToast(`Wallet reset to ₹500 for ${rider.name}`)
    setRiders(prev => prev.map(r => r.id === rider.id ? { ...r, walletBalance: 500 } : r))
  }

  const hasActiveFilters = filterTier !== 'all' || filterStatus !== 'all'

  const TABS = [
    { id: 'riders', label: 'Rider Registry', count: riders.length },
    { id: 'admins', label: 'Admin Roles', count: ADMIN_USERS.length },
    { id: 'audit', label: 'Audit Log', count: AUDIT_LOG.length },
    { id: 'zones', label: 'Zone Management', count: ZONES.length },
  ]

  return (
    <div className="relative">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-gw-header text-white px-4 py-2.5 rounded shadow-lg text-[12px] font-medium flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-400" />
          {toast}
        </div>
      )}

      {/* Rider Detail Modal */}
      {selectedRider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setSelectedRider(null)}>
          <div className="bg-white rounded-lg shadow-2xl w-[480px] max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-gw-border bg-gw-blue text-white rounded-t-lg">
              <span className="font-semibold text-[14px]">Rider Details</span>
              <button onClick={() => setSelectedRider(null)} className="text-white/70 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gw-blue text-white flex items-center justify-center text-[18px] font-bold">
                  {selectedRider.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <div className="text-[16px] font-bold text-gw-text">{selectedRider.name}</div>
                  <div className="text-[12px] text-gw-text-muted">R-{String(selectedRider.id).padStart(4, '0')} · {selectedRider.platform}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Phone', value: selectedRider.phone },
                  { label: 'Age', value: `${selectedRider.age} years` },
                  { label: 'City', value: selectedRider.city },
                  { label: 'Zone', value: selectedRider.zone },
                  { label: 'Platform', value: selectedRider.platform },
                  { label: 'Policy Tier', value: selectedRider.policyTier || 'None' },
                  { label: 'Wallet Balance', value: `₹${(selectedRider.walletBalance ?? 0).toLocaleString()}` },
                  { label: 'Registered', value: selectedRider.registeredAt },
                ].map(item => (
                  <div key={item.label} className="bg-gw-bg rounded p-2.5">
                    <div className="text-[10px] text-gw-text-muted font-medium uppercase">{item.label}</div>
                    <div className="text-[13px] font-semibold text-gw-text mt-0.5">{item.value}</div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 pt-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded text-[11px] font-semibold ${
                  selectedRider.isPolicyActive ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-500 border border-gray-200'
                }`}>
                  {selectedRider.isPolicyActive ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                  {selectedRider.isPolicyActive ? 'Policy Active' : 'No Active Policy'}
                </span>
                {suspendedRiders.has(selectedRider.id) && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded text-[10px] font-bold border border-red-200">
                    <Ban className="w-3 h-3" /> SUSPENDED
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cold-start banner — shown until real data arrives */}
      {loading && (
        <div className="flex items-center gap-2.5 px-4 py-2.5 mb-4 bg-blue-50 border border-blue-200 rounded text-[12px] text-blue-800">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          <span><span className="font-semibold">Connecting to server…</span> Showing cached data. Live rider records will replace this shortly.</span>
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
            onClick={() => { exportCSV(riders, `riders-${new Date().toISOString().slice(0,10)}.csv`); showToast('Exported ' + riders.length + ' riders to CSV') }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gw-border rounded text-[11.5px] font-medium text-gw-text hover:bg-gray-50"
          >
            <Download className="w-3.5 h-3.5" /> Export
          </button>
          <button
            onClick={() => { loadRiders(); showToast('Data refreshed') }}
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
            className={`px-4 py-2.5 text-[12px] font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-gw-blue text-gw-blue bg-blue-50/50'
                : 'border-transparent text-gw-text-muted hover:text-gw-text hover:bg-gray-50'
            }`}
          >
            {tab.label}
            <span className={`ml-1.5 px-1.5 py-0.5 rounded text-[9.5px] font-bold ${
              activeTab === tab.id ? 'bg-gw-blue text-white' : 'bg-gray-100 text-gray-500'
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
                  value={search} onChange={e => setSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 border border-gw-border rounded text-[11.5px] w-[240px] focus:outline-none focus:border-gw-blue/50"
                />
              </div>
              <span className="text-[11px] text-gw-text-muted">{filteredRiders.length} of {riders.length} riders</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-1 px-2.5 py-1.5 border rounded text-[11px] transition-colors ${
                  hasActiveFilters
                    ? 'bg-gw-blue/10 border-gw-blue text-gw-blue font-semibold'
                    : 'border-gw-border text-gw-text-muted hover:bg-gray-50'
                }`}
              >
                <Filter className="w-3 h-3" />
                Filter{hasActiveFilters ? ' ●' : ''}
                <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
              {hasActiveFilters && (
                <button onClick={() => { setFilterTier('all'); setFilterStatus('all') }} className="flex items-center gap-1 px-2 py-1 text-[10px] text-red-500 hover:text-red-700 font-medium">
                  <X className="w-3 h-3" /> Clear
                </button>
              )}
            </div>
          </div>

          {/* Filter panel */}
          {showFilters && (
            <div className="px-4 py-3 border-b border-gw-border bg-gw-bg/60 flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-[10.5px] text-gw-text-muted font-medium">Tier:</span>
                {['all', 'PRO', 'STANDARD', 'BASIC'].map(t => (
                  <button key={t} onClick={() => setFilterTier(t)}
                    className={`px-2 py-1 rounded text-[10.5px] font-medium transition-colors ${filterTier === t ? 'bg-gw-blue text-white' : 'bg-white border border-gw-border text-gw-text-muted hover:bg-gray-50'}`}
                  >{t === 'all' ? 'All' : t}</button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10.5px] text-gw-text-muted font-medium">Status:</span>
                {['all', 'active', 'inactive'].map(s => (
                  <button key={s} onClick={() => setFilterStatus(s)}
                    className={`px-2 py-1 rounded text-[10.5px] font-medium transition-colors ${filterStatus === s ? 'bg-gw-blue text-white' : 'bg-white border border-gw-border text-gw-text-muted hover:bg-gray-50'}`}
                  >{s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}</button>
                ))}
              </div>
            </div>
          )}

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
                {paginatedRiders.map((r, i) => (
                  <tr key={r.id} className={`border-b border-gw-border hover:bg-blue-50/30 transition-colors ${i % 2 === 1 ? 'bg-gray-50/50' : ''} ${suspendedRiders.has(r.id) ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-2.5 font-mono text-gw-blue font-semibold">R-{String(r.id).padStart(4, '0')}</td>
                    <td className="px-4 py-2.5 font-medium text-gw-text">
                      {r.name}
                      {suspendedRiders.has(r.id) && <span className="ml-1.5 px-1 py-0.5 bg-red-100 text-red-600 rounded text-[8px] font-bold">SUSPENDED</span>}
                    </td>
                    <td className="px-4 py-2.5 text-gw-text-muted font-mono">{r.phone}</td>
                    <td className="px-4 py-2.5">
                      <div className="text-gw-text">{r.city}</div>
                      <div className="text-[10px] text-gw-text-muted">{r.zone}</div>
                    </td>
                    <td className="px-4 py-2.5 text-gw-text">{r.platform}</td>
                    <td className="px-4 py-2.5"><TierBadge tier={r.policyTier} /></td>
                    <td className="px-4 py-2.5"><StatusDot active={r.isPolicyActive} /></td>
                    <td className="px-4 py-2.5 text-right font-mono font-medium text-gw-text">₹{(r.walletBalance ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-gw-text-muted">{r.registeredAt}</td>
                    <td className="px-4 py-2.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => handleViewRider(r)} className="p-1 rounded hover:bg-blue-100 transition-colors" title="View details">
                          <Eye className="w-3.5 h-3.5 text-gw-blue" />
                        </button>
                        <button onClick={() => handleSuspendRider(r)} className="p-1 rounded hover:bg-red-100 transition-colors" title={suspendedRiders.has(r.id) ? 'Reactivate' : 'Suspend'}>
                          <Ban className={`w-3.5 h-3.5 ${suspendedRiders.has(r.id) ? 'text-red-600' : 'text-red-400'}`} />
                        </button>
                        <button onClick={() => handleResetRider(r)} className="p-1 rounded hover:bg-green-100 transition-colors" title="Reset wallet to ₹500">
                          <RotateCcw className="w-3.5 h-3.5 text-green-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination footer */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-gw-bg border-t border-gw-border text-[11px] text-gw-text-muted">
            <span>Page {currentPage} of {totalPages} · Showing {paginatedRiders.length} of {filteredRiders.length} riders</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2 py-1 border border-gw-border rounded bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >‹ Prev</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).slice(
                Math.max(0, currentPage - 3), Math.min(totalPages, currentPage + 2)
              ).map(p => (
                <button key={p} onClick={() => setCurrentPage(p)}
                  className={`px-2 py-1 border border-gw-border rounded transition-colors ${p === currentPage ? 'bg-gw-blue text-white font-semibold' : 'bg-white hover:bg-gray-50'}`}
                >{p}</button>
              ))}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-2 py-1 border border-gw-border rounded bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
                {ADMIN_USERS.map((u, i) => (
                  <tr key={u.id} className={`border-b border-gw-border ${i % 2 === 1 ? 'bg-gray-50/50' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-gw-blue text-white flex items-center justify-center text-[10px] font-bold">
                          {u.name.split(' ').map(w => w[0]).join('').slice(0,2)}
                        </div>
                        <span className="font-medium text-gw-text">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gw-text-muted">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10.5px] font-semibold border ${
                        u.role === 'Super Admin' ? 'bg-purple-100 text-purple-700 border-purple-200' :
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
            <div className="flex items-center gap-2">
              <div className="flex bg-gray-100 rounded p-0.5">
                {[
                  { key: 'all', label: 'All' },
                  { key: 'system', label: 'System' },
                  { key: 'trigger', label: 'Triggers' },
                  { key: 'action', label: 'Actions' },
                  { key: 'export', label: 'Exports' },
                  { key: 'view', label: 'Views' },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setAuditFilter(tab.key)}
                    className={`px-2 py-1 text-[10px] font-medium rounded transition-colors ${
                      auditFilter === tab.key ? 'bg-white text-gw-text shadow-sm' : 'text-gw-text-muted hover:text-gw-text'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="divide-y divide-gw-border">
            {displayedAudit.map((log, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50/50">
                <div className="mt-0.5"><AuditIcon type={log.type} /></div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11.5px] text-gw-text">{log.action}</div>
                  <div className="text-[10px] text-gw-text-muted mt-0.5">by {log.user}</div>
                </div>
                <span className="text-[10px] text-gw-text-muted font-mono shrink-0">{log.time}</span>
              </div>
            ))}
            {displayedAudit.length === 0 && (
              <div className="px-4 py-12 text-center text-gw-text-muted text-[13px]">No audit entries match this filter</div>
            )}
          </div>
          <div className="px-4 py-2.5 bg-gw-bg border-t border-gw-border text-[11px] text-gw-text-muted text-center">
            Showing {displayedAudit.length} of {filteredAudit.length} entries ·{' '}
            <button
              onClick={() => setShowAllAudit(!showAllAudit)}
              className="text-gw-blue font-semibold hover:underline"
            >
              {showAllAudit ? 'Show less' : `View full history (${filteredAudit.length})`}
            </button>
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
                {ZONES.map((z, i) => {
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
