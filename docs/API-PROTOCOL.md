# AI 对话工具 — 前后端接口协议

> **文档版本**：v1.0  
> **日期**：2026-06-18  
> **Base URL**：开发 `http://localhost:3000` · 生产 `/api` 经 Nginx 反代  
> **关联**：[PRD-FEATURES.md](./PRD-FEATURES.md) · [UI-DESIGN-PLAN.md](./UI-DESIGN-PLAN.md) · [DESIGN.md](./DESIGN.md)

---

## 1. 通用约定

### 1.1 传输与格式

| 项 | 约定 |
|----|------|
| 编码 | UTF-8 |
| JSON 字段 | **camelCase** |
| 时间 | ISO 8601 UTC，如 `2026-06-18T08:00:00.000Z` |
| 空值 | 响应中省略 `null` 字段（可选）或显式 `null`（实现统一即可） |

### 1.2 认证

除标注「公开」外，请求需携带：

```
Authorization: Bearer <accessToken>
```

或使用 httpOnly Cookie `accessToken`（前后端择一，推荐 Cookie + CSRF）。

**开发模式**：`AUTH_DISABLED=true` 时跳过鉴权，服务端注入 `{ id: 'dev', role: 'admin' }`。

### 1.3 统一错误响应

HTTP 4xx/5xx 时 body：

```typescript
interface ApiError {
  error: {
    code: string       // 机器可读，如 "RATE_LIMITED"
    message: string    // 用户可见中文
    details?: unknown  // 调试信息，生产可省略
  }
}
```

**常见 error.code**

| code | HTTP | 说明 |
|------|------|------|
| `UNAUTHORIZED` | 401 | 未登录或 token 无效 |
| `FORBIDDEN` | 403 | 无权限（非 admin、账号禁用） |
| `NOT_FOUND` | 404 | 资源不存在 |
| `VALIDATION_ERROR` | 400 | 参数校验失败 |
| `RATE_LIMITED` | 429 | 日限额或 IP 限流 |
| `MODEL_UNAVAILABLE` | 503 | 模型或 Provider 已禁用 |
| `PROVIDER_ERROR` | 502 | 上游 LLM 失败 |
| `VISION_NOT_SUPPORTED` | 400 | 模型不支持图片 |
| `INTERNAL_ERROR` | 500 | 未预期错误 |

### 1.4 分页（列表接口）

Query：

```
?page=1&pageSize=20
```

响应：

```typescript
interface Paginated<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}
```

---

## 2. 类型定义（共享）

```typescript
// —— 用户 ——
type UserRole = 'admin' | 'user'

interface UserPublic {
  id: string
  email: string
  role: UserRole
  dailyQuota: number
  createdAt: string
}

// —— 模型 ——
type ModelTag = 'fast' | 'strong' | 'code' | 'vision' | 'cheap'
type CostTier = 'free' | 'low' | 'high'
type ModelPolicy = 'locked' | 'recommended' | 'free'

interface ModelPublic {
  id: string              // 全局唯一，如 "deepseek/deepseek-chat"
  label: string
  description?: string
  tags: ModelTag[]
  supportsVision: boolean
  supportsStream: boolean
  costTier: CostTier
  recommended?: boolean
}

// —— Feature ——
type FeatureCategory = 'chat' | 'code' | 'doc' | 'image' | 'other'

interface UiField {
  key: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'number'
  required?: boolean
  placeholder?: string
  options?: { label: string; value: string }[]
}

interface UiSchema {
  type: 'plain' | 'form'
  fields?: UiField[]
}

interface FeaturePublic {
  id: string
  name: string
  description: string
  icon?: string
  category: FeatureCategory
  modelPolicy: ModelPolicy
  defaultModelId?: string
  uiSchema?: UiSchema
}

// —— 会话与消息 ——
type MessageRole = 'user' | 'assistant' | 'system'

interface Attachment {
  type: 'image'
  url: string
  mime?: string
  name?: string
}

interface Message {
  id: string
  sessionId: string
  role: MessageRole
  content: string
  modelId?: string        // assistant 消息
  attachments?: Attachment[]
  createdAt: string
}

interface Session {
  id: string
  title: string
  defaultModelId?: string
  featureId?: string
  createdAt: string
  updatedAt: string
}

interface SessionDetail extends Session {
  messages: Message[]
}
```

