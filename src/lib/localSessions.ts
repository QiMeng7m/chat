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

export function sessionTitleFromMessage(text: string): string {
  const trimmed = text.trim()
  if (!trimmed) return '新对话'
  return trimmed.length > 30 ? `${trimmed.slice(0, 30)}…` : trimmed
}
