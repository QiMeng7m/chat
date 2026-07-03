import { request } from './http.ts'
import type { UserFact, UserProfile } from './types.ts'

export type { UserFact, UserProfile }

export async function getUserProfile(): Promise<UserProfile> {
  return request<UserProfile>('/api/profile/me')
}

export async function updateUserProfile(profile: UserProfile): Promise<UserProfile> {
  return request<UserProfile>('/api/profile/me', {
    method: 'PUT',
    body: profile,
  })
}
