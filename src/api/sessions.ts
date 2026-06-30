import { request } from './http.ts'
import type { Paginated, Session, SessionDetail } from './types.ts'

export interface ListSessionsParams {
  page?: number
  pageSize?: number
  q?: string
}

export interface CreateSessionParams {
  title?: string
  defaultModelId?: string
  featureId?: string
}

export interface UpdateSessionParams {
  title?: string
  defaultModelId?: string
  featureId?: string
}

export async function listSessions(
  params: ListSessionsParams = {},
): Promise<Paginated<Session>> {
  const search = new URLSearchParams()
  if (params.page != null) search.set('page', String(params.page))
  if (params.pageSize != null) search.set('pageSize', String(params.pageSize))
  if (params.q) search.set('q', params.q)

  const qs = search.toString()
  return request<Paginated<Session>>(`/api/sessions${qs ? `?${qs}` : ''}`)
}

export async function createSession(params: CreateSessionParams = {}): Promise<Session> {
  return request<Session>('/api/sessions', {
    method: 'POST',
    body: params,
  })
}

export async function getSession(id: string): Promise<SessionDetail> {
  return request<SessionDetail>(`/api/sessions/${encodeURIComponent(id)}`)
}

export async function updateSession(
  id: string,
  params: UpdateSessionParams,
): Promise<Session> {
  return request<Session>(`/api/sessions/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: params,
  })
}

export async function deleteSession(id: string): Promise<void> {
  await request<void>(`/api/sessions/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}
