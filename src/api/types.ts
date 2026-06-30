/** AI 对话工具 — 前后端共享类型（对齐 docs/API-PROTOCOL.md） */

export type UserRole = 'admin' | 'user'

export interface UserPublic {
  id: string
  email: string
  role: UserRole
  dailyQuota: number
  createdAt: string
}

export type ModelTag = 'fast' | 'strong' | 'code' | 'vision' | 'cheap'
export type CostTier = 'free' | 'low' | 'high'
export type ModelPolicy = 'locked' | 'recommended' | 'free'
export type FeatureCategory = 'chat' | 'code' | 'doc' | 'image' | 'other'
export type MessageRole = 'user' | 'assistant' | 'system'

export interface ModelPublic {
  id: string
  label: string
  description?: string
  tags: ModelTag[]
  supportsVision: boolean
  supportsStream: boolean
  costTier: CostTier
  recommended?: boolean
}

export interface UiField {
  key: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'number'
  required?: boolean
  placeholder?: string
  options?: { label: string; value: string }[]
}

export interface UiSchema {
  type: 'plain' | 'form'
  fields?: UiField[]
}

export interface FeaturePublic {
  id: string
  name: string
  description: string
  icon?: string
  category: FeatureCategory
  modelPolicy: ModelPolicy
  defaultModelId?: string
  uiSchema?: UiSchema
}

export interface Attachment {
  type: 'image'
  url: string
  mime?: string
  name?: string
}

export interface Message {
  id: string
  sessionId: string
  role: MessageRole
  content: string
  modelId?: string
  attachments?: Attachment[]
  createdAt: string
}

export interface Session {
  id: string
  title: string
  defaultModelId?: string
  featureId?: string
  createdAt: string
  updatedAt: string
}

export interface SessionDetail extends Session {
  messages: Message[]
}

export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export interface ApiErrorBody {
  error: {
    code: string
    message: string
    details?: unknown
  }
}

export interface AuthResponse {
  user: UserPublic
  accessToken: string
}

export interface ChatRequest {
  sessionId?: string
  model: string
  featureId?: string
  message: string
  formData?: Record<string, string>
  attachments?: Attachment[]
  regenerate?: boolean
  editMessageId?: string
}

export interface MessageStart {
  messageId: string
  model: string
  featureId?: string
}

export interface MessageEnd {
  messageId: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

export type ChatStreamEvent =
  | { event: 'session'; data: { sessionId: string } }
  | { event: 'message_start'; data: MessageStart }
  | { event: 'content_delta'; data: { delta: string } }
  | { event: 'message_end'; data: MessageEnd }
  | { event: 'error'; data: { code: string; message: string } }
  | { event: 'done'; data: Record<string, never> }

export interface ProviderAdmin {
  id: string
  name: string
  type: string
  baseURL: string
  enabled: boolean
  apiKeyMasked: string
  createdAt: string
}

export interface ModelAdmin {
  id: string
  providerId: string
  modelId: string
  label: string
  description?: string
  tags: ModelTag[]
  supportsVision: boolean
  costTier: CostTier
  enabled: boolean
  sortOrder: number
}

export interface FeatureAdmin extends FeaturePublic {
  systemPrompt: string
  userPromptTemplate?: string
  temperature?: number
  maxTokens?: number
  enabled: boolean
  sortOrder: number
}

export interface UserAdmin extends UserPublic {
  enabled: boolean
  todayUsage?: number
}

export interface AdminStats {
  date: string
  totalRequests: number
  activeUsers: number
  errorCount: number
  topModels: { modelId: string; count: number }[]
}

export interface Post {
  id: number
  title: string
  summary: string
  createdAt: string
}
