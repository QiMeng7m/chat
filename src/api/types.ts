/** AI 对话工具 — 前后端共享类型（对齐 docs/API-PROTOCOL.md） */

export type UserRole = 'admin' | 'user'

export interface UserPublic {
  id: string
  username: string
  role: UserRole
  quotaLimit: number
  quotaUsed: number
  quotaRemaining: number
  proAccess: boolean
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
  /** 为 true 时需用户 proAccess 或 admin 角色方可选用 */
  requiresPermission?: boolean
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

/** 用户端可选知识库摘要（不含 embedding、文档正文） */
export interface KnowledgeBaseOption {
  id: string
  name: string
  description?: string
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
  /** RAG 场景：是否启用知识库检索（Phase 4） */
  ragEnabled?: boolean
  /** 用户可选的公开知识库列表 */
  ragKbOptions?: KnowledgeBaseOption[]
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

export interface CitationItem {
  index: number
  documentId: string
  title: string
  excerpt?: string
  sourceType?: string
  sourceRef?: string
}

export interface MessageEnd {
  messageId: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  citations?: CitationItem[]
}

export type ChatStreamEvent =
  | { event: 'session'; data: { sessionId: string } }
  | { event: 'message_start'; data: MessageStart }
  | { event: 'citations'; data: { items: CitationItem[] } }
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
  requiresPermission: boolean
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
  registeredIp?: string
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

export type OwnerFact = {
  id: string
  topic: string
  content: string
}

export type OwnerProfile = {
  version: 1
  nicknames: string[]
  realName?: string
  title: string
  summary: string
  facts: OwnerFact[]
  updatedAt: number
}

/** PUT owner-profile 可选：保存后同步至 owner-public KB */
export type OwnerProfileUpdate = OwnerProfile & {
  syncKb?: boolean
}

/** sync-kb / resume 异步索引响应 */
export interface OwnerKbSyncResponse {
  documentId: string
  kbId: string
  status: 'pending' | 'indexing' | 'indexed' | 'failed'
  chunkCount?: number
  errorMsg?: string
}

export type UserFact = {
  id: string
  topic: string
  content: string
}

/** 登录用户的自我介绍与结构化记忆 */
export type UserProfile = {
  version: 1
  realName?: string
  nicknames: string[]
  summary: string
  facts: UserFact[]
  updatedAt: number
}
