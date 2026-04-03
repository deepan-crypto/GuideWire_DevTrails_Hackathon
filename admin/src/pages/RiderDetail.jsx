import { useParams, useNavigate, Link } from 'react-router-dom'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { fetchPolicyDetail } from '../services/api'
import {
  ArrowLeft, Edit, FilePlus, StickyNote, MapPin, Phone, Mail, Calendar, Shield,
  CreditCard, AlertTriangle, CheckCircle, Clock, ChevronDown, ChevronRight,
  MessageSquare, PhoneCall, Video, Send
} from 'lucide-react'
import { useState, useEffect } from 'react'

const PLAN_COLORS = { 'Heat Shield Pro': '#00529B', 'Heat Shield Basic': '#4A90D9', 'Rain Guard Plus': '#2ECC71', 'Multi-Peril Cover': '#E67E22' }

function InfoField({ label, value, highlight }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] text-gw-text-muted font-medium uppercase tracking-wider">{label}</span>
      <span className={`text-[12px] font-medium mt-0.5 ${highlight ? highlight : 'text-gw-text'}`}>{value}</span>
    </div>
  )
}

function SectionHeader({ title, count, children }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="bg-white rounded border border-gw-border mb-3">
      <div
        className="flex items-center justify-between px-4 py-2 border-b border-gw-border cursor-pointer hover:bg-gw-bg/30 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-2">
          {open ? <ChevronDown className="w-3.5 h-3.5 text-gw-text-muted" /> : <ChevronRight className="w-3.5 h-3.5 text-gw-text-muted" />}
          <span className="text-[13px] font-semibold text-gw-text">{title}</span>
          {count !== undefined && (
            <span className="text-[11px] text-gw-text-muted">({count})</span>
          )}
        </div>
        <button
          className="px-2.5 py-1 bg-white border border-gw-border rounded text-[10.5px] font-medium text-gw-blue hover:bg-gw-blue-light transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          New
        </button>
      </div>
      {open && children}
    </div>
  )
}

