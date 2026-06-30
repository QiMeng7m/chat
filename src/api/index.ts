export { ApiError, clearAccessToken, getAccessToken, request } from './http.ts'
export * from './types.ts'
export * from './auth.ts'
export * from './models.ts'
export * from './features.ts'
export * from './sessions.ts'
export * from './chat.ts'
export * from './admin.ts'

export async function fetchPosts(): Promise<import('./types.ts').Post[]> {
  const res = await fetch('/api/posts')
  if (!res.ok) throw new Error('获取文章失败')
  return res.json()
}

export async function fetchHealth(): Promise<{ status: string; timestamp: string }> {
  const res = await fetch('/api/health')
  if (!res.ok) throw new Error('服务不可用')
  return res.json()
}
