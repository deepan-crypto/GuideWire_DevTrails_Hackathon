import { useState, useEffect } from 'react'
import { fetchTriggerZones, fetchApprovalLog } from '../services/api'
import { Thermometer, CloudRain, Zap, CheckCircle, Clock, MapPin, AlertTriangle, Radio, RefreshCw, Loader2 } from 'lucide-react'

function LivePulse() {
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const interval = setInterval(() => setVisible(v => !v), 1000)
    return () => clearInterval(interval)
  }, [])
  return (
    <span className={`inline-block w-2 h-2 rounded-full bg-red-500 transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-30'}`}></span>
  )
}

function TriggerZoneCard({ zone }) {
  const isTriggered = zone.triggered
  return (
    <div className={`rounded border-2 p-3 transition-all ${
      isTriggered
        ? 'border-red-400 bg-red-50 shadow-sm shadow-red-100'
        : 'border-gw-border bg-white'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <MapPin className={`w-3.5 h-3.5 ${isTriggered ? 'text-red-600' : 'text-gw-text-muted'}`} />
          <span className="text-[11.5px] font-semibold text-gw-text">{zone.id}</span>
          {isTriggered && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-600 text-white uppercase tracking-wider">
              <LivePulse /> TRIGGERED
            </span>
          )}
        </div>
        {isTriggered && zone.triggerType && (
          <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
            zone.triggerType === 'HEAT' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
          }`}>
            {zone.triggerType === 'HEAT' ? <Thermometer className="w-3 h-3" /> : <CloudRain className="w-3 h-3" />}
            {zone.triggerType}
          </span>
        )}
      </div>

      <div className="text-[11px] text-gw-text-muted mb-2">{zone.name}</div>

      <div className="grid grid-cols-2 gap-2 mb-2">
        <div className={`rounded p-2 text-center ${zone.temp >= zone.heatThreshold ? 'bg-red-100' : 'bg-gray-50'}`}>
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <Thermometer className={`w-3 h-3 ${zone.temp >= zone.heatThreshold ? 'text-red-600' : 'text-gray-400'}`} />
            <span className="text-[9px] font-semibold uppercase text-gw-text-muted">Temp</span>
          </div>
          <div className={`text-[15px] font-bold ${zone.temp >= zone.heatThreshold ? 'text-red-700' : 'text-gw-text'}`}>
            {zone.temp}°C
          </div>
          <div className="text-[9px] text-gw-text-muted">Threshold: {zone.heatThreshold}°C</div>
        </div>
        <div className={`rounded p-2 text-center ${zone.rain >= zone.rainThreshold ? 'bg-blue-100' : 'bg-gray-50'}`}>
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <CloudRain className={`w-3 h-3 ${zone.rain >= zone.rainThreshold ? 'text-blue-600' : 'text-gray-400'}`} />
            <span className="text-[9px] font-semibold uppercase text-gw-text-muted">Rain</span>
          </div>
          <div className={`text-[15px] font-bold ${zone.rain >= zone.rainThreshold ? 'text-blue-700' : 'text-gw-text'}`}>
            {zone.rain}mm
          </div>
          <div className="text-[9px] text-gw-text-muted">Threshold: {zone.rainThreshold}mm</div>
        </div>
      </div>

      <div className="flex items-center justify-between text-[10.5px]">
        <span className="text-gw-text-muted">{zone.riders} active riders</span>
        {isTriggered && (
          <span className="font-semibold text-red-600">{zone.pendingClaims} claims pending</span>
        )}
      </div>
    </div>
  )
}

