import { Spin } from 'antd'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import RequireAuth from './RequireAuth'

export default function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="auth-loading">
        <Spin size="large" tip="加载中…" />
      </div>
    )
  }

  return (
    <RequireAuth>
      {user?.role === 'admin' ? children : <Navigate to="/chat" replace />}
    </RequireAuth>
  )
}
