import { clearAccessToken, request, setAccessToken } from './http.ts'
import type { AuthResponse, UserPublic } from './types.ts'

export async function login(email: string, password: string): Promise<AuthResponse> {
  const data = await request<AuthResponse>('/api/auth/login', {
    method: 'POST',
    auth: false,
    body: { email, password },
  })
  setAccessToken(data.accessToken)
  return data
}

export async function register(email: string, password: string): Promise<AuthResponse> {
  const data = await request<AuthResponse>('/api/auth/register', {
    method: 'POST',
    auth: false,
    body: { email, password },
  })
  setAccessToken(data.accessToken)
  return data
}

export async function logout(): Promise<void> {
  try {
    await request<void>('/api/auth/logout', { method: 'POST' })
  } finally {
    clearAccessToken()
  }
}

export async function getMe(): Promise<UserPublic> {
  const data = await request<{ user: UserPublic }>('/api/auth/me')
  return data.user
}
