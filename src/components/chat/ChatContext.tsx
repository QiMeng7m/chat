import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { message } from 'antd'
import { streamChat, uploadChatFile } from '../../api/chat'
import { getFeatures } from '../../api/features'
import { ApiError } from '../../api/http'
import { getModels } from '../../api/models'
import {
  createSession as apiCreateSession,
  getSession as apiGetSession,
  listSessions as apiListSessions,
} from '../../api/sessions'
import type { Attachment, FeaturePublic, ModelPublic } from '../../api/types'
import { useAuth } from '../../context/AuthContext'
import {
  loadLocalSessions,
  saveLocalSessions,
  sessionTitleFromMessage,
  type StoredSession,
} from '../../lib/localSessions'
import type { ChatMessage, SessionSummary } from '../../types/chat'

function pickDefaultModel(models: ModelPublic[]): string | null {
  if (!models.length) return null
  return models.find((m) => m.recommended)?.id ?? models[0]!.id
}

function pickDefaultFeature(features: FeaturePublic[]): string | null {
  if (!features.length) return null
  return features.find((f) => f.id === 'tech-qa')?.id ?? features[0]!.id
}

type ChatContextValue = {
  messages: ChatMessage[]
  sessions: SessionSummary[]
  currentSessionId: string | null
  streaming: boolean
  features: FeaturePublic[]
  models: ModelPublic[]
  featureId: string
  modelId: string
  attachments: Attachment[]
  quotaError: string | null
  catalogLoading: boolean
  modelsEmpty: boolean
  canChat: boolean
  sendMessage: (text: string, formData?: Record<string, string>) => Promise<void>
  stopGeneration: () => void
  setFeatureId: (id: string) => void
  setModelId: (id: string) => void
  newSession: () => void
  selectSession: (id: string) => void
  addAttachment: (file: File) => Promise<void>
  removeAttachment: (index: number) => void
  clearQuotaError: () => void
  currentFeature: FeaturePublic | undefined
  currentModel: ModelPublic | undefined
  supportsVision: boolean
  modelLocked: boolean
}

const ChatContext = createContext<ChatContextValue | null>(null)

function createId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/** 前端 localStorage 临时 ID，服务端 cuid 不匹配此格式 */
function isLocalSessionId(id: string): boolean {
  return /^\d+-[a-z0-9]+$/.test(id)
}

function featureEmoji(feature: FeaturePublic | undefined): string {
  return feature?.icon ?? '💬'
}

function toSummary(session: StoredSession, features: FeaturePublic[]): SessionSummary {
  const feature = features.find((f) => f.id === session.featureId)
  return {
    id: session.id,
    title: session.title,
    featureId: session.featureId,
    modelId: session.modelId,
    updatedAt: session.updatedAt,
    emoji: featureEmoji(feature),
  }
}

