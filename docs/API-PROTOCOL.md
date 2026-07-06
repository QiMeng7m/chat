# AI 对话工具 — 前后端接口协议

> **文档版本**：v1.6  
> **日期**：2026-07-06  
> **Base URL**：开发 `http://localhost:3000` · 生产 `/api` 经 Nginx 反代  
> **关联**：[PRD-FEATURES.md](./PRD-FEATURES.md) · [UI-DESIGN-PLAN.md](./UI-DESIGN-PLAN.md) · [DESIGN.md](./DESIGN.md) · [RAG-DESIGN.md](./RAG-DESIGN.md)（Phase 4 RAG） · [CHAT-ROUTING.md](./CHAT-ROUTING.md)（回答路由）

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
  username: string
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
  /** RAG 场景：是否启用知识库检索（Phase 4） */
  ragEnabled?: boolean
  /** RAG 场景：用户可选的知识库列表（仅 visibility=public 的 KB） */
  ragKbOptions?: KnowledgeBaseOption[]
}

/** 用户端可选知识库（不含 embedding、文档内容） */
interface KnowledgeBaseOption {
  id: string
  name: string
  description?: string
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

// —— RAG 知识库（Phase 4）——

type KnowledgeVisibility = 'public' | 'admin'
type KnowledgeDocStatus = 'pending' | 'indexing' | 'indexed' | 'failed'
type KnowledgeSourceType = 'post' | 'upload' | 'manual' | 'chat' | 'owner_profile'

/** 管理端：知识库 */
interface KnowledgeBaseAdmin {
  id: string
  name: string
  description: string
  visibility: KnowledgeVisibility
  enabled: boolean
  documentCount?: number
  chunkCount?: number
  createdAt: string
  updatedAt: string
}

/** 管理端：文档（不含 embedding） */
interface KnowledgeDocumentAdmin {
  id: string
  kbId: string
  title: string
  sourceType: KnowledgeSourceType
  sourceRef?: string       // 如 Post.id
  status: KnowledgeDocStatus
  errorMsg?: string
  chunkCount?: number
  indexedAt?: string
  createdAt: string
  updatedAt: string
}

/** SSE / message_end：引用来源（不含 chunk 正文） */
interface CitationItem {
  index: number            // 对应回答中的 [1][2] 编号，从 1 起
  documentId: string
  title: string
  sourceType: KnowledgeSourceType
  sourceRef?: string       // sourceType=post 时可跳转 /posts/:id
  score: number            // 0～1，余弦相似度
}

// —— 回答路由 Path A（Phase 4 · 前端结构化直答）——

type StructuredIntentId = 'owner_profile' | 'user_profile' | 'user_quota' | 'knowledge_ingest'

interface StructuredReply {
  content: string
  source?: StructuredIntentId
}

/** 前端 localStorage 消息可选字段（服务端 Message 可不持久化） */
interface ClientChatMessageMeta {
  replySource?: 'structured' | 'llm' | 'rag'
  structuredIntentId?: StructuredIntentId
}
```

---

## 3. 认证接口

### 3.1 `POST /api/auth/register`（公开 · 默认开启）

> 环境变量 `ALLOW_REGISTRATION` 默认为 `true`；设为 `false` 时返回 403「注册已关闭」。

**请求**

```json
{
  "username": "qimeng",
  "password": "至少6位"
}
```

**响应 201**

```json
{
  "user": { "id": "...", "username": "...", "role": "user", "dailyQuota": 100, "createdAt": "..." },
  "accessToken": "eyJ..."
}
```

### 3.2 `POST /api/auth/login`（公开）

**请求**

```json
{
  "username": "qimeng",
  "password": "..."
}
```

**响应 200**：同 register。

### 3.3 `GET /api/auth/me`

**响应 200**

```json
{
  "user": { "id": "...", "username": "...", "role": "admin", "dailyQuota": 100, "createdAt": "..." }
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

### 4.3 `GET /api/knowledge/bases`（Phase 4 · 需登录）

返回当前用户**可检索**的公开知识库，供 `kb-chat` 等 Feature 的下拉选择。

**响应 200**

```json
{
  "items": [
    {
      "id": "kb_posts",
      "name": "站点文章",
      "description": "博客 Post 同步"
    }
  ]
}
```

> `visibility=admin` 的 KB **不出现在此接口**；admin 用户对话时由 Feature 绑定的 `ragKbIds` 服务端解析，无需前端传 KB 列表。

### 4.4 知识库写入（Phase 4 · Ingest）

> 与 §6 `POST /api/chat`（问答）分离。入库不经过大模型流式接口（对话入库走 Path A 调下列 REST）。

#### `POST /api/knowledge/bases/:kbId/documents`（需登录）

创建一篇文档并**异步索引**。admin 可写任意有权限的 KB；Phase 4c 普通用户仅可写个人 KB `kb_user_{userId}`。

**请求**

```json
{
  "title": "对话录入 2026-07-06",
  "content": "柒梦的小破站上线于 2026 年 6 月，默认端口 3000。",
  "sourceType": "chat"
}
```

| 字段 | 必填 | 说明 |
|------|------|------|
| `title` | 否 | 默认「未命名文档」或从首行截取 |
| `content` | 是 | 纯文本 / Markdown，最大 100KB |
| `sourceType` | 否 | `manual` \| `chat`，默认 `manual` |

**响应 201**

```json
{
  "document": {
    "id": "doc_1",
    "kbId": "kb_posts",
    "title": "对话录入 2026-07-06",
    "sourceType": "chat",
    "status": "pending",
    "createdAt": "2026-07-06T10:00:00.000Z"
  }
}
```

索引完成后 `status` 变为 `indexed`；失败为 `failed` + `errorMsg`。

#### `POST /api/admin/knowledge/bases/:kbId/documents/upload`（Phase 4b · admin）

**Content-Type**：`multipart/form-data`

| Field | 说明 |
|-------|------|
| `file` | `.md` / `.txt`，最大 2MB |
| `title` | 可选，默认文件名 |

**响应 201**：`KnowledgeDocumentAdmin`（`sourceType=upload`）

#### 对话入库路径（Path A · `knowledge_ingest`）

前端识别前缀后调用 **本节的 `POST .../documents`**，不调 `POST /api/chat`：

```
用户：「保存到知识库：默认部署用 pm2，端口 3000」
  → resolveStructuredIntent → knowledge_ingest
  → POST /api/knowledge/bases/{kbId}/documents
  → 回复：「已保存，索引中…」
```

默认 `kbId`：admin 用 Feature 配置或 `formData.kbId`；Phase 4c 用户用个人 KB。

#### 与 `user_profile` 的区别

| 操作 | API | 用途 |
|------|-----|------|
| 「我身高 175」 | `PATCH /api/user/profile` | 结构化字段，Path A 直答 |
| 「保存到知识库：…」 | `POST .../documents` | 非结构化长文，RAG 检索（advanced） |
| 站长保存公开资料 | `PUT /api/site/owner-profile` + sync-kb | 见 §4.5 |

### 4.5 站长公开资料与 KB 同步（Phase 4 · M11）

> 设计：[RAG-DESIGN.md §3.5](./RAG-DESIGN.md)

#### `GET /api/site/owner-profile`（公开）

已有实现。返回 `OwnerProfile` JSON。

#### `PUT /api/site/owner-profile`（admin）

已有实现。更新站长结构化资料。

**可选扩展 — 请求体**

```json
{
  "...": "OwnerProfile 字段",
  "syncKb": true
}
```

`syncKb: true` 时保存后自动将 profile 转为 Markdown 并 ingest 至 `owner-public`《基本信息》。

#### `POST /api/site/owner-profile/sync-kb`（admin · Phase 4a）

手动触发：当前 `SiteOwnerProfile` → Markdown → upsert Document（`sourceType=owner_profile`）→ 异步 reindex。

**响应 202**

```json
{
  "documentId": "doc_basics",
  "kbId": "owner-public",
  "status": "indexing"
}
```

#### `PUT /api/site/owner-profile/resume`（admin · Phase 4a）

上传或粘贴简历正文至 `owner-public`《简历》并 reindex。

**请求**

```json
{
  "content": "# 工作经历\n\n## 2022–2024 …",
  "title": "简历"
}
```

**响应 202**：同 sync-kb。

#### 与对话的关系

- 站长维护资料：**仅**设置页 + 上述 API，**不依赖**聊天前缀（§4.4 Path A ingest 为可选）
- 访客提问：Feature `ask-owner` → `POST /api/chat` RAG（§6.5.3）

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

**示例 — 了解主人（Phase 4a · Owner Bio）**

```json
{
  "sessionId": "sess_abc",
  "model": "deepseek/deepseek-chat",
  "featureId": "ask-owner",
  "message": "站长做过哪些项目？会哪些技术？"
}
```

> `ask-owner`：`ragEnabled=true`，仅检索 `owner-public` KB。与 `free-chat` 并存；新会话默认 `free-chat`。

**示例 — 知识库问答（Phase 4 · 站点文章等）**

```json
{
  "sessionId": "sess_abc",
  "model": "deepseek/deepseek-chat",
  "featureId": "kb-chat",
  "message": "Q2 技术复盘里提到了哪些 Prisma 相关事项？",
  "formData": {
    "kbId": "kb_posts"
  }
}
```

> `formData.kbId` **可选**：省略时使用 Feature 配置的 `ragKbIds`；传入时须在用户可访问的 KB 范围内（公开 KB 或 admin 专属 KB）。  
> **客户端不传** `topK`、`minScore`、检索 query 等 RAG 参数，一律由服务端 Feature 配置决定（见业务规则 BR-RAG-01）。

#### 服务端处理顺序

1. 鉴权 + 日限额检查  
2. 校验 model 存在且 enabled  
3. 校验 feature；合并 `modelPolicy`（locked 时覆盖 model）  
4. 校验 vision（有 attachments 时 model 须 supportsVision）  
5. 创建/加载 session；持久化 user message  
6. **（RAG）** 若 `feature.ragEnabled`：解析目标 KB → Embedding 检索 Top-K → 拼装含检索上下文的 system prompt  
7. 构造 upstream messages：`[system from feature(+RAG)] + history + current user`  
8. 调用 Provider 流式 API；转发 SSE（含可选 `citations`）  
9. 流结束持久化 assistant message + usage  

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
| `citations` | `{ items: CitationItem[] }` | **Phase 4b** RAG 引用来源；在首条 `content_delta` 之前发送；无命中时可省略或 `items: []` |
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
  /** Phase 4b：与 citations 事件内容一致，便于 streamChatCollect 一次性读取 */
  citations?: CitationItem[]
}
```

**RAG 事件顺序**

```
session? → message_start → citations? → content_delta* → message_end → done
```

**示例流 — 知识库问答**

```
event: message_start
data: {"messageId":"msg_1","model":"deepseek/deepseek-chat","featureId":"kb-chat"}

event: citations
data: {"items":[{"index":1,"documentId":"doc_1","title":"Q2 技术复盘","sourceType":"post","sourceRef":"3","score":0.89}]}

event: content_delta
data: {"delta":"根据"}

event: message_end
data: {"messageId":"msg_1","usage":{"promptTokens":1200,"completionTokens":80,"totalTokens":1280},"citations":[{"index":1,"documentId":"doc_1","title":"Q2 技术复盘","sourceType":"post","sourceRef":"3","score":0.89}]}

event: done
data: {}
```

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

### 6.4 RAG 对话协议摘要（Phase 4）

#### 设计原则

| 原则 | 说明 |
|------|------|
| **对话入口不变** | 仍用 `POST /api/chat`；RAG 不新增用户端 REST 检索接口 |
| **检索服务端闭环** | Embedding、向量检索、Prompt 注入均在 `node/` 完成 |
| **Feature 驱动** | 是否 RAG、默认 KB、topK/minScore 由 Feature 表配置，非 ChatRequest 字段 |
| **引用可展示** | 通过 SSE `citations` + `message_end.citations` 回传来源元数据，**不含 chunk 正文** |
| **密钥不出端** | Embedding API Key、向量数据不对前端暴露 |

#### 跨模块业务规则

| 规则 ID | 描述 |
|---------|------|
| BR-RAG-01 | `ChatRequest` 不得携带 `topK`、`minScore`、检索 query 等 RAG 调参；由 Feature `ragTopK`、`ragMinScore` 决定 |
| BR-RAG-02 | `formData.kbId` 可选；省略时用 Feature `ragKbIds`；传入时须通过服务端 KB 权限校验 |
| BR-RAG-03 | 普通用户仅可检索 `visibility=public` 的 KB；admin 可检索 `admin` KB |
| BR-RAG-04 | `citations` 与 `message_end.citations` 内容一致；前端任取其一即可 |
| BR-RAG-05 | 检索无命中时仍正常流式回复；`citations.items` 为空数组或省略事件 |
| BR-RAG-06 | 与 BR-02 一致：system prompt（含 RAG 上下文）由服务端注入，客户端不得构造 |

#### Feature 管理端扩展字段（`POST/PATCH /api/admin/features`）

```typescript
interface FeatureRagConfig {
  ragEnabled?: boolean      // 默认 false
  ragKbIds?: string[]       // 绑定的知识库 ID 列表
  ragTopK?: number          // 默认 5
  ragMinScore?: number      // 默认 0.70
}
```

`GET /api/features` 公开响应中：

- 暴露 `ragEnabled`、`ragKbOptions`（公开 KB 摘要）
- **不暴露** `ragKbIds` 全量配置、`systemPrompt`、`ragTopK`、`ragMinScore`

#### 前端类型扩展（`src/api/types.ts`）

```typescript
export type ChatStreamEvent =
  | { event: 'session'; data: { sessionId: string } }
  | { event: 'message_start'; data: MessageStart }
  | { event: 'citations'; data: { items: CitationItem[] } }  // 新增
  | { event: 'content_delta'; data: { delta: string } }
  | { event: 'message_end'; data: MessageEnd }
  | { event: 'error'; data: { code: string; message: string } }
  | { event: 'done'; data: Record<string, never> }

export interface StreamChatResult {
  sessionId?: string
  messageId?: string
  content: string
  model?: string
  usage?: TokenUsage
  citations?: CitationItem[]   // 新增：从 message_end 或 citations 事件汇总
}
```

#### 新增 error.code

| code | HTTP | 说明 |
|------|------|------|
| `KNOWLEDGE_BASE_NOT_FOUND` | 400 | `formData.kbId` 不存在或已禁用 |
| `KNOWLEDGE_FORBIDDEN` | 403 | 用户无权访问该 KB |
| `KNOWLEDGE_INDEX_FAILED` | 502 | 文档索引失败（管理端 reindex） |

### 6.5 回答路由协议（Phase 4）

> 设计说明：[CHAT-ROUTING.md](./CHAT-ROUTING.md)

用户消息存在三条回答路径；**前后端分工明确，禁止混用**。

#### 6.5.1 路径总览

| 路径 | 名称 | HTTP | 调 LLM | 调 RAG | 决策位置 |
|------|------|------|--------|--------|----------|
| **A** | 结构化直答 | 前端调已有 GET/PATCH API | 否 | 否 | **前端**意图注册表 |
| **B** | 知识库问答 | `POST /api/chat` SSE | 是 | 是 | **后端** `feature.ragEnabled=true` |
| **C** | 通用对话 | `POST /api/chat` SSE | 是 | 否 | **后端** `feature.ragEnabled=false` |

**优先级**：Path A 先于 Path B/C。Path A 命中时**不得**调用 `POST /api/chat`。

#### 6.5.2 Path A — 结构化直答（前端协议）

**不适用** `POST /api/chat`。前端在 `sendMessage` 内完成：

```
用户输入 → match(意图注册表) → 调用数据 API → 模板生成 content → 写入 messages
```

**意图注册表类型**（`src/lib/chatRouting/registry.ts`，规划）

```typescript
type StructuredIntentId = 'owner_profile' | 'user_profile' | 'user_quota' | 'knowledge_ingest'

interface StructuredIntentDomain {
  id: StructuredIntentId
  description: string
  priority: number
  match: (text: string, ctx: RoutingContext) => boolean
  handler: (text: string, ctx: RoutingContext) => Promise<StructuredReply | null>
}

interface RoutingContext {
  recentMessages: ChatMessage[]
  user: UserPublic | null
}

interface StructuredReply {
  content: string
  source?: 'owner_profile' | 'user_profile' | 'quota'
}
```

**已注册域与数据 API**

| intent id | 数据 API | 现实现 |
|-----------|----------|--------|
| `owner_profile` | `GET /api/site/owner-profile` | `src/lib/ownerProfile.ts` |
| `user_profile` | `GET /api/user/profile`、`PATCH /api/user/profile` | `src/lib/userProfile.ts` |
| `user_quota` | `GET /api/auth/me`（`quotaUsed` / `quotaLimit`） | 规划 |
| `knowledge_ingest` | `POST /api/knowledge/bases/:kbId/documents` | Phase 4b |

见 §4.4 知识库写入协议。

**Path A 协议约定**

| 项 | 约定 |
|----|------|
| 请求 | 仅调用上表所列**已有** REST API，不新增 `/api/chat/structured` |
| 响应 | 本地构造 `ChatMessage`（`role: assistant`），与 SSE 流式消息 UI 一致 |
| 配额 | 默认**不**递增 `quotaUsed`（不调 LLM）；若产品要求计次，须在 PRD 明示 |
| 会话 | 可选写入 localStorage / session messages，**不**强制服务端持久化 assistant |
| 关键字 | 各域在 `match()` 内维护；**不得**用关键字决定是否 RAG |

**可选 metadata（Phase 4b · 仅前端 localStorage）**

```typescript
interface ChatMessage {
  // ...existing
  replySource?: 'structured' | 'llm' | 'rag'
  structuredIntentId?: StructuredIntentId
}
```

服务端 `Message` 模型 v1 可不持久化上述字段。

#### 6.5.3 Path B / C — `POST /api/chat`（后端协议）

Path A 未命中后，前端**统一**调用：

```typescript
interface ChatRequest {
  sessionId?: string
  model: string
  featureId?: string          // 决定 Path B vs C
  message: string
  formData?: Record<string, string>  // kb-chat 可选 kbId
  attachments?: Attachment[]
}
```

**后端分流**（`node/src/routes/chat.ts`）

```typescript
if (feature.ragEnabled) {
  // Path B：retrieve → buildRagSystemPrompt → streamUpstreamChat
} else {
  // Path C：systemPrompt → streamUpstreamChat
}
```

| featureId 示例 | ragEnabled | 路径 |
|----------------|------------|------|
| `ask-owner` | `true` | B · owner-public |
| `free-chat` | `false` | C |
| `kb-chat` | `true` | B · 其他 KB |
| `doc-generate` | `false` | C |

Path B 的 SSE 扩展见 §6.2（`citations` 事件）。

#### 6.5.4 后端结构化直答（Phase 4c · 可选）

若将 Path A 从前端迁至后端，扩展 `POST /api/chat` 响应模式：

**模式 1 — JSON 直答（推荐）**

请求头增加：`Accept: application/json` 或请求体 `preferStructured: true`（二选一，实现时定稿）

**响应 200**（非 SSE）

```json
{
  "mode": "structured",
  "intentId": "owner_profile",
  "messageId": "msg_local",
  "content": "主人身高 175 cm。",
  "source": "owner_profile"
}
```

**模式 2 — SSE 单事件**

```
event: structured_reply
data: {"intentId":"owner_profile","content":"主人身高 175 cm。","source":"owner_profile"}

event: done
data: {}
```

Phase 4a～4b **不实现** §6.5.4；Path A 保持前端。

#### 6.5.5 跨模块业务规则

| 规则 ID | 描述 |
|---------|------|
| BR-ROUTE-01 | Path A 仅用于有明确 API 与字段的结构化数据 |
| BR-ROUTE-02 | Path A 在前端 `sendMessage` 中先于 `POST /api/chat` |
| BR-ROUTE-03 | Path B vs C 由 `feature.ragEnabled` 决定，不由关键字推断 |
| BR-ROUTE-04 | Path A 命中时禁止调用 `POST /api/chat` |
| BR-ROUTE-05 | 新增结构化域须注册 `StructuredIntentDomain` 并补充测试 |
| BR-ROUTE-06 | Path B 无检索命中仍调 LLM，Prompt 约束勿编造 |

与 RAG 规则 BR-RAG-01～06 并存；**BR-ROUTE-04** 优先（结构化/入库不走 chat）。

**对话入库识别**：须匹配前缀（`保存到知识库：` 等），在 `sendMessage` 内 Path A 完成，详见 [CHAT-ROUTING.md §3.7](./CHAT-ROUTING.md)。

**ask-owner 例外**：`featureId=ask-owner` 时跳过 `isOwnerRelatedQuery` Path A，统一 RAG；见 [CHAT-ROUTING.md §6.2](./CHAT-ROUTING.md)。

#### 6.5.6 前端实现清单

| 文件 | 职责 |
|------|------|
| `src/lib/chatRouting/registry.ts` | 意图注册表（规划） |
| `src/lib/chatRouting/resolve.ts` | `resolveStructuredIntent()`（规划） |
| `src/lib/ownerProfile.ts` | `owner_profile` 处理器（已有） |
| `src/lib/userProfile.ts` | `user_profile` 处理器（已有） |
| `src/components/chat/ChatContext.tsx` | `sendMessage` 先 Path A 再 `streamChat` |

| 文件 | 职责 |
|------|------|
| `src/api/chat.ts` | Path B/C：SSE 解析（含 `citations`） |
| `src/api/types.ts` | `StructuredIntentId`、`replySource` 等 |

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
  "username": "member01",
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

### 7.6 知识库（Phase 4 · RAG）

> 前缀 `/api/admin/knowledge/*`，需 `role=admin`。详见 [RAG-DESIGN.md](./RAG-DESIGN.md)。

#### `GET /api/admin/knowledge/bases`

**响应 200**

```json
{
  "items": [
    {
      "id": "kb_posts",
      "name": "站点文章",
      "description": "博客 Post 同步",
      "visibility": "public",
      "enabled": true,
      "documentCount": 12,
      "chunkCount": 48,
      "createdAt": "2026-07-06T08:00:00.000Z",
      "updatedAt": "2026-07-06T09:00:00.000Z"
    }
  ]
}
```

#### `POST /api/admin/knowledge/bases`

**请求**

```json
{
  "name": "站点文章",
  "description": "博客 Post 同步",
  "visibility": "public",
  "enabled": true
}
```

**响应 201**：`KnowledgeBaseAdmin`

#### `PATCH /api/admin/knowledge/bases/:id` · `DELETE /api/admin/knowledge/bases/:id`

标准部分更新 / 删除（级联文档与 chunk）。DELETE **204**。

#### `GET /api/admin/knowledge/bases/:kbId/documents`

**响应 200**

```json
{
  "items": [
    {
      "id": "doc_1",
      "kbId": "kb_posts",
      "title": "Q2 技术复盘",
      "sourceType": "post",
      "sourceRef": "3",
      "status": "indexed",
      "chunkCount": 4,
      "indexedAt": "2026-07-06T09:00:00.000Z",
      "createdAt": "2026-07-06T08:30:00.000Z",
      "updatedAt": "2026-07-06T09:00:00.000Z"
    }
  ]
}
```

#### `POST /api/admin/knowledge/bases/:kbId/documents`

手动创建文档并**异步索引**。

**请求**

```json
{
  "title": "部署说明",
  "content": "# 部署\n\n1. npm run build\n..."
}
```

**响应 201**：`KnowledgeDocumentAdmin`（`status` 初始为 `pending`，随后变为 `indexing` → `indexed`）

#### `POST /api/admin/knowledge/bases/:kbId/documents/from-post/:postId`

从 `Post` 导入；若同 KB 下已有相同 `sourceRef` 则更新并 reindex。

**响应 201**：`KnowledgeDocumentAdmin`

#### `POST /api/admin/knowledge/bases/:kbId/documents/upload`（Phase 4b）

**Content-Type**：`multipart/form-data`  
**Field**：`file`（`.md` / `.txt`，最大 2MB），可选 `title`

**响应 201**：`KnowledgeDocumentAdmin`（`sourceType=upload`）

#### `DELETE /api/admin/knowledge/documents/:id`

删除文档及全部 chunk。**响应 204**。

#### `POST /api/admin/knowledge/documents/:id/reindex`

重建索引。**响应 202**（异步接受）

```json
{
  "id": "doc_1",
  "status": "indexing"
}
```

失败时文档 `status=failed`，`errorMsg` 写入原因；HTTP 仍返回 202，前端轮询文档状态。

#### 管理端约定

| 项 | 约定 |
|----|------|
| 响应体 | 永不包含 `embedding` 向量、`rawContent` 全文（列表接口） |
| 文档详情 | 可选 `GET .../documents/:id` 返回 `rawContent`（Phase 4b） |
| 索引状态 | 前端轮询 `GET .../documents` 或 WebSocket 后续再议 |
| 上传 Markdown 文件 | Phase 4b：`POST .../documents/upload` multipart |

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
| `admin.ts` | Provider / Model / Feature / User / Stats / Knowledge 管理 |
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
| 2026-07-06 | v1.2 | §2/§4.3/§6.4/§7.6：Phase 4 RAG 协议（对话 SSE citations、知识库管理 API、Feature 扩展） |
| 2026-07-06 | v1.3 | §6.5：三段式回答路由（Path A 结构化直答 / Path B RAG+LLM / Path C 纯 LLM） |
| 2026-07-06 | v1.4 | §4.4：知识库写入（REST + 对话 ingest）；§7.6 文件上传 |
| 2026-07-06 | v1.5 | §6.5.6/§6.5.5：对话入库前缀与 CHAT-ROUTING §3.7 交叉引用 |
| 2026-07-06 | v1.6 | §4.5 Owner Bio sync-kb/resume；§6.1 ask-owner 示例；与 free-chat 并存 |
