import { useState, useEffect } from 'react'
import { fetchBillingSummary, fetchTransactions, fetchMonthlyTrend } from '../services/api'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { DollarSign, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, CreditCard, PieChart, FileText, Download, CheckCircle, Loader2 } from 'lucide-react'

function StatCard({ label, value, change, positive, icon: Icon, accent }) {
  return (
    <div className="bg-white rounded border border-gw-border p-4">
      <div className="flex items-center justify-between mb-2">
        <div className={`w-9 h-9 rounded flex items-center justify-center ${accent}`}>
          <Icon className="w-4.5 h-4.5" />
        </div>
        <span className={`flex items-center gap-0.5 text-[10.5px] font-semibold ${positive ? 'text-green-600' : 'text-red-500'}`}>
          {positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {change}
        </span>
      </div>
      <div className="text-[10.5px] text-gw-text-muted font-medium uppercase tracking-wider">{label}</div>
      <div className="text-[22px] font-bold text-gw-text leading-tight mt-0.5">{value}</div>
    </div>
  )
}

function formatCurrency(num) {
  if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`
  if (num >= 1000) return `₹${(num / 1000).toFixed(0)}K`
  return `₹${num}`
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gw-border rounded shadow-lg p-3">
        <p className="text-[11px] font-semibold text-gw-text mb-1.5">{label} 2026</p>
        {payload.map((entry, i) => (
          <p key={i} className="text-[11px] flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded" style={{ backgroundColor: entry.color }}></span>
            <span className="text-gw-text-muted">{entry.name}:</span>
            <span className="font-semibold text-gw-text">{formatCurrency(entry.value)}</span>
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function BillingCenter() {
  const [summary, setSummary] = useState({ totalPremiums: 0, totalPayouts: 0, netRevenue: 0, lossRatio: 0, activePolicies: 0, claimsPaid: 0, avgClaimSize: 0, autoApprovalRate: 0 })
  const [monthlyTrend, setMonthlyTrend] = useState([])
  const [recentTransactions, setRecentTransactions] = useState([])
  const [toast, setToast] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetchBillingSummary().then(data => { if (data) setSummary(data) }),
      fetchMonthlyTrend().then(data => { if (data && data.length > 0) setMonthlyTrend(data) }),
      fetchTransactions().then(data => {
        if (data && data.length > 0) {
          const mapped = data.map(t => ({
            id: t.txnId, type: t.type, rider: t.riderName, amount: t.amount,
            date: t.date, description: t.description
          }))
          setRecentTransactions(mapped)
        }
      })
    ]).finally(() => setLoading(false))
  }, [])

  const handleExportLedger = () => {
    const headers = ['TXN ID', 'Type', 'Rider', 'Amount', 'Date', 'Description']
    const rows = recentTransactions.map(t => [t.id, t.type, t.rider, t.amount, t.date, t.description])
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `billing-ledger-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setToast('Ledger exported — ' + recentTransactions.length + ' transactions')
    setTimeout(() => setToast(null), 3000)
  }

  const handleGenerateReport = () => {
    setToast('Generating financial report...')
    setTimeout(() => {
      setToast('Report generated — billing-report-Q1-2026.pdf')
      setTimeout(() => setToast(null), 3000)
    }, 1500)
  }

  return (
    <div className="relative">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-gw-header text-white px-4 py-2.5 rounded shadow-lg text-[12px] font-medium flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-400" />
          {toast}
        </div>
      )}

      {/* Server cold-start banner */}
      {loading && (
        <div className="flex items-center gap-2.5 px-4 py-2.5 mb-4 bg-blue-50 border border-blue-200 rounded text-[12px] text-blue-800">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          <span><span className="font-semibold">Connecting to server…</span> The backend may take up to 30s to wake from sleep. Financial data will load automatically.</span>
        </div>
      )}

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[11px] text-gw-text-muted mb-3">
        <span>BillingCenter</span>
        <span>›</span>
        <span className="text-gw-text font-medium">Financial Overview</span>
        <span>›</span>
        <span className="text-gw-blue font-medium">Gig Worker — Parametric</span>
      </div>

      {/* Page header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-[18px] font-semibold text-gw-text tracking-tight">Financial Summary</h1>
          <p className="text-[12px] text-gw-text-muted mt-0.5">Premiums, payouts, and ledger for parametric micro-insurance products</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExportLedger} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gw-border rounded text-[11.5px] font-medium text-gw-text hover:bg-gray-50 transition-colors">
            <Download className="w-3.5 h-3.5" />
            Export Ledger
          </button>
          <button onClick={handleGenerateReport} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gw-border rounded text-[11.5px] font-medium text-gw-text hover:bg-gray-50 transition-colors">
            <FileText className="w-3.5 h-3.5" />
            Generate Report
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <StatCard
          label="Total Premiums Collected"
          value={formatCurrency(summary.totalPremiums)}
          change="+18.4%"
          positive={true}
          icon={TrendingUp}
          accent="bg-blue-50 text-gw-blue"
        />
        <StatCard
          label="Automated Payouts"
          value={formatCurrency(summary.totalPayouts)}
          change="+43.2%"
          positive={false}
          icon={TrendingDown}
          accent="bg-red-50 text-red-500"
        />
        <StatCard
          label="Net Revenue"
          value={formatCurrency(summary.netRevenue)}
          change="+12.1%"
          positive={true}
          icon={DollarSign}
          accent="bg-green-50 text-green-600"
        />
        <StatCard
          label="Loss Ratio"
          value={`${summary.lossRatio}%`}
          change="Healthy"
          positive={true}
          icon={PieChart}
          accent="bg-amber-50 text-amber-600"
        />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Active Policies', value: summary.activePolicies.toLocaleString() },
          { label: 'Claims Paid (MTD)', value: summary.claimsPaid.toLocaleString() },
          { label: 'Avg Claim Size', value: `₹${summary.avgClaimSize}` },
          { label: 'Auto-Approval Rate', value: `${summary.autoApprovalRate}%` },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded border border-gw-border px-4 py-3 flex items-center justify-between">
            <span className="text-[11px] text-gw-text-muted font-medium">{stat.label}</span>
            <span className="text-[15px] font-bold text-gw-text">{stat.value}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Chart */}
        <div className="col-span-7">
          <div className="bg-white rounded border border-gw-border">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gw-border">
              <span className="text-[13px] font-semibold text-gw-text">Premiums Collected vs Automated Payouts</span>
              <span className="text-[10.5px] text-gw-text-muted">Last 6 months</span>
            </div>
            <div className="p-4">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyTrend} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E9F0" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: '#5A6A7A' }}
                    axisLine={{ stroke: '#D1D9E0' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#5A6A7A' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `₹${v / 1000}K`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                    iconType="square"
                    iconSize={10}
                  />
                  <Bar dataKey="premiums" name="Premiums Collected" fill="#00529B" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="payouts" name="Automated Payouts" fill="#D32F2F" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Revenue Trend */}
          <div className="bg-white rounded border border-gw-border mt-4">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gw-border">
              <span className="text-[13px] font-semibold text-gw-text">Net Revenue Trend</span>
            </div>
            <div className="p-4">
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={monthlyTrend.map(d => ({ ...d, net: d.premiums - d.payouts }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E9F0" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#5A6A7A' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#5A6A7A' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v / 1000}K`} />
                  <Tooltip content={<CustomTooltip />} />
                  <defs>
                    <linearGradient id="netGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00529B" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00529B" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="net" name="Net Revenue" stroke="#00529B" fill="url(#netGradient)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Transaction Ledger */}
        <div className="col-span-5">
          <div className="bg-white rounded border border-gw-border h-full flex flex-col">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gw-border">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-gw-blue" />
                <span className="text-[13px] font-semibold text-gw-text">Transaction Ledger</span>
              </div>
              <span className="text-[10.5px] text-gw-text-muted">Today</span>
            </div>
            <div className="flex-1 overflow-y-auto">
              {recentTransactions.map((txn) => (
                <div key={txn.id} className="px-4 py-3 border-b border-gw-border/50 hover:bg-gw-blue-light/20 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[10.5px] text-gw-text-muted">{txn.id}</span>
                    <span className={`text-[13px] font-bold ${txn.amount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {txn.amount > 0 ? '+' : ''}{txn.amount > 0 ? `₹${txn.amount}` : `-₹${Math.abs(txn.amount)}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${txn.type === 'PREMIUM' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-600'
                      }`}>{txn.type}</span>
                    <span className="text-[11.5px] font-medium text-gw-text">{txn.rider}</span>
                  </div>
                  <div className="text-[10.5px] text-gw-text-muted">{txn.description}</div>
                </div>
              ))}
            </div>
            <div className="px-4 py-2.5 border-t border-gw-border bg-gw-bg/40">
              <div className="flex items-center justify-between text-[10.5px]">
                <span className="text-gw-text-muted">Wallet Gateway:</span>
                <span className="font-medium text-green-600">● Connected</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