---

## 3. 认证接口

### 3.1 `POST /api/auth/register`（公开 · 可关闭）

**请求**

```json
{
  "email": "user@example.com",
  "password": "至少8位"
}
```

**响应 201**

```json
{
  "user": { "id": "...", "email": "...", "role": "user", "dailyQuota": 100, "createdAt": "..." },
  "accessToken": "eyJ..."
}
```

### 3.2 `POST /api/auth/login`（公开）

**请求**

```json
{
  "email": "user@example.com",
  "password": "..."
}
```

**响应 200**：同 register。

### 3.3 `GET /api/auth/me`

**响应 200**

```json
{
  "user": { "id": "...", "email": "...", "role": "admin", "dailyQuota": 100, "createdAt": "..." }
}
```

### 3.4 `POST /api/auth/logout`

清除 Cookie / 客户端丢弃 token。**响应 204**。

---

## 4. 用户端 — 模型与 Feature

### 4.1 `GET /api/models`

返回当前用户可用的已启用模型。

**响应 200**

```json
{
  "items": [
    {
      "id": "deepseek/deepseek-chat",
      "label": "DeepSeek Chat",
      "description": "通用对话，速度快",
      "tags": ["fast", "code"],
      "supportsVision": false,
      "supportsStream": true,
      "costTier": "low",
      "recommended": true
    }
  ]
}
```

### 4.2 `GET /api/features`

**响应 200**

```json
{
  "items": [
    {
      "id": "tech-qa",
      "name": "技术问答",
      "description": "粘贴代码或报错，获得解释与修复建议",
      "icon": "code",
      "category": "code",
      "modelPolicy": "recommended",
      "defaultModelId": "deepseek/deepseek-chat",
      "uiSchema": { "type": "plain" }
    },
    {
      "id": "doc-generate",
      "name": "文档生成",
      "description": "根据要点生成结构化 Markdown",
      "icon": "file",
      "category": "doc",
      "modelPolicy": "recommended",
      "defaultModelId": "deepseek/deepseek-chat",
      "uiSchema": {
        "type": "form",
        "fields": [
          { "key": "title", "label": "标题", "type": "text", "required": true },
          { "key": "docType", "label": "类型", "type": "select", "options": [
            { "label": "技术方案", "value": "tech" },
            { "label": "会议纪要", "value": "meeting" }
          ]},
          { "key": "points", "label": "要点", "type": "textarea", "required": true }
        ]
      }
    }
  ]
}
```

---

## 5. 用户端 — 会话

### 5.1 `GET /api/sessions`

**Query**：`page`, `pageSize`, `q`（标题搜索，可选）

**响应 200**

```json
{
  "items": [
    {
      "id": "sess_abc",
      "title": "如何实现 SSE",
      "defaultModelId": "deepseek/deepseek-chat",
      "featureId": "tech-qa",
      "createdAt": "...",
      "updatedAt": "..."
    }
  ],
  "total": 1,
  "page": 1,
  "pageSize": 20
}
```

### 5.2 `POST /api/sessions`

**请求**

```json
{
  "title": "新对话",
  "defaultModelId": "deepseek/deepseek-chat",
  "featureId": "free-chat"
}
```

**响应 201**：`Session` 对象。

### 5.3 `GET /api/sessions/:id`

**响应 200**：`SessionDetail`（含 `messages` 数组，按 `createdAt` 升序）。

### 5.4 `PATCH /api/sessions/:id`

**请求**（部分更新）

```json
{
  "title": "自定义标题",
  "defaultModelId": "...",
  "featureId": "..."
}
```

**响应 200**：更新后的 `Session`。

### 5.5 `DELETE /api/sessions/:id`

软删除。**响应 204**。

---

