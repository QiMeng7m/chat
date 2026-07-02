import { request } from './http.ts'
import type { OwnerFact, OwnerProfile } from './types.ts'

export type { OwnerFact, OwnerProfile }

export async function getOwnerProfile(): Promise<OwnerProfile> {
  return request<OwnerProfile>('/api/site/owner-profile', { auth: false })
}

export async function updateOwnerProfile(profile: OwnerProfile): Promise<OwnerProfile> {
  return request<OwnerProfile>('/api/site/owner-profile', {
    method: 'PUT',
    body: profile,
  })
}
