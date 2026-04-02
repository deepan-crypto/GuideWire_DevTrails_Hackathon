import { useEffect, useRef } from 'react'
import { Check, LogOut, ChevronRight } from 'lucide-react'
import { useAuth, ROLES } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const ROLE_STYLE = {
  super_admin:     { gradient: 'from-purple-600 to-purple-800', border: 'border-purple-500/30', ring: 'ring-purple-400', emoji: '🛡️', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  claims_manager:  { gradient: 'from-blue-600 to-blue-800',    border: 'border-blue-500/30',   ring: 'ring-blue-400',   emoji: '📋', bg: 'bg-blue-50'   },
  policy_admin:    { gradient: 'from-green-600 to-green-800',  border: 'border-green-500/30',  ring: 'ring-green-400',  emoji: '📄', bg: 'bg-green-50'  },
  billing_admin:   { gradient: 'from-amber-600 to-amber-800',  border: 'border-amber-500/30',  ring: 'ring-amber-400',  emoji: '💰', bg: 'bg-amber-50'  },
}

export default function RoleSwitcher({ onClose }) {
  const { user, switchRole, logout } = useAuth()
  const navigate = useNavigate()
  const ref = useRef(null)

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const handleSwitch = (roleId) => {
    switchRole(roleId)
    onClose()
    // navigate to first allowed route of new role
    const allowed = ROLES[roleId].allowedRoutes
    navigate('/' + (allowed[0] || ''))
  }

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div
      ref={ref}
      className="absolute top-full right-0 mt-2 w-[280px] bg-white border border-gw-border rounded-xl shadow-xl z-50 overflow-hidden"
      style={{ animation: 'dropIn 0.18s cubic-bezier(0.4,0,0.2,1)' }}
    >
      {/* Current user card */}
      <div className="bg-gw-header px-4 py-3">
        <div className="text-[10px] uppercase tracking-wider text-blue-300/60 mb-1">Signed in as</div>
        <div className="text-white font-semibold text-[13px]">{user?.email}</div>
        <div className="text-blue-300/70 text-[11px] mt-0.5">{ROLES[user?.role]?.label}</div>
      </div>

      {/* Role list */}
      <div className="p-2">
        <div className="text-[10px] uppercase tracking-wider text-gw-text-muted px-2 py-1.5 font-semibold">
          Switch Role
        </div>
        {Object.values(ROLES).map(role => {
          const style = ROLE_STYLE[role.id]
          const isCurrent = user?.role === role.id
          return (
            <button
              key={role.id}
              onClick={() => !isCurrent && handleSwitch(role.id)}
              disabled={isCurrent}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all mb-0.5
                ${isCurrent
                  ? 'bg-gw-sidebar-active cursor-default'
                  : 'hover:bg-gw-bg cursor-pointer'
                }`}
            >
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${style.gradient} flex items-center justify-center text-[15px] shrink-0`}>
                {style.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-semibold text-gw-text truncate">{role.label}</div>
                <div className="text-[10px] text-gw-text-muted truncate">{role.description}</div>
              </div>
              {isCurrent ? (
                <Check size={14} className="text-green-500 shrink-0" />
              ) : (
                <ChevronRight size={14} className="text-gw-text-muted/40 shrink-0" />
              )}
            </button>
          )
        })}
      </div>

      {/* Divider + logout */}
      <div className="border-t border-gw-border p-2">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left
            text-red-500 hover:bg-red-50 transition-colors text-[12px] font-medium"
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </div>

      <style>{`
        @keyframes dropIn {
          from { transform: translateY(-8px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
    </div>
  )
}
