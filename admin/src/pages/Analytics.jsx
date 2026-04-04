import { useState } from 'react'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp, TrendingDown, Users, Shield, Zap, Wallet, Clock, AlertTriangle, RefreshCw, ChevronDown, Thermometer, CloudRain } from 'lucide-react'

/* ── Sample data ── */
const KPI_DATA = [
  { label: 'Total Riders', value: '10', change: '+3', up: true, icon: Users, color: '#0055A5', bg: '#EFF6FF' },
  { label: 'Active Policies', value: '8', change: '+2', up: true, icon: Shield, color: '#059669', bg: '#ECFDF5' },
  { label: 'Claims (24h)', value: '3', change: '+1', up: true, icon: Zap, color: '#D97706', bg: '#FFFBEB' },
  { label: 'Total Payouts', value: '₹26,400', change: '₹4,200', up: true, icon: Wallet, color: '#7C3AED', bg: '#F5F3FF' },
  { label: 'Avg Processing', value: '2.8s', change: '-0.3s', up: false, icon: Clock, color: '#0891B2', bg: '#ECFEFF' },
  { label: 'Loss Ratio', value: '34.2%', change: '-2.1%', up: false, icon: TrendingDown, color: '#DC2626', bg: '#FEF2F2' },
]

const CLAIMS_BY_ZONE = [
  { zone: 'DEL-04', claims: 8, payouts: 12400 },
  { zone: 'MUM-02', claims: 5, payouts: 8200 },
  { zone: 'CHN-01', claims: 6, payouts: 9800 },
  { zone: 'BLR-03', claims: 2, payouts: 2400 },
  { zone: 'HYD-01', claims: 4, payouts: 6600 },
  { zone: 'PUN-02', claims: 1, payouts: 1200 },
  { zone: 'DEL-07', claims: 7, payouts: 11200 },
  { zone: 'CHN-03', claims: 3, payouts: 4800 },
  { zone: 'KOL-01', claims: 2, payouts: 3000 },
]

const TRIGGER_DISTRIBUTION = [
  { name: 'Heat (≥45°C)', value: 62, color: '#DC2626' },
  { name: 'Rain (≥80mm)', value: 28, color: '#0066CC' },
  { name: 'Flood', value: 7, color: '#7C3AED' },
  { name: 'Combined', value: 3, color: '#D97706' },
]

const PLAN_DISTRIBUTION = [
  { name: 'Basic', value: 30, color: '#059669' },
  { name: 'Standard', value: 45, color: '#0066CC' },
  { name: 'Pro', value: 25, color: '#D97706' },
]

const PAYOUT_TREND = [
  { day: 'Mon', amount: 2400, claims: 3 },
  { day: 'Tue', amount: 4200, claims: 5 },
  { day: 'Wed', amount: 1800, claims: 2 },
  { day: 'Thu', amount: 6600, claims: 7 },
  { day: 'Fri', amount: 3200, claims: 4 },
  { day: 'Sat', amount: 5400, claims: 6 },
  { day: 'Sun', amount: 2800, claims: 3 },
]

const REVENUE_DATA = [
  { month: 'Jan', premiums: 42000, payouts: 15200 },
  { month: 'Feb', premiums: 48000, payouts: 22400 },
  { month: 'Mar', premiums: 56000, payouts: 26400 },
]