export function formatSessionMeta(session: StoredSession, features: FeaturePublic[]): string {
  const feature = features.find((f) => f.id === session.featureId)
  const date = new Date(session.updatedAt)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()
  const timeStr = isToday
    ? `今天 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`
    : date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })
  return `${feature?.name ?? '对话'} · ${timeStr}`
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user, quotaRemaining, setQuotaRemaining } = useAuth()
  const userId = user!.id

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [storedSessions, setStoredSessions] = useState<StoredSession[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [streaming, setStreaming] = useState(false)
  const [features, setFeatures] = useState<FeaturePublic[]>([])
  const [models, setModels] = useState<ModelPublic[]>([])
  const [featureId, setFeatureIdState] = useState('')
  const [modelId, setModelIdState] = useState('')
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [quotaError, setQuotaError] = useState<string | null>(null)
  const [catalogLoading, setCatalogLoading] = useState(true)

  const abortRef = useRef<AbortController | null>(null)
  const storedRef = useRef(storedSessions)
  storedRef.current = storedSessions

  const persistLocal = useCallback(
    (sessions: StoredSession[]) => {
      setStoredSessions(sessions)
      saveLocalSessions(userId, sessions)
    },
    [userId],
  )

  const upsertCurrentSession = useCallback(
    (nextMessages: ChatMessage[], title?: string) => {
      if (!currentSessionId) return
      const now = Date.now()
      const existing = storedRef.current.find((s) => s.id === currentSessionId)
      const updated: StoredSession = {
        id: currentSessionId,
        title: title ?? existing?.title ?? '新对话',
        featureId,
        modelId,
        messages: nextMessages.filter((m) => !m.streaming),
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      }
      const rest = storedRef.current.filter((s) => s.id !== currentSessionId)
      persistLocal([updated, ...rest])
    },
    [currentSessionId, featureId, modelId, persistLocal],
  )

  useEffect(() => {
    void (async () => {
      setCatalogLoading(true)
      try {
        const [modelList, featureList] = await Promise.all([getModels(), getFeatures()])
        setModels(modelList)
        setFeatures(featureList)
        if (!modelList.length) {
          message.warning('暂无可用模型，请联系管理员配置 Provider 与模型')
        }
      } catch {
        setModels([])
        setFeatures([])
        message.error('无法加载模型与场景列表，请确认后端已启动')
      } finally {
        setCatalogLoading(false)
      }
    })()
  }, [])

  useEffect(() => {
    if (!models.length) {
      setModelIdState('')
      return
    }
    if (!models.some((m) => m.id === modelId)) {
      const next = pickDefaultModel(models)
      if (next) setModelIdState(next)
    }
  }, [models, modelId])

  useEffect(() => {
    if (!features.length) {
      setFeatureIdState('')
      return
    }
    if (!features.some((f) => f.id === featureId)) {
      const next = pickDefaultFeature(features)
      if (next) setFeatureIdState(next)
    }
  }, [features, featureId])

  useEffect(() => {
    void (async () => {
      try {
        const res = await apiListSessions({ pageSize: 50 })
        const mapped: StoredSession[] = res.items.map((s) => ({
          id: s.id,
          title: s.title,
          featureId: s.featureId ?? featureId,
          modelId: s.defaultModelId ?? modelId,
          messages: [],
          createdAt: new Date(s.createdAt).getTime(),
          updatedAt: new Date(s.updatedAt).getTime(),
        }))
        persistLocal(mapped)
      } catch {
        const cached = loadLocalSessions(userId).filter((s) => !isLocalSessionId(s.id))
        persistLocal(cached)
      }
    })()
  }, [userId, persistLocal])

  const sessions = useMemo(
    () => storedSessions.map((s) => toSummary(s, features)),
    [storedSessions, features],
  )

  const currentFeature = useMemo(
    () => features.find((f) => f.id === featureId),
    [features, featureId],
  )

  const currentModel = useMemo(
    () => models.find((m) => m.id === modelId),
    [models, modelId],
  )

  const modelLocked = currentFeature?.modelPolicy === 'locked'
  const supportsVision = Boolean(currentModel?.supportsVision)

  const setFeatureId = useCallback(
    (id: string) => {
      setFeatureIdState(id)
      const feature = features.find((f) => f.id === id)
      if (feature?.defaultModelId) {
        setModelIdState(feature.defaultModelId)
      }
      if (currentSessionId) {
        const rest = storedRef.current.map((s) =>
          s.id === currentSessionId ? { ...s, featureId: id, updatedAt: Date.now() } : s,
        )
        persistLocal(rest)
      }
    },
    [features, currentSessionId, persistLocal],
  )

  const setModelId = useCallback(
    (id: string) => {
      if (modelLocked) return
      const nextModel = models.find((m) => m.id === id)
      if (!nextModel?.supportsVision) {
        setAttachments([])
      }
      setModelIdState(id)
      if (currentSessionId) {
        const rest = storedRef.current.map((s) =>
          s.id === currentSessionId ? { ...s, modelId: id, updatedAt: Date.now() } : s,
        )
        persistLocal(rest)
      }
    },
    [modelLocked, models, currentSessionId, persistLocal],
  )

  const newSession = useCallback(() => {
    abortRef.current?.abort()
    setStreaming(false)
    setMessages([])
    setAttachments([])
    setCurrentSessionId(null)
  }, [])

  const selectSession = useCallback(
    async (id: string) => {
      abortRef.current?.abort()
      setStreaming(false)
      setCurrentSessionId(id)
      setAttachments([])

      const local = storedRef.current.find((s) => s.id === id)
      if (local?.messages.length) {
        setFeatureIdState(local.featureId)
        setModelIdState(local.modelId)
        setMessages(local.messages)
        return
      }

      if (!isLocalSessionId(id)) {
        try {
          const detail = await apiGetSession(id)
          setFeatureIdState(detail.featureId ?? pickDefaultFeature(features) ?? '')
          setModelIdState(detail.defaultModelId ?? pickDefaultModel(models) ?? '')
          const loaded: ChatMessage[] = detail.messages
            .filter((m) => m.role === 'user' || m.role === 'assistant')
            .map((m) => ({
              id: m.id,
              role: m.role as 'user' | 'assistant',
              content: m.content,
              createdAt: new Date(m.createdAt).getTime(),
              modelId: m.modelId,
              attachments: m.attachments,
            }))
          setMessages(loaded)
          const rest = storedRef.current.map((s) =>
            s.id === id ? { ...s, messages: loaded, updatedAt: Date.now() } : s,
          )
          persistLocal(rest)
          return
        } catch {
          // fall through
        }
      }

      if (local) {
        setFeatureIdState(local.featureId)
        setModelIdState(local.modelId)
        setMessages(local.messages)
      }
    },
    [features, models, persistLocal],
  )

  const stopGeneration = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  const addAttachment = useCallback(
    async (file: File) => {
      if (!supportsVision) {
        message.warning('当前模型不支持图片，请切换到 vision 模型')
        return
      }
      try {
        const attachment = await uploadChatFile(file)
        setAttachments((prev) => [...prev, attachment])
      } catch {
        const url = URL.createObjectURL(file)
        setAttachments((prev) => [
          ...prev,
          { type: 'image', url, mime: file.type, name: file.name },
        ])
      }
    },
    [supportsVision],
  )

  const removeAttachment = useCallback((index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const clearQuotaError = useCallback(() => setQuotaError(null), [])

  const sendMessage = useCallback(
    async (text: string, formData?: Record<string, string>) => {
      const trimmed = text.trim()
      const hasForm = formData && Object.values(formData).some((v) => v.trim())
      const hasAttachments = attachments.length > 0
      if ((!trimmed && !hasForm && !hasAttachments) || streaming) return

      if (!models.length || !modelId || !models.some((m) => m.id === modelId)) {
        message.error('暂无可用模型，无法发送消息')
        return
      }
      if (!featureId) {
        message.error('暂无可用场景')
        return
      }

      if (hasAttachments && !supportsVision) {
        message.warning('当前模型不支持图片，请切换到 vision 模型')
        return
      }

      if (quotaRemaining <= 0) {
        setQuotaError('今日配额已用完，请明天再来或联系管理员～')
        message.error('今日配额已用完')
        return
      }

      let sessionId = currentSessionId
      const needsServerSession = !sessionId || isLocalSessionId(sessionId)
      if (needsServerSession) {
        const previousLocalId = sessionId
        try {
          const created = await apiCreateSession({
            title: '新对话',
            featureId,
            defaultModelId: modelId,
          })
          sessionId = created.id
          setCurrentSessionId(sessionId)
        } catch {
          sessionId = null
          setCurrentSessionId(null)
        }
        if (sessionId) {
          const now = Date.now()
          const initial: StoredSession = {
            id: sessionId,
            title: '新对话',
            featureId,
            modelId,
            messages: [],
            createdAt: now,
            updatedAt: now,
          }
          const rest = storedRef.current.filter(
            (s) => s.id !== sessionId && s.id !== previousLocalId,
          )
          persistLocal([initial, ...rest])
        }
      }

      const displayText =
        trimmed ||
        (hasAttachments ? '请分析这张图片' : '') ||
        (formData
          ? Object.entries(formData)
              .map(([k, v]) => `${k}: ${v}`)
              .join('\n')
          : '')

      const userMessage: ChatMessage = {
        id: createId(),
        role: 'user',
        content: displayText,
        createdAt: Date.now(),
        attachments: attachments.length ? [...attachments] : undefined,
      }
      const assistantId = createId()
      const assistantMessage: ChatMessage = {
        id: assistantId,
        role: 'assistant',
        content: '',
        createdAt: Date.now(),
        streaming: true,
        modelId,
      }

      const nextMessages = [...messages, userMessage, assistantMessage]
      setMessages(nextMessages)
      const previousQuota = quotaRemaining
      setStreaming(true)
      setQuotaRemaining(Math.max(0, previousQuota - 1))
      setAttachments([])
      setQuotaError(null)

      const title = sessionTitleFromMessage(displayText)
      upsertCurrentSession(nextMessages, title)

      const controller = new AbortController()
      abortRef.current = controller

      const appendChunk = (chunk: string) => {
        setMessages((prev) => {
          const updated = prev.map((msg) =>
            msg.id === assistantId ? { ...msg, content: msg.content + chunk } : msg,
          )
          upsertCurrentSession(updated, title)
          return updated
        })
      }

      const finishStream = () => {
        setMessages((prev) => {
          const updated = prev.map((msg) =>
            msg.id === assistantId ? { ...msg, streaming: false } : msg,
          )
          upsertCurrentSession(updated, title)
          return updated
        })
        setStreaming(false)
        abortRef.current = null
      }

      const syncServerSessionId = (serverId: string) => {
        sessionId = serverId
        setCurrentSessionId(serverId)
        const now = Date.now()
        const existing = storedRef.current.find((s) => s.id === serverId)
        const updated: StoredSession = {
          id: serverId,
          title: title ?? existing?.title ?? '新对话',
          featureId,
          modelId,
          messages: existing?.messages ?? [],
          createdAt: existing?.createdAt ?? now,
          updatedAt: now,
        }
        const rest = storedRef.current.filter((s) => s.id !== serverId && !isLocalSessionId(s.id))
        persistLocal([updated, ...rest])
      }

      let streamOk = false
      try {
        for await (const event of streamChat(
          {
            sessionId: sessionId && !isLocalSessionId(sessionId) ? sessionId : undefined,
            model: modelId,
            featureId,
            message: displayText,
            formData,
            attachments: userMessage.attachments,
          },
          { signal: controller.signal },
        )) {
          switch (event.event) {
            case 'session':
              syncServerSessionId(event.data.sessionId)
              break
            case 'content_delta':
              appendChunk(event.data.delta)
              break
            case 'error':
              throw new Error(event.data.message)
            case 'done':
              break
          }
        }
        streamOk = true
      } catch (err) {
        if (controller.signal.aborted) return
        if (err instanceof ApiError && err.status === 429) {
          setQuotaError(err.message || '今日请求次数已达上限')
          message.error('配额不足：' + (err.message || '429'))
          setQuotaRemaining(0)
        } else {
          message.error(err instanceof Error ? err.message : '发送失败')
          setQuotaRemaining(previousQuota)
        }
        setMessages((prev) => {
          const updated = prev.filter((msg) => msg.id !== assistantId)
          upsertCurrentSession(updated, title)
          return updated
        })
      } finally {
        if (controller.signal.aborted) {
          setMessages((prev) => {
            const updated = prev.map((msg) =>
              msg.id === assistantId ? { ...msg, streaming: false } : msg,
            )
            upsertCurrentSession(updated, title)
            return updated
          })
        } else if (streamOk) {
          finishStream()
        }
        setStreaming(false)
        abortRef.current = null
      }
    },
    [
      streaming,
      quotaRemaining,
      currentSessionId,
      featureId,
      modelId,
      models,
      features,
      attachments,
      messages,
      supportsVision,
      setQuotaRemaining,
      persistLocal,
      upsertCurrentSession,
    ],
  )

  const modelsEmpty = models.length === 0
  const canChat =
    !catalogLoading &&
    models.length > 0 &&
    Boolean(modelId) &&
    models.some((m) => m.id === modelId) &&
    Boolean(featureId)

  const value = useMemo(
    () => ({
      messages,
      sessions,
      currentSessionId,
      streaming,
      features,
      models,
      featureId,
      modelId,
      attachments,
      quotaError,
      catalogLoading,
      modelsEmpty,
      canChat,
      sendMessage,
      stopGeneration,
      setFeatureId,
      setModelId,
      newSession,
      selectSession,
      addAttachment,
      removeAttachment,
      clearQuotaError,
      currentFeature,
      currentModel,
      supportsVision,
      modelLocked,
    }),
    [
      messages,
      sessions,
      currentSessionId,
      streaming,
      features,
      models,
      featureId,
      modelId,
      attachments,
      quotaError,
      catalogLoading,
      modelsEmpty,
      canChat,
      sendMessage,
      stopGeneration,
      setFeatureId,
      setModelId,
      newSession,
      selectSession,
      addAttachment,
      removeAttachment,
      clearQuotaError,
      currentFeature,
      currentModel,
      supportsVision,
      modelLocked,
    ],
  )

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export function useChat(): ChatContextValue {
  const ctx = useContext(ChatContext)
  if (!ctx) throw new Error('useChat must be used within ChatProvider')
  return ctx
}
