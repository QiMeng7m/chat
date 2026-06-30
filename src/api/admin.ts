import { request } from './http.ts'
import type {
  AdminStats,
  FeatureAdmin,
  ModelAdmin,
  ProviderAdmin,
  UserAdmin,
} from './types.ts'

// —— Provider ——

export async function listProviders(): Promise<ProviderAdmin[]> {
  const data = await request<{ items: ProviderAdmin[] }>('/api/admin/providers')
  return data.items
}

export interface CreateProviderParams {
  name: string
  type?: string
  baseURL: string
  apiKey: string
  enabled?: boolean
}

export async function createProvider(params: CreateProviderParams): Promise<ProviderAdmin> {
  return request<ProviderAdmin>('/api/admin/providers', {
    method: 'POST',
    body: { type: 'openai-compat', enabled: true, ...params },
  })
}

export interface UpdateProviderParams {
  name?: string
  baseURL?: string
  apiKey?: string
  enabled?: boolean
}

export async function updateProvider(
  id: string,
  params: UpdateProviderParams,
): Promise<ProviderAdmin> {
  return request<ProviderAdmin>(`/api/admin/providers/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: params,
  })
}

export async function deleteProvider(id: string): Promise<void> {
  await request<void>(`/api/admin/providers/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

export async function testProvider(
  id: string,
): Promise<{ ok: boolean; latencyMs: number }> {
  return request<{ ok: boolean; latencyMs: number }>(
    `/api/admin/providers/${encodeURIComponent(id)}/test`,
    { method: 'POST' },
  )
}

// —— Model ——

export async function listAdminModels(): Promise<ModelAdmin[]> {
  const data = await request<{ items: ModelAdmin[] }>('/api/admin/models')
  return data.items
}

export interface CreateModelParams {
  providerId: string
  modelId: string
  label: string
  description?: string
  tags?: ModelAdmin['tags']
  supportsVision?: boolean
  costTier?: ModelAdmin['costTier']
  enabled?: boolean
  sortOrder?: number
}

export async function createModel(params: CreateModelParams): Promise<ModelAdmin> {
  return request<ModelAdmin>('/api/admin/models', {
    method: 'POST',
    body: {
      tags: [],
      supportsVision: false,
      costTier: 'low',
      enabled: true,
      sortOrder: 0,
      ...params,
    },
  })
}

export async function updateModel(
  id: string,
  params: Partial<CreateModelParams>,
): Promise<ModelAdmin> {
  return request<ModelAdmin>(`/api/admin/models/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: params,
  })
}

export async function deleteModel(id: string): Promise<void> {
  await request<void>(`/api/admin/models/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

// —— Feature ——

export async function listAdminFeatures(): Promise<FeatureAdmin[]> {
  const data = await request<{ items: FeatureAdmin[] }>('/api/admin/features')
  return data.items
}

export type CreateFeatureParams = Omit<FeatureAdmin, 'id'> & { id: string }

export async function createFeature(params: CreateFeatureParams): Promise<FeatureAdmin> {
  return request<FeatureAdmin>('/api/admin/features', {
    method: 'POST',
    body: params,
  })
}

export async function updateFeature(
  id: string,
  params: Partial<CreateFeatureParams>,
): Promise<FeatureAdmin> {
  return request<FeatureAdmin>(`/api/admin/features/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: params,
  })
}

export async function deleteFeature(id: string): Promise<void> {
  await request<void>(`/api/admin/features/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

// —— User ——

export async function listUsers(): Promise<UserAdmin[]> {
  const data = await request<{ items: UserAdmin[] }>('/api/admin/users')
  return data.items
}

export interface CreateUserParams {
  email: string
  password: string
  role?: 'admin' | 'user'
  dailyQuota?: number
}

export async function createUser(params: CreateUserParams): Promise<UserAdmin> {
  return request<UserAdmin>('/api/admin/users', {
    method: 'POST',
    body: { role: 'user', dailyQuota: 100, ...params },
  })
}

export interface UpdateUserParams {
  role?: 'admin' | 'user'
  dailyQuota?: number
  enabled?: boolean
}

export async function updateUser(id: string, params: UpdateUserParams): Promise<UserAdmin> {
  return request<UserAdmin>(`/api/admin/users/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: params,
  })
}

// —— Stats ——

export async function getAdminStats(date?: string): Promise<AdminStats> {
  const qs = date ? `?date=${encodeURIComponent(date)}` : ''
  return request<AdminStats>(`/api/admin/stats${qs}`)
}
