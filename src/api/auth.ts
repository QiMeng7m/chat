import { clearAccessToken, request, setAccessToken } from './http.ts'
import type { AuthResponse, UserPublic } from './types.ts'

export type CaptchaConfig = {
  enabled: boolean
  siteKey?: string
}

export async function getCaptchaConfig(): Promise<CaptchaConfig> {
  return request<CaptchaConfig>('/api/auth/captcha-config', { auth: false })
}

export async function login(
  username: string,
  password: string,
  turnstileToken?: string,
): Promise<AuthResponse> {
  const data = await request<AuthResponse>('/api/auth/login', {
    method: 'POST',
    auth: false,
    body: { username, password, turnstileToken },
  })
  setAccessToken(data.accessToken)
  return data
}

export async function register(
  username: string,
  password: string,
  turnstileToken?: string,
): Promise<AuthResponse> {
  const data = await request<AuthResponse>('/api/auth/register', {
    method: 'POST',
    auth: false,
    body: { username, password, turnstileToken },
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
