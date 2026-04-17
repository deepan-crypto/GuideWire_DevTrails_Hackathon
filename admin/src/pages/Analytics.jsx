import { useState, useEffect } from 'react'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp, TrendingDown, Users, Shield, Zap, Wallet, Clock, AlertTriangle, RefreshCw, ChevronDown, Thermometer, CloudRain, Loader2 } from 'lucide-react'
import { fetchAnalytics } from '../services/api'

/* ── Icon map for KPIs ── */
const ICON_MAP = {
  'Total Riders': Users,
  'Active Policies': Shield,
  'Claims (24h)': Zap,
  'Total Payouts': Wallet,
  'Auto-Approval': Clock,
  'Loss Ratio': TrendingDown,
}
const COLOR_MAP = {
  'Total Riders': { color: '#0055A5', bg: '#EFF6FF' },
  'Active Policies': { color: '#059669', bg: '#ECFDF5' },
  'Claims (24h)': { color: '#D97706', bg: '#FFFBEB' },
  'Total Payouts': { color: '#7C3AED', bg: '#F5F3FF' },
  'Auto-Approval': { color: '#0891B2', bg: '#ECFEFF' },
  'Loss Ratio': { color: '#DC2626', bg: '#FEF2F2' },
}

/* ── Component ── */
export default function Analytics() {
  const [activeTab, setActiveTab] = useState('overview')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    setLoading(true)
    const result = await fetchAnalytics()
    setData(result)
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'claims', label: 'Claims Analytics' },
    { id: 'risk', label: 'Risk Factors' },
    { id: 'predictive', label: 'Predictive Analytics' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gw-blue" />
        <span className="ml-3 text-gw-text-muted text-[13px]">Loading analytics…</span>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gw-text-muted">
        <AlertTriangle className="w-8 h-8 mb-2 text-amber-500" />
        <span className="text-[13px]">Could not load analytics data.</span>
        <button onClick={loadData} className="mt-3 px-4 py-1.5 bg-gw-blue text-white rounded text-[11.5px] font-semibold hover:bg-blue-700">
          Retry
        </button>
      </div>
    )
  }

  const { kpi = [], claimsByZone = [], triggerDistribution = [], planDistribution = [], payoutTrend = [], revenueData = [], zoneRisk = [], operationalSummary = {} } = data

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
          <span className="font-mono font-semibold text-gw-text">{new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
          <button onClick={loadData} className="flex items-center gap-1.5 px-3 py-1.5 bg-gw-blue text-white rounded text-[11.5px] font-semibold hover:bg-blue-700 ml-2">
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
          </button>
        ))}
      </div>

      {/* ───── OVERVIEW TAB ───── */}
      {activeTab === 'overview' && (
        <div className="bg-white border border-t-0 border-gw-border rounded-b p-4 space-y-5">
          {/* KPI Cards */}
          <div className="grid grid-cols-6 gap-3">
            {kpi.map(k => {
              const Icon = ICON_MAP[k.label] || Users
              const colors = COLOR_MAP[k.label] || { color: '#333', bg: '#F5F5F5' }
              return (
                <div key={k.label} className="border border-gw-border rounded-lg p-3 bg-white hover:shadow-sm transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: colors.bg }}>
                      <Icon className="w-4 h-4" style={{ color: colors.color }} />
                    </div>
                    {k.change && (
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${k.up ? 'text-green-700 bg-green-50' : 'text-blue-700 bg-blue-50'}`}>
                        {k.up ? '↑' : '↓'} {k.change}
                      </span>
                    )}
                  </div>
                  <div className="text-[18px] font-bold text-gw-text">{k.value}</div>
                  <div className="text-[10px] text-gw-text-muted mt-0.5">{k.label}</div>
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
                <AreaChart data={payoutTrend}>
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
              {revenueData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E9F2" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ fontSize: 11 }} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Bar dataKey="premiums" fill="#059669" name="Premiums ₹" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="payouts" fill="#DC2626" name="Payouts ₹" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-[12px] text-gw-text-muted">No billing data yet</div>
              )}
            </div>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-3 gap-4">
            {/* Trigger Distribution */}
            <div className="border border-gw-border rounded-lg p-4">
              <h3 className="text-[13px] font-bold text-gw-text mb-3">Weather Trigger Distribution</h3>
              {triggerDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={triggerDistribution} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {triggerDistribution.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[180px] flex items-center justify-center text-[12px] text-gw-text-muted">No claims data yet</div>
              )}
            </div>

            {/* Plan Distribution */}
            <div className="border border-gw-border rounded-lg p-4">
              <h3 className="text-[13px] font-bold text-gw-text mb-3">Plan Distribution</h3>
              {planDistribution.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={planDistribution} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {planDistribution.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex justify-center gap-4 mt-2">
                    {planDistribution.map(p => (
                      <span key={p.name} className="flex items-center gap-1.5 text-[10px] text-gw-text-muted">
                        <span className="w-2.5 h-2.5 rounded" style={{ backgroundColor: p.color }} />
                        {p.name}
                      </span>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-[180px] flex items-center justify-center text-[12px] text-gw-text-muted">No policies yet</div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="border border-gw-border rounded-lg p-4 space-y-3">
              <h3 className="text-[13px] font-bold text-gw-text mb-1">Operational Summary</h3>
              {[
                { label: 'Auto-Approval Rate', value: `${operationalSummary.autoApprovalRate || 0}%`, bar: operationalSummary.autoApprovalRate || 0, color: '#059669' },
                { label: 'Claim Processing SLA', value: `${operationalSummary.claimProcessingSLA || 0}%`, bar: operationalSummary.claimProcessingSLA || 0, color: '#0055A5' },
                { label: 'Oracle API Uptime', value: `${operationalSummary.oracleUptime || 0}%`, bar: operationalSummary.oracleUptime || 0, color: '#7C3AED' },
                { label: 'Trigger Accuracy', value: `${operationalSummary.triggerAccuracy || 0}%`, bar: operationalSummary.triggerAccuracy || 0, color: '#D97706' },
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
          {claimsByZone.length > 0 ? (
            <>
              <div className="border border-gw-border rounded-lg p-4">
                <h3 className="text-[13px] font-bold text-gw-text mb-3">Claims by Zone — Last 30 Days</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={claimsByZone}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E9F2" />
                    <XAxis dataKey="zone" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ fontSize: 11 }} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Bar dataKey="claims" fill="#0055A5" name="Claims Count" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="payouts" fill="#D97706" name="Payout ₹" radius={[4, 4, 0, 0]} />
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
                    {claimsByZone.sort((a, b) => b.claims - a.claims).map((z, i) => {
                      const maxClaims = Math.max(...claimsByZone.map(c => c.claims), 1)
                      return (
                        <tr key={z.zone} className={`border-b border-gw-border ${i % 2 === 1 ? 'bg-gray-50/50' : ''}`}>
                          <td className="px-4 py-2.5 font-mono font-semibold text-gw-blue">MZ-{z.zone}</td>
                          <td className="px-4 py-2.5 text-center font-bold">{z.claims}</td>
                          <td className="px-4 py-2.5 text-right font-mono">₹{z.payouts.toLocaleString()}</td>
                          <td className="px-4 py-2.5 text-right font-mono">₹{z.claims > 0 ? Math.round(z.payouts / z.claims).toLocaleString() : 0}</td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden max-w-[120px]">
                                <div className="h-full bg-gw-blue rounded-full" style={{ width: `${(z.claims / maxClaims) * 100}%` }} />
                              </div>
                              <span className="text-[10px] text-gw-text-muted">{((z.claims / maxClaims) * 100).toFixed(0)}%</span>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="h-48 flex items-center justify-center text-[13px] text-gw-text-muted">No claims data available yet.</div>
          )}
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
          {zoneRisk.length > 0 ? (
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
                    <th className="text-center px-4 py-2 font-semibold text-gw-text-muted">Claims</th>
                    <th className="text-left px-4 py-2 font-semibold text-gw-text-muted">Risk Indicator</th>
                  </tr>
                </thead>
                <tbody>
                  {zoneRisk.map((z, i) => {
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
          ) : (
            <div className="h-48 flex items-center justify-center text-[13px] text-gw-text-muted">No zone risk data available.</div>
          )}
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
        </div>
      )}
    </div>
  )
}
