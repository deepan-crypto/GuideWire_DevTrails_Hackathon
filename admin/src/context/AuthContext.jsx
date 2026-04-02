import { createContext, useContext, useState, useCallback } from 'react'

// ── Role definitions ──────────────────────────────────────────────────────────
export const ROLES = {
  super_admin: {
    id: 'super_admin',
    label: 'Super Admin',
    initials: 'SA',
    color: 'bg-purple-600',
    description: 'Full access to all modules',
    allowedRoutes: ['policy-center', 'claim-center', 'billing-center', 'user-management', 'analytics'],
  },
  claims_manager: {
    id: 'claims_manager',
    label: 'Claims Manager',
    initials: 'CM',
    color: 'bg-blue-600',
    description: 'Claims & Policy read access',
    allowedRoutes: ['policy-center', 'claim-center'],
  },
  policy_admin: {
    id: 'policy_admin',
    label: 'Policy Admin',
    initials: 'PA',
    color: 'bg-green-600',
    description: 'Policy management & analytics',
    allowedRoutes: ['policy-center', 'analytics'],
  },
  billing_admin: {
    id: 'billing_admin',
    label: 'Billing Admin',
    initials: 'BA',
    color: 'bg-amber-600',
    description: 'Billing & financial overview',
    allowedRoutes: ['billing-center'],
  },
}

// ── Hardcoded credentials (demo only) ─────────────────────────────────────────
const CREDENTIALS = [
  { email: 'admin@riskwire.in',   password: 'admin123',   role: 'super_admin' },
  { email: 'claims@riskwire.in',  password: 'claims123',  role: 'claims_manager' },
  { email: 'policy@riskwire.in',  password: 'policy123',  role: 'policy_admin' },
  { email: 'billing@riskwire.in', password: 'billing123', role: 'billing_admin' },
]

// ── Context ───────────────────────────────────────────────────────────────────
const AuthContext = createContext(null)

function loadSession() {
  try {
    const raw = sessionStorage.getItem('riskwire_user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadSession)

  const login = useCallback((email, password) => {
    const match = CREDENTIALS.find(c => c.email === email && c.password === password)
    if (!match) return false
    const u = { email: match.email, role: match.role, name: ROLES[match.role].label }
    sessionStorage.setItem('riskwire_user', JSON.stringify(u))
    setUser(u)
    return true
  }, [])

  const logout = useCallback(() => {
    sessionStorage.removeItem('riskwire_user')
    setUser(null)
  }, [])

  const switchRole = useCallback((roleId) => {
    if (!ROLES[roleId]) return
    const cred = CREDENTIALS.find(c => c.role === roleId)
    const u = { email: cred?.email || user?.email, role: roleId, name: ROLES[roleId].label }
    sessionStorage.setItem('riskwire_user', JSON.stringify(u))
    setUser(u)
  }, [user])

  const roleInfo = user ? ROLES[user.role] : null

  return (
    <AuthContext.Provider value={{ user, roleInfo, login, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