## 6. 用户端 — 对话（核心）

### 6.1 `POST /api/chat`

**Content-Type**：`application/json`  
**Accept**：`text/event-stream`  
**响应**：SSE 流（见 §6.3）

#### 请求体

```typescript
interface ChatRequest {
  sessionId?: string          // 省略则自动创建 session
  model: string               // ModelPublic.id
  featureId?: string          // 默认 free-chat
  message: string             // 本轮用户输入（纯文本）
  formData?: Record<string, string>  // Feature 表单字段
  attachments?: Attachment[]  // 图片等，v1.0
  regenerate?: boolean        // true：重新生成最后一条 assistant
  editMessageId?: string      // 编辑某条 user 消息后重发（v1.0）
}
```

**示例 — 自由对话**

```json
{
  "sessionId": "sess_abc",
  "model": "deepseek/deepseek-chat",
  "featureId": "free-chat",
  "message": "你好，介绍一下你自己"
}
```

**示例 — 文档生成**

```json
{
  "model": "deepseek/deepseek-chat",
  "featureId": "doc-generate",
  "message": "",
  "formData": {
    "title": "Q2 技术复盘",
    "docType": "tech",
    "points": "1. 完成 Prisma 接入\n2. 计划 AI 模块"
  }
}
```

#### 服务端处理顺序

1. 鉴权 + 日限额检查  
2. 校验 model 存在且 enabled  
3. 校验 feature；合并 `modelPolicy`（locked 时覆盖 model）  
4. 校验 vision（有 attachments 时 model 须 supportsVision）  
5. 创建/加载 session；持久化 user message  
6. 构造 upstream messages：`[system from feature] + history + current user`  
7. 调用 Provider 流式 API；转发 SSE  
8. 流结束持久化 assistant message + usage  

#### 非流式错误

在 SSE 开始前失败（鉴权、校验等）→ 普通 JSON `ApiError`，HTTP 4xx/5xx。

### 6.2 SSE 事件协议

**Content-Type**：`text/event-stream`  
**Cache-Control**：`no-cache`  
**Connection**：`keep-alive`

每条事件格式：

```
event: <eventName>
data: <JSON 单行>

```

| event | data 类型 | 说明 |
|-------|-----------|------|
| `session` | `{ sessionId: string }` | 新建 session 时首先发送 |
| `message_start` | `MessageStart` | assistant 消息开始 |
| `content_delta` | `{ delta: string }` | 增量文本 |
| `message_end` | `MessageEnd` | 生成结束 |
| `error` | `{ code: string, message: string }` | 流内错误（随后关闭） |
| `done` | `{}` | 流正常结束 |

```typescript
interface MessageStart {
  messageId: string
  model: string           // 实际使用的 model id
  featureId?: string
}

interface MessageEnd {
  messageId: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}
```

**示例流**

```
event: session
data: {"sessionId":"sess_new"}

event: message_start
data: {"messageId":"msg_1","model":"deepseek/deepseek-chat","featureId":"free-chat"}

event: content_delta
data: {"delta":"你"}

event: content_delta
data: {"delta":"好"}

event: message_end
data: {"messageId":"msg_1","usage":{"promptTokens":10,"completionTokens":2,"totalTokens":12}}

event: done
data: {}
```

#### 客户端实现要点

- 使用 `fetch` + `ReadableStream` 解析 SSE（POST 无法使用原生 EventSource）  
- `AbortController` 断开即停止；服务端 abort 上游  
- 拼接所有 `content_delta.delta` 为完整 assistant 内容  

### 6.3 `POST /api/chat/upload`（v1.0）

**Content-Type**：`multipart/form-data`  
**Field**：`file`（单文件）

**响应 201**

```json
{
  "attachment": {
    "type": "image",
    "url": "/uploads/2026/06/xxx.png",
    "mime": "image/png",
    "name": "screenshot.png"
  }
}
```

限制：`image/jpeg|png|webp|gif`，最大 10MB。

---

## 7. 管理端接口

> 前缀 `/api/admin/*`，需 `role=admin`。

