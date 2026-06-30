import type { Attachment } from '../api/types'

export type MessageRole = 'user' | 'assistant'

export type ChatMessage = {
  id: string
  role: MessageRole
  content: string
  createdAt: number
  streaming?: boolean
  modelId?: string
  attachments?: Attachment[]
}

export type SessionSummary = {
  id: string
  title: string
  featureId: string
  modelId: string
  updatedAt: number
  emoji?: string
}