export default function RiderDetail() {
  const { riderId } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('Related')

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPolicyDetail(riderId).then(res => {
      setData(res)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [riderId])

  if (loading) {
    return <div className="p-8 text-center text-gw-text-muted">Loading policy details...</div>
  }

  const rider = data?.policy
  if (!rider) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertTriangle className="w-10 h-10 text-amber-500 mb-3" />
        <p className="text-[14px] font-semibold text-gw-text">Rider Not Found</p>
        <p className="text-[12px] text-gw-text-muted mt-1">Policy ID "{riderId}" does not exist.</p>
        <button onClick={() => navigate('/policy-center')} className="mt-4 px-4 py-2 bg-gw-blue text-white rounded text-[12px] font-medium hover:bg-gw-blue-dark transition-colors">
          Back to PolicyCenter
        </button>
      </div>
    )
  }

  const claims = data?.claims || []
  const billingTransactions = data?.transactions || []
  
  // Create a simulated billing summary based on transactions
  const premiumTxn = billingTransactions.find(t => t.type === 'PREMIUM')
  const billing = {
    paymentStatus: rider.delinquencyStatus === 'YES' ? 'Delinquent' : 'Current',
    nextPayment: new Date(new Date().setMonth(new Date().getMonth() + 1)).toLocaleDateString(),
    pastDue: rider.delinquencyStatus === 'YES' ? rider.premium : '₹0.00',
    currentPayment: rider.premium,
    totalDue: rider.delinquencyStatus === 'YES' ? `₹${parseFloat(rider.premium.replace(/[^0-9.]/g, '')) * 2}` : rider.premium,
    period: 'Monthly',
    method: 'Wallet Auto-Debit',
    autoPay: 'YES'
  }

  const activities = { upcoming: [], past: [] }

  const openClaims = claims.filter(c => c.status === 'Open').length
  const closedClaims = claims.filter(c => c.status === 'Closed').length

  // Premium chart data
  const chartData = [
    { name: rider.plan, value: 65 },
    { name: 'Base Coverage', value: 20 },
    { name: 'Risk Surcharge', value: 15 },
  ]
  const PIE_COLORS = [PLAN_COLORS[rider.plan] || '#00529B', '#7EB8DA', '#B8D4E8']

  const renewalMonths = Math.max(1, Math.floor((new Date('2027-01-15') - new Date(rider.startDate)) / (1000 * 60 * 60 * 24 * 30)))
  const renewalLabel = renewalMonths > 6 ? `${Math.floor(renewalMonths / 12)} Year` : `${renewalMonths} Months`

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[11px] text-gw-text-muted mb-2">
        <Link to="/policy-center" className="hover:text-gw-blue transition-colors">PolicyCenter</Link>
        <span>›</span>
        <span className="text-gw-text font-medium">Account</span>
        <span>›</span>
        <span className="text-gw-blue font-medium">{rider.riderName}</span>
      </div>

      {/* Back Button */}
      <button
        onClick={() => navigate('/policy-center')}
        className="flex items-center gap-1.5 text-[11.5px] text-gw-blue hover:text-gw-blue-dark transition-colors mb-3 font-medium"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Policy Search
      </button>

      {/* Account Header - Blue Banner */}
      <div className="bg-gw-blue rounded-t border border-gw-blue px-5 py-3 flex items-center justify-between">
        <div>
          <div className="text-blue-200 text-[10px] uppercase tracking-wider font-medium">Account</div>
          <h1 className="text-white text-[20px] font-bold tracking-tight">{rider.riderName}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 border border-white/20 rounded text-white text-[11px] font-medium transition-colors">
            <Edit className="w-3 h-3" /> Edit
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 border border-white/20 rounded text-white text-[11px] font-medium transition-colors">
            <FilePlus className="w-3 h-3" /> New Quote
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 border border-white/20 rounded text-white text-[11px] font-medium transition-colors">
            <StickyNote className="w-3 h-3" /> New Note
          </button>
        </div>
      </div>

      {/* Contact Info Bar */}
      <div className="bg-white border-x border-b border-gw-border px-5 py-3 grid grid-cols-8 gap-4">
        <div className="col-span-2">
          <InfoField label="Billing Address" value={rider.address} />
        </div>
        <InfoField label="Birthdate" value={new Date(rider.birthdate).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })} />
        <InfoField label="Phone" value={rider.phone} highlight="text-gw-blue" />
        <InfoField label="Email" value={rider.email} highlight="text-gw-blue" />
        <InfoField label="Customer Since" value={new Date(rider.customerSince).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })} />
        <InfoField label="Account Tier" value={rider.accountTier} />
        <div className="flex gap-4">
          <InfoField label="Account Status" value={rider.status} highlight="text-green-600" />
          <InfoField label="Delinquency" value={rider.delinquencyStatus === 'YES' ? 'Delinquent' : 'None'} highlight={rider.delinquencyStatus === 'YES' ? 'text-red-600' : 'text-gw-text'} />
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-x border-b border-gw-border px-5 flex gap-0">
        {['Related', 'Details', 'News'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-[12px] font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-gw-blue text-gw-blue'
                : 'border-transparent text-gw-text-muted hover:text-gw-text'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Main Content - Two Columns */}
      <div className="grid grid-cols-12 gap-4 mt-4">
        {/* Left Column - Related */}
        <div className="col-span-7">
          {/* Policies Section */}
          <SectionHeader title="Policies" count={1}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gw-bg/50">
                    <th className="text-left px-4 py-1.5 text-[10px] font-semibold text-gw-text-muted uppercase tracking-wider border-b border-gw-border">Policy</th>
                    <th className="text-left px-4 py-1.5 text-[10px] font-semibold text-gw-text-muted uppercase tracking-wider border-b border-gw-border">Type</th>
                    <th className="text-left px-4 py-1.5 text-[10px] font-semibold text-gw-text-muted uppercase tracking-wider border-b border-gw-border">Name Insured</th>
                    <th className="text-left px-4 py-1.5 text-[10px] font-semibold text-gw-text-muted uppercase tracking-wider border-b border-gw-border">Delinquency</th>
                    <th className="text-left px-4 py-1.5 text-[10px] font-semibold text-gw-text-muted uppercase tracking-wider border-b border-gw-border">Renewal In ↓</th>
                    <th className="text-left px-4 py-1.5 text-[10px] font-semibold text-gw-text-muted uppercase tracking-wider border-b border-gw-border">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="hover:bg-gw-blue-light/30 transition-colors">
                    <td className="px-4 py-2 text-[11.5px] font-mono text-gw-blue font-semibold">{rider.id}</td>
                    <td className="px-4 py-2 text-[11.5px]">{rider.plan}</td>
                    <td className="px-4 py-2 text-[11.5px]">{rider.riderName}</td>
                    <td className="px-4 py-2 text-[11.5px]">
                      <span className={rider.delinquencyStatus === 'YES' ? 'text-red-600 font-semibold' : 'text-gw-text'}>
                        {rider.delinquencyStatus}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-[11.5px]">
                      <span className="text-gw-blue font-medium">{renewalLabel}</span>
                    </td>
                    <td className="px-4 py-2 text-[11.5px]">
                      <span className="text-green-600 font-semibold">In Force</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="px-4 py-1.5 text-[10.5px] text-gw-blue font-medium cursor-pointer hover:underline border-t border-gw-border/50">
              View All
            </div>
          </SectionHeader>

          {/* Claims Section */}
          <SectionHeader title="Claims" count={claims.length}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gw-bg/50">
                    <th className="text-left px-4 py-1.5 text-[10px] font-semibold text-gw-text-muted uppercase tracking-wider border-b border-gw-border">Claim Number</th>
                    <th className="text-left px-4 py-1.5 text-[10px] font-semibold text-gw-text-muted uppercase tracking-wider border-b border-gw-border">Product</th>
                    <th className="text-left px-4 py-1.5 text-[10px] font-semibold text-gw-text-muted uppercase tracking-wider border-b border-gw-border">Policy</th>
                    <th className="text-left px-4 py-1.5 text-[10px] font-semibold text-gw-text-muted uppercase tracking-wider border-b border-gw-border">Fraud Risk</th>
                    <th className="text-left px-4 py-1.5 text-[10px] font-semibold text-gw-text-muted uppercase tracking-wider border-b border-gw-border">Date of Loss ↓</th>
                    <th className="text-left px-4 py-1.5 text-[10px] font-semibold text-gw-text-muted uppercase tracking-wider border-b border-gw-border">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {claims.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-4 text-center text-[11.5px] text-gw-text-muted">No claims filed</td></tr>
                  ) : (
                    claims.map((claim, idx) => (
                      <tr key={claim.claimNumber} className={`hover:bg-gw-blue-light/30 transition-colors ${idx % 2 === 1 ? 'bg-gw-bg/20' : ''}`}>
                        <td className="px-4 py-2 text-[11.5px] font-mono text-gw-blue font-semibold">{claim.claimNumber}</td>
                        <td className="px-4 py-2 text-[11.5px]">{claim.product}</td>
                        <td className="px-4 py-2 text-[11.5px] font-mono text-gw-blue">{claim.policyRef}</td>
                        <td className="px-4 py-2 text-[11.5px]">
                          <span className={claim.fraudRisk === 'YES' ? 'text-red-600 font-semibold' : 'text-gw-text'}>
                            {claim.fraudRisk}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-[11.5px]">
                          {new Date(claim.dateOfLoss).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase()}
                        </td>
                        <td className="px-4 py-2 text-[11.5px]">
                          <span className={`font-semibold ${claim.status === 'Open' ? 'text-green-600' : 'text-red-500'}`}>
                            {claim.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {claims.length > 0 && (
              <div className="px-4 py-1.5 text-[10.5px] text-gw-blue font-medium cursor-pointer hover:underline border-t border-gw-border/50">
                View All
              </div>
            )}
          </SectionHeader>

          {/* Billing Section */}
          <SectionHeader title="Billing" count={1}>
            <div className="px-4 py-3">
              <div className="grid grid-cols-4 gap-4 mb-3">
                <div>
                  <div className="text-[10px] text-gw-text-muted uppercase tracking-wider font-medium">Status</div>
                  <div className={`text-[12px] font-bold mt-0.5 ${billing.paymentStatus === 'Delinquent' ? 'text-red-600' : 'text-green-600'}`}>
                    {billing.paymentStatus || 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-gw-text-muted uppercase tracking-wider font-medium">Next Payment</div>
                  <div className="text-[12px] font-medium mt-0.5 text-gw-text">{billing.nextPayment || 'N/A'}</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-[10px] text-gw-text-muted uppercase tracking-wider font-medium">Past Due</div>
                    <div className="text-[12px] font-medium mt-0.5 text-gw-text">{billing.pastDue || '₹0.00'}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gw-text-muted uppercase tracking-wider font-medium">Current</div>
                    <div className="text-[12px] font-medium mt-0.5 text-gw-text">{billing.currentPayment || '₹0.00'}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-gw-text-muted uppercase tracking-wider font-medium">Total Due</div>
                    <div className="text-[16px] font-bold mt-0.5 text-gw-text">{billing.totalDue || '₹0.00'}</div>
                  </div>
                  <button className="px-3 py-1.5 bg-gw-blue text-white rounded text-[10.5px] font-medium hover:bg-gw-blue-dark transition-colors">
                    Pay Now
                  </button>
                </div>
              </div>
              {/* Billing table */}
              <table className="w-full">
                <thead>
                  <tr className="bg-gw-bg/50">
                    <th className="text-left px-3 py-1.5 text-[10px] font-semibold text-gw-text-muted uppercase tracking-wider border-b border-gw-border">Policy</th>
                    <th className="text-left px-3 py-1.5 text-[10px] font-semibold text-gw-text-muted uppercase tracking-wider border-b border-gw-border">Period</th>
                    <th className="text-left px-3 py-1.5 text-[10px] font-semibold text-gw-text-muted uppercase tracking-wider border-b border-gw-border">Method</th>
                    <th className="text-left px-3 py-1.5 text-[10px] font-semibold text-gw-text-muted uppercase tracking-wider border-b border-gw-border">Auto Pay</th>
                    <th className="text-left px-3 py-1.5 text-[10px] font-semibold text-gw-text-muted uppercase tracking-wider border-b border-gw-border">Premium</th>
                    <th className="text-left px-3 py-1.5 text-[10px] font-semibold text-gw-text-muted uppercase tracking-wider border-b border-gw-border">NP Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="hover:bg-gw-blue-light/30 transition-colors">
                    <td className="px-3 py-2 text-[11px] font-mono text-gw-blue font-semibold">{rider.id}</td>
                    <td className="px-3 py-2 text-[11px]">{billing.period || 'N/A'}</td>
                    <td className="px-3 py-2 text-[11px]">{billing.method || 'N/A'}</td>
                    <td className="px-3 py-2 text-[11px]">{billing.autoPay || 'NO'}</td>
                    <td className="px-3 py-2 text-[11px] font-semibold">{rider.premium}</td>
                    <td className="px-3 py-2 text-[11px]">{billing.npAmount || 'N/A'}</td>
                  </tr>
                </tbody>
              </table>
              <div className="mt-2 text-[10.5px] text-gw-blue font-medium cursor-pointer hover:underline">
                View All
              </div>
            </div>
          </SectionHeader>
        </div>

        {/* Right Column */}
        <div className="col-span-5">
          {/* Premium by Policy Type - Donut Chart */}
          <div className="bg-white rounded border border-gw-border mb-3">
            <div className="px-4 py-2.5 border-b border-gw-border">
              <span className="text-[13px] font-semibold text-gw-text">Premium by Policy Type</span>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-center gap-3 mb-3 flex-wrap">
                {chartData.map((entry, i) => (
                  <span key={i} className="flex items-center gap-1.5 text-[10.5px] text-gw-text-muted">
                    <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: PIE_COLORS[i] }}></span>
                    {entry.name}
                  </span>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    dataKey="value"
                    stroke="none"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value}%`} />
                  <text x="50%" y="48%" textAnchor="middle" fill="#1A1A2E" fontSize="18" fontWeight="bold">{rider.premium.replace('/day', '')}</text>
                  <text x="50%" y="58%" textAnchor="middle" fill="#5A6A7A" fontSize="10">/day</text>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Activities */}
          <div className="bg-white rounded border border-gw-border mb-3">
            <div className="px-4 py-2.5 border-b border-gw-border flex items-center gap-4">
              <span className="text-[13px] font-semibold text-gw-text">Activities</span>
              <span className="text-[12px] text-gw-text-muted">Details</span>
            </div>
            <div className="px-4 py-3">
              {/* New Task Bar */}
              <div className="flex items-center gap-2 mb-3">
                <button className="px-3 py-1.5 bg-gw-blue-light text-gw-blue rounded text-[10.5px] font-semibold">New Task</button>
                <button className="px-3 py-1.5 text-gw-text-muted rounded text-[10.5px] font-medium hover:bg-gw-bg transition-colors">Follow Up</button>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Create a Task..."
                  className="flex-1 bg-gw-bg border border-gw-border rounded text-[11px] px-3 py-1.5 focus:outline-none focus:border-gw-blue transition-colors"
                />
                <button className="px-3 py-1.5 bg-gw-blue text-white rounded text-[10.5px] font-semibold hover:bg-gw-blue-dark transition-colors">
                  Add
                </button>
              </div>
              <div className="mt-2 text-[9.5px] text-gw-text-muted">
                Filters: All times • All activities • All types
                <span className="ml-4 text-gw-blue cursor-pointer hover:underline">Refresh</span>
                <span className="mx-1">•</span>
                <span className="text-gw-blue cursor-pointer hover:underline">Expand All</span>
                <span className="mx-1">•</span>
                <span className="text-gw-blue cursor-pointer hover:underline">View All</span>
              </div>
            </div>
          </div>

          {/* Upcoming & Overdue */}
          <div className="bg-white rounded border border-gw-border mb-3">
            <div className="px-4 py-2 border-b border-gw-border">
              <span className="text-[12px] font-semibold text-gw-text">▾ Upcoming & Overdue</span>
            </div>
            <div>
              {activities.upcoming.map((item, idx) => (
                <div key={idx} className="px-4 py-2.5 border-b border-gw-border/50 hover:bg-gw-bg/30 transition-colors flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                    item.color === 'red' ? 'bg-red-500' : item.color === 'orange' ? 'bg-orange-500' : 'bg-blue-500'
                  }`}></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-green-500 shrink-0" />
                      <span className="text-[11.5px] font-medium text-gw-blue truncate">{item.title}</span>
                    </div>
                    <div className="text-[10px] text-gw-text-muted mt-0.5 pl-5">
                      {item.assignee} has an open task
                    </div>
                  </div>
                  <div className="text-[10px] text-gw-text-muted shrink-0 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {item.date}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Past Activity */}
          <div className="bg-white rounded border border-gw-border">
            <div className="px-4 py-2 border-b border-gw-border">
              <span className="text-[12px] font-semibold text-gw-text">▾ Past Activity</span>
            </div>
            <div>
              {activities.past.map((item, idx) => {
                const iconMap = { meeting: Video, email: Send, call: PhoneCall }
                const colorMap = { meeting: 'text-green-500', email: 'text-amber-500', call: 'text-blue-500' }
                const Icon = iconMap[item.type] || MessageSquare
                return (
                  <div key={idx} className="px-4 py-2.5 border-b border-gw-border/50 hover:bg-gw-bg/30 transition-colors">
                    <div className="flex items-start gap-3">
                      <ChevronRight className="w-3 h-3 text-gw-text-muted mt-1 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Icon className={`w-3 h-3 shrink-0 ${colorMap[item.type] || 'text-gray-400'}`} />
                          <span className="text-[11.5px] font-medium text-gw-blue">{item.title}</span>
                        </div>
                        <div className="text-[10px] text-gw-text-muted mt-0.5 pl-5">
                          <span className="text-gw-blue">{item.user}</span> {item.description}
                        </div>
                      </div>
                      <span className="text-[10px] text-gw-text-muted shrink-0">{item.date}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom tabs - History / Notes */}
      <div className="mt-4 bg-white rounded border border-gw-border px-4 py-2 flex items-center gap-4">
        <span className="flex items-center gap-1.5 text-[11.5px] text-gw-text-muted font-medium cursor-pointer hover:text-gw-text transition-colors">
          <Clock className="w-3.5 h-3.5" /> History
        </span>
        <span className="flex items-center gap-1.5 text-[11.5px] text-gw-text-muted font-medium cursor-pointer hover:text-gw-text transition-colors">
          <StickyNote className="w-3.5 h-3.5" /> Notes
        </span>
      </div>
    </div>
  )
}
