import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import PolicyCenter from './pages/PolicyCenter'
import ClaimCenter from './pages/ClaimCenter'
import BillingCenter from './pages/BillingCenter'
import RiderDetail from './pages/RiderDetail'
import UserManagement from './pages/UserManagement'
import Analytics from './pages/Analytics'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/policy-center" replace />} />
        <Route path="policy-center" element={<PolicyCenter />} />
        <Route path="policy-center/rider/:riderId" element={<RiderDetail />} />
        <Route path="claim-center" element={<ClaimCenter />} />
        <Route path="billing-center" element={<BillingCenter />} />
        <Route path="user-management" element={<UserManagement />} />
        <Route path="analytics" element={<Analytics />} />
      </Route>
    </Routes>
  )
}