const ZONE_RISK = [
  { zone: 'MZ-DEL-04', city: 'Delhi', riskScore: 87, heatDays: 18, rainDays: 2, totalClaims: 8, status: 'Critical' },
  { zone: 'MZ-DEL-07', city: 'Delhi', riskScore: 82, heatDays: 16, rainDays: 1, totalClaims: 7, status: 'Critical' },
  { zone: 'MZ-CHN-01', city: 'Chennai', riskScore: 71, heatDays: 12, rainDays: 4, totalClaims: 6, status: 'High' },
  { zone: 'MZ-MUM-02', city: 'Mumbai', riskScore: 65, heatDays: 5, rainDays: 14, totalClaims: 5, status: 'High' },
  { zone: 'MZ-HYD-01', city: 'Hyderabad', riskScore: 58, heatDays: 10, rainDays: 3, totalClaims: 4, status: 'Moderate' },
  { zone: 'MZ-CHN-03', city: 'Chennai', riskScore: 52, heatDays: 8, rainDays: 6, totalClaims: 3, status: 'Moderate' },
  { zone: 'MZ-BLR-03', city: 'Bengaluru', riskScore: 28, heatDays: 2, rainDays: 5, totalClaims: 2, status: 'Low' },
  { zone: 'MZ-PUN-02', city: 'Pune', riskScore: 22, heatDays: 3, rainDays: 4, totalClaims: 1, status: 'Low' },
  { zone: 'MZ-KOL-01', city: 'Kolkata', riskScore: 35, heatDays: 4, rainDays: 8, totalClaims: 2, status: 'Moderate' },
]

const PREDICTIVE_FACTORS = [
  { name: 'Zone Temperature Avg', value: '43.2°C', influence: 110, contribution: 100 },
  { name: 'Historical Claim Frequency', value: '3.4/week', influence: 65, contribution: 59 },
  { name: 'Seasonal Monsoon Index', value: '0.72', influence: 40, contribution: 36 },
  { name: 'Rider Density per Zone', value: '1.1', influence: -15, contribution: 14 },
]

