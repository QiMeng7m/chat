import { Spin } from 'antd'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { homePathForRole } from '../../lib/userRoles'

export default function RoleAwareHomeRedirect() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="auth-loading">
        <Spin size="large" tip="加载中…" />
      </div>
    )
  }

  return <Navigate to={homePathForRole(user?.role)} replace />
}
