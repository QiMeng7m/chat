import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { getMe, login as apiLogin, logout as apiLogout } from '../api/auth'
import { clearAccessToken, getAccessToken } from '../api/http'
import type { UserPublic } from '../api/types'

type AuthContextValue = {
  user: UserPublic | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  quotaRemaining: number
  quotaTotal: number
  setQuotaRemaining: (value: number) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserPublic | null>(null)
  const [loading, setLoading] = useState(true)
  const [quotaRemaining, setQuotaRemaining] = useState(100)
  const [quotaTotal, setQuotaTotal] = useState(100)

  const applyUser = useCallback((next: UserPublic | null) => {
    setUser(next)
    if (next) {
      setQuotaTotal(next.dailyQuota)
      setQuotaRemaining(next.dailyQuota)
    }
  }, [])

  const refreshUser = useCallback(async () => {
    const token = getAccessToken()
    if (!token) {
      applyUser(null)
      return
    }
    try {
      const me = await getMe()
      applyUser(me)
    } catch {
      clearAccessToken()
      applyUser(null)
    }
  }, [applyUser])

  useEffect(() => {
    void (async () => {
      try {
        await refreshUser()
      } finally {
        setLoading(false)
      }
    })()
  }, [refreshUser])

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await apiLogin(email.trim(), password)
      applyUser(res.user)
    },
    [applyUser],
  )

  const logout = useCallback(async () => {
    try {
      if (getAccessToken()) {
        await apiLogout()
      }
    } catch {
      // token 已失效时仍清除本地状态
    } finally {
      clearAccessToken()
      applyUser(null)
    }
  }, [applyUser])

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
      refreshUser,
      quotaRemaining,
      quotaTotal,
      setQuotaRemaining,
    }),
    [user, loading, login, logout, refreshUser, quotaRemaining, quotaTotal],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
