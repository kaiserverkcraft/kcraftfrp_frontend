import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { isAuthenticated, isAdmin } from './lib/auth'
import MainLayout from './components/layout/MainLayout'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ProxiesPage from './pages/ProxiesPage'
import ServerStatusPage from './pages/ServerStatusPage'
import NodesPage from './pages/NodesPage'
import AdminTunnelsPage from './pages/AdminTunnelsPage'
import NodeManagementPage from './pages/NodeManagementPage'
import InviteCodesPage from './pages/InviteCodesPage'
import UserManagementPage from './pages/UserManagementPage'
import GroupManagementPage from './pages/GroupManagementPage'
import UserInfoPage from './pages/UserInfoPage'

function PrivateRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const location = useLocation()
  
  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  
  if (adminOnly && !isAdmin()) {
    return <Navigate to="/dashboard" replace />
  }
  
  return <>{children}</>
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<Navigate to="/login" replace />} />
      <Route
        path="/app"
        element={
          <PrivateRoute>
            <MainLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/app/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="proxies" element={<ProxiesPage />} />
        <Route path="server-status" element={<ServerStatusPage />} />
        <Route path="nodes" element={<NodesPage />} />
        <Route path="user-info" element={<UserInfoPage />} />
        <Route
          path="admin-tunnels"
          element={
            <PrivateRoute adminOnly>
              <AdminTunnelsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="node-management"
          element={
            <PrivateRoute adminOnly>
              <NodeManagementPage />
            </PrivateRoute>
          }
        />
        <Route
          path="invite-codes"
          element={
            <PrivateRoute adminOnly>
              <InviteCodesPage />
            </PrivateRoute>
          }
        />
        <Route
          path="user-management"
          element={
            <PrivateRoute adminOnly>
              <UserManagementPage />
            </PrivateRoute>
          }
        />
        <Route
          path="group-management"
          element={
            <PrivateRoute adminOnly>
              <GroupManagementPage />
            </PrivateRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
