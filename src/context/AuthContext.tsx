import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { getMe, login as apiLogin, logout as apiLogout, register as apiRegister } from '../api/auth'
import type { UserPublic } from '../api/types'

type AuthContextValue = {
  user: UserPublic | null
  loading: boolean
  login: (username: string, password: string, turnstileToken?: string) => Promise<UserPublic>
  register: (username: string, password: string, turnstileToken?: string) => Promise<void>
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
  const [quotaRemaining, setQuotaRemaining] = useState(0)
  const [quotaTotal, setQuotaTotal] = useState(0)

  const applyUser = useCallback((next: UserPublic | null) => {
    setUser(next)
    if (next) {
      setQuotaTotal(next.quotaLimit)
      setQuotaRemaining(next.quotaRemaining)
    }
  }, [])

  const refreshUser = useCallback(async () => {
    try {
      const me = await getMe()
      applyUser(me)
    } catch {
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
    async (username: string, password: string, turnstileToken?: string) => {
      const res = await apiLogin(username.trim(), password, turnstileToken)
      applyUser(res.user)
      return res.user
    },
    [applyUser],
  )

  const register = useCallback(
    async (username: string, password: string, turnstileToken?: string) => {
      const res = await apiRegister(username.trim(), password, turnstileToken)
      applyUser(res.user)
    },
    [applyUser],
  )

  const logout = useCallback(async () => {
    try {
      await apiLogout()
    } catch {
      // Cookie 已失效时仍清除本地状态
    } finally {
      applyUser(null)
    }
  }, [applyUser])

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      refreshUser,
      quotaRemaining,
      quotaTotal,
      setQuotaRemaining,
    }),
    [user, loading, login, register, logout, refreshUser, quotaRemaining, quotaTotal],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
