import type { ChatMessage } from '../types/chat'

export type StoredSession = {
  id: string
  title: string
  featureId: string
  modelId: string
  messages: ChatMessage[]
  createdAt: number
  updatedAt: number
}

const STORAGE_PREFIX = 'mascot-sessions'

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}:${userId}`
}

export function loadLocalSessions(userId: string): StoredSession[] {
  try {
    const raw = localStorage.getItem(storageKey(userId))
    if (!raw) return []
    const parsed = JSON.parse(raw) as StoredSession[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveLocalSessions(userId: string, sessions: StoredSession[]): void {
  localStorage.setItem(storageKey(userId), JSON.stringify(sessions))
}

/** 合并远端列表与本地缓存：保留本地消息，按 updatedAt 排序 */
export function mergeSessions(
  local: StoredSession[],
  remote: StoredSession[],
): StoredSession[] {
  const map = new Map<string, StoredSession>()

  for (const s of remote) {
    map.set(s.id, { ...s })
  }

  for (const s of local) {
    const existing = map.get(s.id)
    if (!existing) {
      map.set(s.id, { ...s })
      continue
    }
    map.set(s.id, {
      ...existing,
      title: s.title !== '新对话' ? s.title : existing.title,
      featureId: s.featureId || existing.featureId,
      modelId: s.modelId || existing.modelId,
      messages: s.messages.length > 0 ? s.messages : existing.messages,
      updatedAt: Math.max(s.updatedAt, existing.updatedAt),
      createdAt: Math.min(s.createdAt, existing.createdAt),
    })
  }

  return Array.from(map.values()).sort((a, b) => b.updatedAt - a.updatedAt)
}

export function sessionTitleFromMessage(text: string): string {
  const trimmed = text.trim()
  if (!trimmed) return '新对话'
  return trimmed.length > 30 ? `${trimmed.slice(0, 30)}…` : trimmed
}
