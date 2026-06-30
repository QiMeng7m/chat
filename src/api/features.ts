import { request } from './http.ts'
import type { FeaturePublic } from './types.ts'

export async function getFeatures(): Promise<FeaturePublic[]> {
  const data = await request<{ items: FeaturePublic[] }>('/api/features')
  return data.items
}