### 7.1 Provider

#### `GET /api/admin/providers`

```json
{
  "items": [
    {
      "id": "prov_1",
      "name": "DeepSeek",
      "type": "openai-compat",
      "baseURL": "https://api.deepseek.com/v1",
      "enabled": true,
      "apiKeyMasked": "sk-****abcd",
      "createdAt": "..."
    }
  ]
}
```

#### `POST /api/admin/providers`

```json
{
  "name": "DeepSeek",
  "type": "openai-compat",
  "baseURL": "https://api.deepseek.com/v1",
  "apiKey": "sk-xxx",
  "enabled": true
}
```

#### `PATCH /api/admin/providers/:id`

可更新 `name`, `baseURL`, `apiKey`, `enabled`（Key 可选，不传则不改）。

#### `DELETE /api/admin/providers/:id`

软删除或硬删（实现定一种并文档化）。

#### `POST /api/admin/providers/:id/test`

**响应 200**

```json
{ "ok": true, "latencyMs": 320 }
```

**响应 502**

```json
{
  "error": {
    "code": "PROVIDER_ERROR",
    "message": "连接失败：401 Unauthorized"
  }
}
```

### 7.2 Model

#### `GET /api/admin/models`

含 `providerId`, `modelId`, `enabled`, `sortOrder` 等完整字段。

#### `POST /api/admin/models`

```json
{
  "providerId": "prov_1",
  "modelId": "deepseek-chat",
  "label": "DeepSeek Chat",
  "tags": ["fast", "code"],
  "supportsVision": false,
  "costTier": "low",
  "enabled": true,
  "sortOrder": 0
}
```

响应中 `id` 由服务端生成，建议 `{providerSlug}/{modelId}`。

#### `PATCH /api/admin/models/:id` · `DELETE /api/admin/models/:id`

标准 CRUD。

### 7.3 Feature

#### `GET /api/admin/features`

含 `systemPrompt`, `userPromptTemplate`, `temperature`, `maxTokens` 等。

#### `POST /api/admin/features`

```json
{
  "id": "custom-polish",
  "name": "公文润色",
  "description": "...",
  "category": "doc",
  "systemPrompt": "你是公文写作专家...",
  "userPromptTemplate": "请润色：\n{{content}}",
  "defaultModelId": "deepseek/deepseek-chat",
  "modelPolicy": "recommended",
  "temperature": 0.7,
  "maxTokens": 4096,
  "uiSchema": { "type": "plain" },
  "enabled": true,
  "sortOrder": 10
}
```

#### `PATCH /api/admin/features/:id` · `DELETE /api/admin/features/:id`

### 7.4 User

#### `GET /api/admin/users`

#### `POST /api/admin/users`

管理员创建用户：

```json
{
  "email": "member@example.com",
  "password": "初始密码",
  "role": "user",
  "dailyQuota": 100
}
```

#### `PATCH /api/admin/users/:id`

```json
{
  "role": "user",
  "dailyQuota": 200,
  "enabled": false
}
```

### 7.5 Stats

#### `GET /api/admin/stats?date=2026-06-18`

```json
{
  "date": "2026-06-18",
  "totalRequests": 128,
  "activeUsers": 12,
  "errorCount": 3,
  "topModels": [
    { "modelId": "deepseek/deepseek-chat", "count": 90 }
  ]
}
```

---

## 8. Provider 上游协议（服务端内部）

服务端对外统一为 OpenAI Chat Completions 兼容：

```
POST {baseURL}/chat/completions
Authorization: Bearer {apiKey}
```

**请求（流式）**

```json
{
  "model": "deepseek-chat",
  "messages": [
    { "role": "system", "content": "..." },
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." },
    { "role": "user", "content": "..." }
  ],
  "stream": true,
  "temperature": 0.7,
  "max_tokens": 4096
}
```

**Vision 消息 content（多 part）**

```json
{
  "role": "user",
  "content": [
    { "type": "text", "text": "这张截图报的什么错？" },
    { "type": "image_url", "image_url": { "url": "https://..." } }
  ]
}
```

