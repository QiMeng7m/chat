import { request } from './http.ts'
import type { ModelPublic } from './types.ts'

export async function getModels(): Promise<ModelPublic[]> {
  const data = await request<{ items: ModelPublic[] }>('/api/models')
  return data.items
}
