import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { fetchClaims, fetchTriggerZones } from '../services/api'

const NotificationsContext = createContext(null)

function buildNotifications(claims, zones) {
  const notifs = []

  // Active trigger zones → Critical
  const triggeredZones = (zones || []).filter(z => z.triggered)
  triggeredZones.forEach(z => {
    notifs.push({
      id: `zone-${z.id}`,
      type: 'critical',
      title: `Parametric Trigger — ${z.id}`,
      body: `${z.triggerType === 'HEAT' ? '🌡️ Heat' : '🌧️ Rain'} trigger active in ${z.name}. ${z.riders} riders affected.`,
      time: new Date().toLocaleTimeString(),
      read: false,
      icon: z.triggerType === 'HEAT' ? 'heat' : 'rain',
    })
  })

  // Open claims → Warning
  const openClaims = (claims || []).filter(c => c.status === 'Open')
  openClaims.forEach(c => {
    notifs.push({
      id: `claim-open-${c.claimNumber}`,
      type: 'warning',
      title: `Claim Pending Review — ${c.claimNumber}`,
      body: `${c.riderName} filed a ${c.triggerType} claim for ₹${c.amount}. Awaiting adjudication.`,
      time: c.dateOfLoss,
      read: false,
      icon: 'claim',
    })
  })

  // Auto-approved claims → Info
  const autoClaims = (claims || []).filter(c => c.status === 'AUTO-APPROVED').slice(0, 5)
  autoClaims.forEach(c => {
    notifs.push({
      id: `claim-auto-${c.claimNumber}`,
      type: 'info',
      title: `Auto-Approved — ${c.claimNumber}`,
      body: `₹${c.amount} paid to ${c.riderName} via parametric engine. Processing: 2.8s.`,
      time: c.approvedAt || c.dateOfLoss,
      read: false,
      icon: 'check',
    })
  })

  return notifs
}

export function NotificationsProvider({ children }) {
  const [notifications, setNotifications] = useState([])
  const [panelOpen, setPanelOpen] = useState(false)
  const pollRef = useRef(null)

  const fetchNotifs = useCallback(async () => {
    const [claims, zones] = await Promise.all([fetchClaims(), fetchTriggerZones()])
    const fresh = buildNotifications(claims, zones)
    setNotifications(prev => {
      // Preserve read state for existing notifications
      const readIds = new Set(prev.filter(n => n.read).map(n => n.id))
      return fresh.map(n => ({ ...n, read: readIds.has(n.id) }))
    })
  }, [])

  useEffect(() => {
    fetchNotifs()
    pollRef.current = setInterval(fetchNotifs, 30000)
    return () => clearInterval(pollRef.current)
  }, [fetchNotifs])

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }, [])

  const markRead = useCallback((id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }, [])

  const dismiss = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <NotificationsContext.Provider value={{
      notifications, unreadCount, panelOpen, setPanelOpen,
      markAllRead, markRead, dismiss, refresh: fetchNotifs
    }}>
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  return useContext(NotificationsContext)
}
