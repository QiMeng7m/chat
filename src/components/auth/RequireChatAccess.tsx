import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import RequireAuth from './RequireAuth'

export default function RequireChatAccess({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()

  return (
    <RequireAuth>
      {user?.role === 'runner' ? <Navigate to="/lottery" replace /> : children}
    </RequireAuth>
  )
}
