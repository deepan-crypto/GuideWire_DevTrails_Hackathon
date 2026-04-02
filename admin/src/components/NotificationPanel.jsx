import { useEffect, useRef } from 'react'
import { X, Bell, Thermometer, CloudRain, CheckCircle, AlertTriangle, Info, RefreshCw } from 'lucide-react'
import { useNotifications } from '../context/NotificationsContext'

const TYPE_CONFIG = {
  critical: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    label: 'Critical',
    labelColor: 'bg-red-100 text-red-700',
    dot: 'bg-red-500',
  },
  warning: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    label: 'Warning',
    labelColor: 'bg-amber-100 text-amber-700',
    dot: 'bg-amber-500',
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    label: 'Info',
    labelColor: 'bg-blue-100 text-blue-700',
    dot: 'bg-blue-500',
  },
}

function NotifIcon({ icon, type }) {
  const cfg = TYPE_CONFIG[type]
  const iconMap = {
    heat: <Thermometer size={14} className={cfg.iconColor} />,
    rain: <CloudRain size={14} className={cfg.iconColor} />,
    check: <CheckCircle size={14} className={cfg.iconColor} />,
    claim: <AlertTriangle size={14} className={cfg.iconColor} />,
    info: <Info size={14} className={cfg.iconColor} />,
  }
  return (
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${cfg.iconBg}`}>
      {iconMap[icon] || <Bell size={14} className={cfg.iconColor} />}
    </div>
  )
}

export default function NotificationPanel() {
  const { notifications, panelOpen, setPanelOpen, unreadCount, markAllRead, dismiss, refresh } = useNotifications()
  const panelRef = useRef(null)

  // Close on outside click
  useEffect(() => {
    function handler(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setPanelOpen(false)
      }
    }
    if (panelOpen) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [panelOpen, setPanelOpen])

  if (!panelOpen) return null

  const criticals = notifications.filter(n => n.type === 'critical')
  const warnings  = notifications.filter(n => n.type === 'warning')
  const infos     = notifications.filter(n => n.type === 'info')

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setPanelOpen(false)} />

      {/* Panel */}
      <div
        ref={panelRef}
        className="fixed top-[52px] right-0 h-[calc(100vh-52px)] w-[380px] z-50
          bg-white border-l border-gw-border shadow-2xl flex flex-col
          animate-[slideIn_0.25s_ease-out]"
        style={{ animation: 'slideInRight 0.22s cubic-bezier(0.4,0,0.2,1)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gw-border bg-gw-header">
          <div className="flex items-center gap-2">
            <Bell size={15} className="text-blue-300" />
            <span className="text-white font-semibold text-[13px]">Notifications</span>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => refresh()}
              title="Refresh"
              className="text-blue-400 hover:text-white transition-colors"
            >
              <RefreshCw size={13} />
            </button>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-[10.5px] text-blue-300 hover:text-white transition-colors font-medium"
              >
                Mark all read
              </button>
            )}
            <button onClick={() => setPanelOpen(false)} className="text-blue-400 hover:text-white transition-colors ml-1">
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto bg-gw-bg/30">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gw-text-muted">
              <CheckCircle size={28} className="mb-2 text-green-400" />
              <p className="text-[13px] font-medium">All clear!</p>
              <p className="text-[11px] mt-1">No active alerts at this time.</p>
            </div>
          ) : (
            <>
              {[
                { key: 'critical', label: '🔴 Critical Triggers', items: criticals },
                { key: 'warning',  label: '🟡 Pending Claims',    items: warnings },
                { key: 'info',     label: '🔵 Recent Activity',   items: infos },
              ].map(group => group.items.length > 0 && (
                <div key={group.key}>
                  <div className="px-4 py-2 text-[10.5px] font-semibold uppercase tracking-wider text-gw-text-muted bg-gw-bg/60 border-b border-gw-border sticky top-0">
                    {group.label}
                  </div>
                  {group.items.map(notif => {
                    const cfg = TYPE_CONFIG[notif.type]
                    return (
                      <div
                        key={notif.id}
                        className={`px-4 py-3 border-b border-gw-border/50 hover:bg-white transition-colors
                          ${!notif.read ? 'bg-white' : 'bg-gw-bg/20'}`}
                      >
                        <div className="flex items-start gap-3">
                          <NotifIcon icon={notif.icon} type={notif.type} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${cfg.labelColor}`}>
                                {cfg.label}
                              </span>
                              {!notif.read && <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />}
                            </div>
                            <p className="text-[12px] font-semibold text-gw-text leading-tight">{notif.title}</p>
                            <p className="text-[11px] text-gw-text-muted mt-0.5 leading-snug">{notif.body}</p>
                            <p className="text-[10px] text-gw-text-muted/60 mt-1 font-mono">{notif.time}</p>
                          </div>
                          <button
                            onClick={() => dismiss(notif.id)}
                            className="text-gw-text-muted/50 hover:text-gw-text-muted transition-colors shrink-0 mt-0.5"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-gw-border bg-gw-bg/40 text-[10.5px] text-gw-text-muted flex items-center justify-between">
          <span>Auto-refreshes every 30s</span>
          <span className="flex items-center gap-1 text-green-600 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
            Connected
          </span>
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </>
  )
}
