import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth, ROLES } from './context/AuthContext'
import { NotificationsProvider } from './context/NotificationsContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import PolicyCenter from './pages/PolicyCenter'
import ClaimCenter from './pages/ClaimCenter'
import BillingCenter from './pages/BillingCenter'
import RiderDetail from './pages/RiderDetail'
import UserManagement from './pages/UserManagement'
import Analytics from './pages/Analytics'

import FraudAudit from './pages/FraudAudit'

// Guard: redirect to /login if not authenticated
function ProtectedRoute({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return children
}

// Guard: redirect to first allowed route if this route isn't permitted for the role
function RoleRoute({ routeKey, children }) {
  const { roleInfo } = useAuth()
  const allowed = roleInfo?.allowedRoutes || []
  if (!allowed.includes(routeKey)) {
    const first = allowed[0]
    return <Navigate to={first ? `/${first}` : '/login'} replace />
  }
  return children
}

function AppRoutes() {
  const { user, roleInfo } = useAuth()

  // When logged-in root (/), redirect to first allowed route
  const defaultRoute = roleInfo?.allowedRoutes?.[0] || 'policy-center'

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={`/${defaultRoute}`} replace /> : <Login />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <NotificationsProvider>
              <Layout />
            </NotificationsProvider>
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to={defaultRoute} replace />} />
        <Route path="policy-center" element={<RoleRoute routeKey="policy-center"><PolicyCenter /></RoleRoute>} />
        <Route path="policy-center/rider/:riderId" element={<RoleRoute routeKey="policy-center"><RiderDetail /></RoleRoute>} />
        <Route path="claim-center" element={<RoleRoute routeKey="claim-center"><ClaimCenter /></RoleRoute>} />
        <Route path="billing-center" element={<RoleRoute routeKey="billing-center"><BillingCenter /></RoleRoute>} />
        <Route path="user-management" element={<RoleRoute routeKey="user-management"><UserManagement /></RoleRoute>} />
        <Route path="analytics" element={<RoleRoute routeKey="analytics"><Analytics /></RoleRoute>} />
        <Route path="fraud-audit" element={<RoleRoute routeKey="fraud-audit"><FraudAudit /></RoleRoute>} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
