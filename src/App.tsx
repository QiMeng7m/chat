import { useCallback, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import RequireAdmin from './components/auth/RequireAdmin'
import RequireAuth from './components/auth/RequireAuth'
import { ChatProvider } from './components/chat/ChatContext'
import AdminLayout from './components/layout/AdminLayout'
import AppLayout from './components/layout/AppLayout'
import AdminFeaturesPage from './pages/admin/AdminFeaturesPage'
import AdminModelsPage from './pages/admin/AdminModelsPage'
import AdminOverviewPage from './pages/admin/AdminOverviewPage'
import AdminProvidersPage from './pages/admin/AdminProvidersPage'
import AdminUsersPage from './pages/admin/AdminUsersPage'
import ChatPage from './pages/ChatPage'
import LoginPage from './pages/LoginPage'
import SettingsPage from './pages/SettingsPage'

function AdminShell() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const closeDrawer = useCallback(() => setDrawerOpen(false), [])
  const toggleDrawer = useCallback(() => setDrawerOpen((o) => !o), [])

  return (
    <AdminLayout
      drawerOpen={drawerOpen}
      onMenuClick={toggleDrawer}
      onCloseDrawer={closeDrawer}
    />
  )
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route
        path="/chat"
        element={
          <RequireAuth>
            <ChatProvider>
              <AppLayout />
            </ChatProvider>
          </RequireAuth>
        }
      >
        <Route index element={<ChatPage />} />
      </Route>
      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <AdminShell />
          </RequireAdmin>
        }
      >
        <Route index element={<AdminOverviewPage />} />
        <Route path="providers" element={<AdminProvidersPage />} />
        <Route path="models" element={<AdminModelsPage />} />
        <Route path="features" element={<AdminFeaturesPage />} />
        <Route path="users" element={<AdminUsersPage />} />
      </Route>
      <Route path="/" element={<Navigate to="/chat" replace />} />
      <Route path="*" element={<Navigate to="/chat" replace />} />
    </Routes>
  )
}

export default App
