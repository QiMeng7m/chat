import { request } from './http.ts'
import type { OwnerFact, OwnerKbSyncResponse, OwnerProfile, OwnerProfileUpdate } from './types.ts'

export type { OwnerFact, OwnerProfile }

export async function getOwnerProfile(): Promise<OwnerProfile> {
  return request<OwnerProfile>('/api/site/owner-profile', { auth: false })
}

export async function updateOwnerProfile(profile: OwnerProfileUpdate): Promise<OwnerProfile> {
  return request<OwnerProfile>('/api/site/owner-profile', {
    method: 'PUT',
    body: profile,
  })
}

/** 手动触发：当前 profile → owner-public《基本信息》索引 */
export async function syncOwnerProfileKb(): Promise<OwnerKbSyncResponse> {
  return request<OwnerKbSyncResponse>('/api/site/owner-profile/sync-kb', {
    method: 'POST',
  })
}

/** 粘贴/更新简历正文至 owner-public《简历》并 reindex */
export async function updateOwnerResume(
  content: string,
  title = '简历',
): Promise<OwnerKbSyncResponse> {
  return request<OwnerKbSyncResponse>('/api/site/owner-profile/resume', {
    method: 'PUT',
    body: { content, title },
  })
}