/* ── Component ── */
export default function Analytics() {
  const [activeTab, setActiveTab] = useState('overview')
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(new Date())

  const handleRefresh = () => {
    setRefreshing(true)
    setTimeout(() => {
      setRefreshing(false)
      setLastUpdated(new Date())
    }, 1200)
  }

  const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'claims', label: 'Claims Analytics' },
    { id: 'risk', label: 'Risk Factors' },
    { id: 'predictive', label: 'Predictive Analytics' },
  ]

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-[18px] font-bold text-gw-text">Analytics Dashboard</h1>
          <p className="text-[11.5px] text-gw-text-muted mt-0.5">Real-time operational metrics · Actuarial insights · Risk analysis</p>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <span className="text-gw-text-muted">Last updated:</span>
          <span className="font-mono font-semibold text-gw-text">{lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gw-blue text-white rounded text-[11.5px] font-semibold hover:bg-blue-700 ml-2 disabled:opacity-60 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
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
          </button>
        ))}
      </div>

      {/* ───── OVERVIEW TAB ───── */}
      {activeTab === 'overview' && (
        <div className="bg-white border border-t-0 border-gw-border rounded-b p-4 space-y-5">
          {/* KPI Cards */}
          <div className="grid grid-cols-6 gap-3">
            {KPI_DATA.map(kpi => {
              const Icon = kpi.icon
              return (
                <div key={kpi.label} className="border border-gw-border rounded-lg p-3 bg-white hover:shadow-sm transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: kpi.bg }}>
                      <Icon className="w-4 h-4" style={{ color: kpi.color }} />
                    </div>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${kpi.up ? 'text-green-700 bg-green-50' : 'text-blue-700 bg-blue-50'}`}>
                      {kpi.up ? '↑' : '↓'} {kpi.change}
                    </span>
                  </div>
                  <div className="text-[18px] font-bold text-gw-text">{kpi.value}</div>
                  <div className="text-[10px] text-gw-text-muted mt-0.5">{kpi.label}</div>
                </div>
              )
            })}
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-2 gap-4">
            {/* Payout Trend */}
            <div className="border border-gw-border rounded-lg p-4">
              <h3 className="text-[13px] font-bold text-gw-text mb-3">Payout Trend — Last 7 Days</h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={PAYOUT_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E9F2" />
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="amount" stroke="#0055A5" fill="#DBEAFE" strokeWidth={2} name="Payout ₹" />
                  <Area type="monotone" dataKey="claims" stroke="#D97706" fill="#FEF3C7" strokeWidth={2} name="Claims" yAxisId={0} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Revenue */}
            <div className="border border-gw-border rounded-lg p-4">
              <h3 className="text-[13px] font-bold text-gw-text mb-3">Revenue vs Payouts — Monthly</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={REVENUE_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E9F2" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="premiums" fill="#059669" name="Premiums ₹" radius={[4,4,0,0]} />
                  <Bar dataKey="payouts" fill="#DC2626" name="Payouts ₹" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-3 gap-4">
            {/* Trigger Distribution */}
            <div className="border border-gw-border rounded-lg p-4">
              <h3 className="text-[13px] font-bold text-gw-text mb-3">Weather Trigger Distribution</h3>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={TRIGGER_DISTRIBUTION} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {TRIGGER_DISTRIBUTION.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Plan Distribution */}
            <div className="border border-gw-border rounded-lg p-4">
              <h3 className="text-[13px] font-bold text-gw-text mb-3">Plan Distribution</h3>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={PLAN_DISTRIBUTION} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {PLAN_DISTRIBUTION.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-2">
                {PLAN_DISTRIBUTION.map(p => (
                  <span key={p.name} className="flex items-center gap-1.5 text-[10px] text-gw-text-muted">
                    <span className="w-2.5 h-2.5 rounded" style={{ backgroundColor: p.color }} />
                    {p.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="border border-gw-border rounded-lg p-4 space-y-3">
              <h3 className="text-[13px] font-bold text-gw-text mb-1">Operational Summary</h3>
              {[
                { label: 'Auto-Approval Rate', value: '97.3%', bar: 97, color: '#059669' },
                { label: 'Claim Processing SLA', value: '99.1%', bar: 99, color: '#0055A5' },
                { label: 'Oracle API Uptime', value: '98.6%', bar: 98, color: '#7C3AED' },
                { label: 'Trigger Accuracy', value: '94.8%', bar: 95, color: '#D97706' },
              ].map(s => (
                <div key={s.label}>
                  <div className="flex items-center justify-between text-[10.5px] mb-1">
                    <span className="text-gw-text-muted">{s.label}</span>
                    <span className="font-bold text-gw-text">{s.value}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${s.bar}%`, backgroundColor: s.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ───── CLAIMS TAB ───── */}
      {activeTab === 'claims' && (
        <div className="bg-white border border-t-0 border-gw-border rounded-b p-4 space-y-4">
          <div className="border border-gw-border rounded-lg p-4">
            <h3 className="text-[13px] font-bold text-gw-text mb-3">Claims by Zone — Last 30 Days</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={CLAIMS_BY_ZONE}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E9F2" />
                <XAxis dataKey="zone" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 11 }} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="claims" fill="#0055A5" name="Claims Count" radius={[4,4,0,0]} />
                <Bar dataKey="payouts" fill="#D97706" name="Payout ₹" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Claims table */}
          <div className="border border-gw-border rounded-lg overflow-hidden">
            <div className="px-4 py-2.5 bg-gw-bg border-b border-gw-border">
              <span className="text-[12px] font-semibold text-gw-text">Zone-wise Claim Details</span>
            </div>
            <table className="w-full text-[11.5px]">
              <thead>
                <tr className="bg-gw-bg border-b border-gw-border">
                  <th className="text-left px-4 py-2 font-semibold text-gw-text-muted">Zone</th>
                  <th className="text-center px-4 py-2 font-semibold text-gw-text-muted">Total Claims</th>
                  <th className="text-right px-4 py-2 font-semibold text-gw-text-muted">Total Payouts</th>
                  <th className="text-right px-4 py-2 font-semibold text-gw-text-muted">Avg Payout</th>
                  <th className="text-left px-4 py-2 font-semibold text-gw-text-muted">Claim Density</th>
                </tr>
              </thead>
              <tbody>
                {CLAIMS_BY_ZONE.sort((a, b) => b.claims - a.claims).map((z, i) => (
                  <tr key={z.zone} className={`border-b border-gw-border ${i % 2 === 1 ? 'bg-gray-50/50' : ''}`}>
                    <td className="px-4 py-2.5 font-mono font-semibold text-gw-blue">MZ-{z.zone}</td>
                    <td className="px-4 py-2.5 text-center font-bold">{z.claims}</td>
                    <td className="px-4 py-2.5 text-right font-mono">₹{z.payouts.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-right font-mono">₹{Math.round(z.payouts / z.claims).toLocaleString()}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden max-w-[120px]">
                          <div className="h-full bg-gw-blue rounded-full" style={{ width: `${(z.claims / 8) * 100}%` }} />
                        </div>
                        <span className="text-[10px] text-gw-text-muted">{((z.claims / 8) * 100).toFixed(0)}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ───── RISK TAB ───── */}
      {activeTab === 'risk' && (
        <div className="bg-white border border-t-0 border-gw-border rounded-b p-4 space-y-4">
          {/* Info bar */}
          <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <div className="text-[11px] text-amber-800">
              <span className="font-semibold">Risk Assessment:</span> Zone risk scores are computed by the ML Oracle using weighted factors: temperature history (40%), rainfall patterns (30%), claim frequency (20%), and seasonal index (10%).
            </div>
          </div>

          {/* Risk matrix */}
          <div className="border border-gw-border rounded-lg overflow-hidden">
            <div className="px-4 py-2.5 bg-gw-header text-white flex items-center justify-between">
              <span className="text-[12px] font-semibold">Zone Risk Matrix — ML Oracle Computed</span>
              <span className="text-[10px] text-blue-300">Updated hourly by actuarial engine</span>
            </div>
            <table className="w-full text-[11.5px]">
              <thead>
                <tr className="bg-gw-bg border-b border-gw-border">
                  <th className="text-left px-4 py-2 font-semibold text-gw-text-muted">Zone</th>
                  <th className="text-left px-4 py-2 font-semibold text-gw-text-muted">City</th>
                  <th className="text-center px-4 py-2 font-semibold text-gw-text-muted">Risk Score</th>
                  <th className="text-center px-4 py-2 font-semibold text-gw-text-muted">Status</th>
                  <th className="text-center px-4 py-2 font-semibold text-gw-text-muted">
                    <span className="flex items-center gap-1 justify-center"><Thermometer className="w-3 h-3" /> Heat Days</span>
                  </th>
                  <th className="text-center px-4 py-2 font-semibold text-gw-text-muted">
                    <span className="flex items-center gap-1 justify-center"><CloudRain className="w-3 h-3" /> Rain Days</span>
                  </th>
                  <th className="text-center px-4 py-2 font-semibold text-gw-text-muted">Claims</th>
                  <th className="text-left px-4 py-2 font-semibold text-gw-text-muted">Risk Indicator</th>
                </tr>
              </thead>
              <tbody>
                {ZONE_RISK.map((z, i) => {
                  const statusColor = z.status === 'Critical' ? 'bg-red-100 text-red-700 border-red-200' :
                    z.status === 'High' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                    z.status === 'Moderate' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                    'bg-green-100 text-green-700 border-green-200'
                  const barColor = z.riskScore >= 80 ? '#DC2626' : z.riskScore >= 60 ? '#D97706' : z.riskScore >= 40 ? '#EAB308' : '#059669'
                  return (
                    <tr key={z.zone} className={`border-b border-gw-border ${i % 2 === 1 ? 'bg-gray-50/50' : ''}`}>
                      <td className="px-4 py-2.5 font-mono font-semibold text-gw-blue">{z.zone}</td>
                      <td className="px-4 py-2.5 text-gw-text">{z.city}</td>
                      <td className="px-4 py-2.5 text-center font-bold text-gw-text">{z.riskScore}</td>
                      <td className="px-4 py-2.5 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statusColor}`}>{z.status}</span>
                      </td>
                      <td className="px-4 py-2.5 text-center font-mono">{z.heatDays}</td>
                      <td className="px-4 py-2.5 text-center font-mono">{z.rainDays}</td>
                      <td className="px-4 py-2.5 text-center font-bold">{z.totalClaims}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${z.riskScore}%`, backgroundColor: barColor }} />
                          </div>
                          <span className="text-[10px] font-bold text-gw-text-muted w-8">{z.riskScore}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ───── PREDICTIVE TAB ───── */}
      {activeTab === 'predictive' && (
        <div className="bg-white border border-t-0 border-gw-border rounded-b p-4 space-y-4">
          {/* Profitability section */}
          <div className="grid grid-cols-2 gap-4">
            <div className="border border-gw-border rounded-lg p-4">
              <h3 className="text-[13px] font-bold text-gw-text mb-3">Profitability</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-2.5 bg-gray-50 rounded">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-[11.5px] text-gw-text flex-1">Expected Loss Ratio</span>
                  <span className="text-[11.5px] font-bold text-gw-text">32% to 38%</span>
                </div>
                <div className="flex items-center gap-3 p-2.5 bg-gray-50 rounded">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-[11.5px] text-gw-text flex-1">Likelihood of Large Loss</span>
                  <span className="text-[11.5px] font-bold text-gw-text">8% to 12%</span>
                </div>
                <div className="flex items-center gap-3 p-2.5 bg-amber-50 rounded border border-amber-100">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-[11.5px] text-amber-800 flex-1">Warning</span>
                  <span className="text-[11.5px] font-medium text-amber-800">Monsoon risk increase expected — adjust premiums by 8%</span>
                </div>
              </div>
            </div>

            <div className="border border-gw-border rounded-lg p-4">
              <h3 className="text-[13px] font-bold text-gw-text mb-3">Retention & Growth</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-2.5 bg-gray-50 rounded">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-[11.5px] text-gw-text flex-1">Current Renewal Rate</span>
                  <span className="text-[11.5px] font-bold text-gw-text">82%</span>
                </div>
                <div className="flex items-center gap-3 p-2.5 bg-gray-50 rounded">
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                  <span className="text-[11.5px] text-gw-text flex-1">3-Month Retention Forecast</span>
                  <span className="text-[11.5px] font-bold text-gw-text">74% to 78%</span>
                </div>
                <div className="flex items-center gap-3 p-2.5 bg-green-50 rounded border border-green-100">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-[11.5px] text-green-800 flex-1">Info</span>
                  <span className="text-[11.5px] font-medium text-green-800">Recommendation: Offer 5% loyalty discount after 3 renewals</span>
                </div>
              </div>
            </div>
          </div>

          {/* Predictive factors */}
          <div className="border border-gw-border rounded-lg overflow-hidden">
            <div className="px-4 py-2.5 bg-gw-bg border-b border-gw-border">
              <span className="text-[12px] font-semibold text-gw-text">Predictive Factors — ML Oracle Model Weights</span>
            </div>
            <table className="w-full text-[11.5px]">
              <thead>
                <tr className="bg-gw-bg border-b border-gw-border">
                  <th className="text-left px-4 py-2 font-semibold text-gw-text-muted">Predictor Name ⇅</th>
                  <th className="text-left px-4 py-2 font-semibold text-gw-text-muted">Predictor Value ⇅</th>
                  <th className="text-left px-4 py-2 font-semibold text-gw-text-muted">Predictor Influence ⇅</th>
                  <th className="text-left px-4 py-2 font-semibold text-gw-text-muted">Contribution To Total Influence ⇅</th>
                </tr>
              </thead>
              <tbody>
                {PREDICTIVE_FACTORS.map((f, i) => {
                  const barColor = f.influence > 50 ? '#DC2626' : f.influence > 0 ? '#059669' : '#0066CC'
                  return (
                    <tr key={f.name} className={`border-b border-gw-border ${i % 2 === 1 ? 'bg-gray-50/50' : ''}`}>
                      <td className="px-4 py-3 font-medium text-gw-text">{f.name}</td>
                      <td className="px-4 py-3 font-mono text-gw-text">{f.value}</td>
                      <td className="px-4 py-3 font-mono font-bold" style={{ color: f.influence < 0 ? '#0066CC' : '#333' }}>{f.influence}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-5 rounded" style={{ width: `${f.contribution}%`, backgroundColor: barColor, minWidth: 8 }} />
                          <span className="text-[11px] font-bold text-gw-text">{f.contribution}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
