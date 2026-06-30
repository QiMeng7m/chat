import { getAccessToken, parseApiError } from './http.ts'
import type {
  Attachment,
  ChatRequest,
  ChatStreamEvent,
  MessageEnd,
  MessageStart,
} from './types.ts'

const SSE_FIELD_SEPARATOR = '\n'

/**
 * 解析 SSE 字节流为结构化事件（支持 POST fetch 流式响应）
 */
export async function* parseSseStream(
  body: ReadableStream<Uint8Array>,
): AsyncGenerator<ChatStreamEvent> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const chunks = buffer.split('\n\n')
      buffer = chunks.pop() ?? ''

      for (const chunk of chunks) {
        const event = parseSseChunk(chunk)
        if (event) yield event
      }
    }

    if (buffer.trim()) {
      const event = parseSseChunk(buffer)
      if (event) yield event
    }
  } finally {
    reader.releaseLock()
  }
}

function parseSseChunk(chunk: string): ChatStreamEvent | null {
  let eventName = 'message'
  const dataLines: string[] = []

  for (const line of chunk.split(SSE_FIELD_SEPARATOR)) {
    if (line.startsWith('event:')) {
      eventName = line.slice(6).trim()
    } else if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trim())
    }
  }

  if (dataLines.length === 0) return null

  const raw = dataLines.join('\n')
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return null
  }

  switch (eventName) {
    case 'session':
      return { event: 'session', data: data as { sessionId: string } }
    case 'message_start':
      return { event: 'message_start', data: data as MessageStart }
    case 'content_delta':
      return { event: 'content_delta', data: data as { delta: string } }
    case 'message_end':
      return { event: 'message_end', data: data as MessageEnd }
    case 'error':
      return { event: 'error', data: data as { code: string; message: string } }
    case 'done':
      return { event: 'done', data: {} }
    default:
      return null
  }
}

export interface StreamChatOptions {
  signal?: AbortSignal
  onEvent?: (event: ChatStreamEvent) => void
}

/**
 * 流式对话：逐条 yield SSE 事件
 */
export async function* streamChat(
  req: ChatRequest,
  options: StreamChatOptions = {},
): AsyncGenerator<ChatStreamEvent> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'text/event-stream',
  }

  const token = getAccessToken()
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const res = await fetch('/api/chat', {
    method: 'POST',
    headers,
    body: JSON.stringify(req),
    signal: options.signal,
  })

  if (!res.ok) {
    throw await parseApiError(res)
  }

  if (!res.body) {
    throw new Error('响应体为空，无法读取 SSE 流')
  }

  for await (const event of parseSseStream(res.body)) {
    options.onEvent?.(event)
    yield event
  }
}

export interface StreamChatResult {
  sessionId?: string
  messageId?: string
  content: string
  model?: string
  usage?: { promptTokens: number; completionTokens: number; totalTokens: number }
}

/**
 * 高层封装：消费流式对话并拼接完整 assistant 文本
 */
export async function streamChatCollect(
  req: ChatRequest,
  options: StreamChatOptions = {},
): Promise<StreamChatResult> {
  const result: StreamChatResult = { content: '' }

  for await (const event of streamChat(req, options)) {
    switch (event.event) {
      case 'session':
        result.sessionId = event.data.sessionId
        break
      case 'message_start':
        result.messageId = event.data.messageId
        result.model = event.data.model
        break
      case 'content_delta':
        result.content += event.data.delta
        break
      case 'message_end':
        result.usage = event.data.usage
        break
      case 'error':
        throw new Error(event.data.message)
      case 'done':
        break
    }
  }

  return result
}

export async function uploadChatFile(file: File): Promise<Attachment> {
  const form = new FormData()
  form.append('file', file)

  const headers: Record<string, string> = {}
  const token = getAccessToken()
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const res = await fetch('/api/chat/upload', {
    method: 'POST',
    headers,
    body: form,
  })

  if (!res.ok) {
    throw await parseApiError(res)
  }

  const data = (await res.json()) as { attachment: Attachment }
  return data.attachment
}
