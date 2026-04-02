import { useRef, useEffect } from 'react'
import { X, Bell, Thermometer, CloudRain, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react'
import { useNotifications } from '../context/NotificationsContext'

const TYPE_CONFIG = {
  critical: {
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    label: 'Critical',
    labelColor: 'bg-red-100 text-red-700',
    dot: 'bg-red-500',
    rowBg: 'bg-red-50/40',
  },
  warning: {
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    label: 'Warning',
    labelColor: 'bg-amber-100 text-amber-700',
    dot: 'bg-amber-500',
    rowBg: 'bg-amber-50/30',
  },
  info: {
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    label: 'Info',
    labelColor: 'bg-blue-100 text-blue-700',
    dot: 'bg-blue-500',
    rowBg: '',
  },
}

function NotifIcon({ icon, type }) {
  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.info
  const icons = {
    heat:  <Thermometer  size={14} className={cfg.iconColor} />,
    rain:  <CloudRain    size={14} className={cfg.iconColor} />,
    check: <CheckCircle  size={14} className={cfg.iconColor} />,
    claim: <AlertTriangle size={14} className={cfg.iconColor} />,
  }
  return (
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${cfg.iconBg}`}>
      {icons[icon] || <Bell size={14} className={cfg.iconColor} />}
    </div>
  )
}

const GROUPS = [
  { key: 'critical', label: '🔴 Critical Triggers' },
  { key: 'warning',  label: '🟡 Pending Claims'    },
  { key: 'info',     label: '🔵 Recent Activity'   },
]

export default function NotificationPanel() {
  const {
    notifications, panelOpen, setPanelOpen,
    unreadCount, markAllRead, dismiss, refresh,
  } = useNotifications()

  const panelRef = useRef(null)

  // Close when clicking outside the panel (not the bell — bell is handled by toggle)
  useEffect(() => {
    if (!panelOpen) return
    function onMouseDown(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setPanelOpen(false)
      }
    }
    // delay so the bell-click that opened it doesn't immediately close it
    const id = setTimeout(() => document.addEventListener('mousedown', onMouseDown), 0)
    return () => {
      clearTimeout(id)
      document.removeEventListener('mousedown', onMouseDown)
    }
  }, [panelOpen, setPanelOpen])

  const grouped = GROUPS.map(g => ({
    ...g,
    items: notifications.filter(n => n.type === g.key),
  })).filter(g => g.items.length > 0)

  return (
    <>
      {/* Invisible backdrop — closes panel on outside click, pointer-events only */}
      {panelOpen && (
        <div
          className="fixed inset-0 z-40"
          style={{ background: 'transparent' }}
          onMouseDown={() => setPanelOpen(false)}
        />
      )}

      {/* Slide-in panel */}
      <div
        ref={panelRef}
        className="fixed top-[52px] right-0 h-[calc(100vh-52px)] w-[380px] z-50
          bg-white border-l border-gw-border shadow-2xl flex flex-col"
        style={{
          transform: panelOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
          pointerEvents: panelOpen ? 'auto' : 'none',
          willChange: 'transform',
        }}
      >
        {/* ── Header ───────────────────────────────────────── */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gw-border bg-gw-header shrink-0">
          <div className="flex items-center gap-2">
            <Bell size={15} className="text-blue-300" />
            <span className="text-white font-semibold text-[13px]">Notifications</span>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                {unreadCount} new
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={refresh}
              title="Refresh"
              className="text-blue-400 hover:text-white transition-colors"
            >
              <RefreshCw size={13} />
            </button>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-[10.5px] text-blue-300 hover:text-white transition-colors font-medium whitespace-nowrap"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={() => setPanelOpen(false)}
              className="text-blue-400 hover:text-white transition-colors"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* ── Body ─────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gw-text-muted">
              <CheckCircle size={28} className="mb-2 text-green-400" />
              <p className="text-[13px] font-medium">All clear!</p>
              <p className="text-[11px] mt-1">No active alerts right now.</p>
            </div>
          ) : (
            grouped.map(group => {
              const cfg = TYPE_CONFIG[group.key]
              return (
                <div key={group.key}>
                  {/* Group header */}
                  <div className="sticky top-0 z-10 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-gw-text-muted bg-gw-bg border-b border-gw-border">
                    {group.label}
                  </div>

                  {/* Notifications */}
                  {group.items.map(notif => (
                    <div
                      key={notif.id}
                      className={`px-4 py-3 border-b border-gw-border/50 hover:bg-white transition-colors ${notif.read ? 'bg-gw-bg/20' : cfg.rowBg || 'bg-white'}`}
                    >
                      <div className="flex items-start gap-3">
                        <NotifIcon icon={notif.icon} type={notif.type} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${cfg.labelColor}`}>
                              {cfg.label}
                            </span>
                            {!notif.read && (
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
                            )}
                          </div>
                          <p className="text-[12px] font-semibold text-gw-text leading-tight">{notif.title}</p>
                          <p className="text-[11px] text-gw-text-muted mt-0.5 leading-snug">{notif.body}</p>
                          <p className="text-[10px] text-gw-text-muted/60 mt-1 font-mono">{notif.time}</p>
                        </div>
                        <button
                          onClick={() => dismiss(notif.id)}
                          className="text-gw-text-muted/40 hover:text-gw-text-muted transition-colors shrink-0 mt-0.5 p-0.5"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            })
          )}
        </div>

        {/* ── Footer ───────────────────────────────────────── */}
        <div className="px-4 py-2.5 border-t border-gw-border bg-gw-bg/40 text-[10.5px] text-gw-text-muted flex items-center justify-between shrink-0">
          <span>Auto-refreshes every 30s</span>
          <span className="flex items-center gap-1.5 text-green-600 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
            Live
          </span>
        </div>
      </div>
    </>
  )
}