export default function ClaimCenter() {
  const [zones, setZones] = useState([])
  const [liveLog, setLiveLog] = useState([])
  const [timer, setTimer] = useState(0)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  const loadData = () => {
    setLoading(true)
    Promise.all([
      fetchTriggerZones().then(data => { if (data && data.length > 0) setZones(data) }),
      fetchApprovalLog().then(data => {
        if (data && data.length > 0) {
          const mapped = data.map(c => ({
            id: c.claimNumber, timestamp: c.approvedAt || c.dateOfLoss, rider: c.riderName,
            zone: c.zone, trigger: `${c.triggerType} trigger`, amount: `₹${c.amount}`,
            status: c.status, paidAt: c.approvedAt || 'Pending'
          }))
          setLiveLog(mapped)
        }
      })
    ]).finally(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
  }, [])

  // Simulate live log appending
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(t => t + 1)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const triggeredCount = zones.filter(z => z.triggered).length

  return (
    <div>
      {/* Server cold-start banner */}
      {loading && (
        <div className="flex items-center gap-2.5 px-4 py-2.5 mb-4 bg-blue-50 border border-blue-200 rounded text-[12px] text-blue-800">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          <span><span className="font-semibold">Connecting to server…</span> The backend may take up to 30s to wake from sleep. Trigger data will load automatically.</span>
        </div>
      )}

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[11px] text-gw-text-muted mb-3">
        <span>ClaimCenter</span>
        <span>›</span>
        <span className="text-gw-text font-medium">Parametric Claims</span>
        <span>›</span>
        <span className="text-gw-blue font-medium">Live Trigger Monitor</span>
      </div>

      {/* Page header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-[18px] font-semibold text-gw-text tracking-tight">Parametric Claims Desktop</h1>
          <p className="text-[12px] text-gw-text-muted mt-0.5">Automated weather-triggered claim processing — Zero manual intervention</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded text-[11.5px] font-semibold text-red-700">
            <LivePulse />
            {triggeredCount} Active Triggers
          </div>
          <button
            onClick={() => { setSyncing(true); loadData(); setTimeout(() => setSyncing(false), 1500) }}
            disabled={syncing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gw-blue text-white rounded text-[11.5px] font-medium hover:bg-gw-blue-dark transition-colors shadow-sm disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Force Sync'}
          </button>
        </div>
      </div>

      {/* Alert Banner */}
      <div className="flex items-center gap-3 px-4 py-2.5 mb-4 bg-red-600 text-white rounded border border-red-700">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        <div className="text-[12px]">
          <span className="font-semibold">PARAMETRIC TRIGGER ALERT:</span> Extreme heat in Delhi NCR (47.2°C) and heavy rainfall in Mumbai (112mm) & Chennai (95mm). Auto-approval engine is processing {triggeredCount * 8} claims.
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-[10px] font-mono bg-red-700/50 px-2 py-1 rounded">
          <Radio className="w-3 h-3" />
          LIVE
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Zones Monitored', value: zones.length.toString(), icon: MapPin, accent: 'text-gw-blue' },
          { label: 'Active Triggers', value: triggeredCount.toString(), icon: Zap, accent: 'text-red-600' },
          { label: 'Claims Auto-Approved', value: liveLog.length.toString(), icon: CheckCircle, accent: 'text-green-600' },
          { label: 'Avg Process Time', value: '2.8s', icon: Clock, accent: 'text-amber-600' },
        ].map((stat, i) => {
          const Icon = stat.icon
          return (
            <div key={i} className="bg-white rounded border border-gw-border p-3 flex items-center gap-3">
              <div className={`w-9 h-9 rounded flex items-center justify-center bg-gw-bg ${stat.accent}`}>
                <Icon className="w-4.5 h-4.5" />
              </div>
              <div>
                <div className="text-[10.5px] text-gw-text-muted font-medium uppercase tracking-wider">{stat.label}</div>
                <div className="text-[18px] font-bold text-gw-text leading-tight">{stat.value}</div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Trigger Map — 7 columns */}
        <div className="col-span-7">
          <div className="bg-white rounded border border-gw-border">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gw-border">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gw-blue" />
                <span className="text-[13px] font-semibold text-gw-text">Live Trigger Map — Micro-Zone Grid</span>
              </div>
              <div className="flex items-center gap-3 text-[10px]">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-red-500 border border-red-600"></span>
                  Triggered
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-gray-200 border border-gray-300"></span>
                  Normal
                </span>
              </div>
            </div>
            <div className="p-4 grid grid-cols-3 gap-3">
              {zones.map(zone => (
                <TriggerZoneCard key={zone.id} zone={zone} />
              ))}
            </div>
          </div>
        </div>

        {/* Auto-Approval Log — 5 columns */}
        <div className="col-span-5">
          <div className="bg-white rounded border border-gw-border h-full flex flex-col">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gw-border">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-green-600" />
                <span className="text-[13px] font-semibold text-gw-text">Auto-Approval Log</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-green-600 font-semibold bg-green-50 px-2 py-1 rounded">
                <LivePulse />
                REALTIME
              </div>
            </div>
            <div className="flex-1 overflow-y-auto max-h-[520px]">
              {liveLog.map((entry, idx) => (
                <div key={entry.id} className={`px-4 py-3 border-b border-gw-border/50 hover:bg-gw-blue-light/20 transition-colors ${idx === liveLog.length - 1 ? 'animate-pulse bg-green-50/50' : ''}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-[11px] font-semibold text-gw-blue">{entry.id}</span>
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-green-100 text-green-700 border border-green-200">
                      <CheckCircle className="w-2.5 h-2.5" />
                      {entry.status}
                    </span>
                  </div>
                  <div className="text-[11.5px] font-medium text-gw-text mb-1">{entry.rider}</div>
                  <div className="text-[10.5px] text-gw-text-muted mb-1.5">{entry.trigger}</div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-gw-text-muted font-mono">{entry.timestamp}</span>
                    <span className="font-semibold text-green-700">{entry.amount}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-[9.5px] text-gw-text-muted">
                    <Clock className="w-3 h-3" />
                    Paid at {entry.paidAt} — Processing: 2.8s
                  </div>
                </div>
              ))}
            </div>
            <div className="px-4 py-2.5 border-t border-gw-border bg-gw-bg/40 text-[10.5px] text-gw-text-muted flex items-center justify-between">
              <span>Integration Gateway: <span className="font-medium text-green-600">Connected</span></span>
              <span>Next poll: <span className="font-mono">{Math.max(0, 60 - (timer * 3) % 60)}s</span></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