**上游 SSE chunk 映射**

OpenAI 格式 `choices[0].delta.content` → 本协议 `content_delta.delta`。

---

## 9. 前端 API 封装（完整实现）

> **源码位置**：`client/src/api/`（已实现，与本文档同步）

| 文件 | 职责 |
|------|------|
| `types.ts` | 全部共享 TypeScript 类型 |
| `http.ts` | `request()`、`ApiError`、Token 读写 |
| `auth.ts` | `login`、`logout`、`getMe` |
| `models.ts` | `getModels` |
| `features.ts` | `getFeatures` |
| `sessions.ts` | 会话 CRUD |
| `chat.ts` | `parseSseStream`、`streamChat`、`streamChatCollect`、`uploadChatFile` |
| `admin.ts` | Provider / Model / Feature / User / Stats 管理 |
| `index.ts` | 统一导出 |

### 9.1 HTTP 层（`http.ts`）

```typescript
// 统一 JSON 请求；401/429 等抛出 ApiError
export async function request<T>(path: string, options?: RequestOptions): Promise<T>

export class ApiError extends Error {
  readonly code: string   // 如 RATE_LIMITED
  readonly status: number
}

export function getAccessToken(): string | null
export function setAccessToken(token: string): void
export function clearAccessToken(): void
```

### 9.2 SSE 流式对话（`chat.ts`）

```typescript
/** 底层：解析 ReadableStream → ChatStreamEvent */
export async function* parseSseStream(
  body: ReadableStream<Uint8Array>,
): AsyncGenerator<ChatStreamEvent>

/** 中层：POST /api/chat 并 yield 每条 SSE 事件 */
export async function* streamChat(
  req: ChatRequest,
  options?: { signal?: AbortSignal; onEvent?: (e: ChatStreamEvent) => void },
): AsyncGenerator<ChatStreamEvent>

/** 高层：拼接完整 assistant 文本，返回 sessionId / usage */
export async function streamChatCollect(
  req: ChatRequest,
  options?: StreamChatOptions,
): Promise<StreamChatResult>

/** 图片上传 → Attachment */
export async function uploadChatFile(file: File): Promise<Attachment>
```

**典型用法**

```typescript
import { streamChat, streamChatCollect } from '@/api'

// 方式 A：逐 token 更新 UI
const ac = new AbortController()
for await (const ev of streamChat(
  { model: 'deepseek/deepseek-chat', featureId: 'free-chat', message: '你好' },
  { signal: ac.signal },
)) {
  if (ev.event === 'content_delta') appendText(ev.data.delta)
  if (ev.event === 'error') showError(ev.data.message)
}

// 方式 B：等待完整回复
const { sessionId, content } = await streamChatCollect({
  model: 'deepseek/deepseek-chat',
  featureId: 'doc-generate',
  message: '',
  formData: { title: '复盘', docType: 'tech', points: '...' },
})
```

### 9.3 管理端（`admin.ts`）

```typescript
// Provider
listProviders() / createProvider() / updateProvider() / deleteProvider() / testProvider()

// Model
listAdminModels() / createModel() / updateModel() / deleteModel()

// Feature
listAdminFeatures() / createFeature() / updateFeature() / deleteFeature()

// User & Stats
listUsers() / createUser() / updateUser() / getAdminStats(date?)
```

完整签名见源码；类型定义见 `types.ts`。

---

## 10. 版本与兼容

| 协议版本 | 说明 |
|----------|------|
| v1.0 | 本文档初版 |

**破坏性变更流程**：先更新本文档 → 再改实现 → DESIGN.md §9 留痕。

**已存在接口**：`GET /api/health`、`GET /api/posts*` 保持不变，与 AI 模块并行。

---

## 11. 变更记录

| 日期 | 版本 | 说明 |
|------|------|------|
| 2026-06-18 | v1.0 | 初版：认证、会话、SSE、管理端、上传 |
| 2026-06-18 | v1.1 | §9 前端 API 完整实现落地至 `client/src/api/` |
