# UI 设计与开发计划（速查）

> **文档版本**：v1.0  
> **日期**：2026-06-18  
> **用途**：开发过程中快速读取本期 UI 设计思路、原型映射与实施顺序。  
> **关联**：[PRD-FEATURES.md](./PRD-FEATURES.md) · [API-PROTOCOL.md](./API-PROTOCOL.md) · [DESIGN.md](./DESIGN.md) · [mockups/](./mockups/)

---

## 1. 一句话定位

**小团队（10～50 人）AI 工作台**：可爱 / 可换肤、多端适配、管理员配 Key、成员登录即用。  
价值在**体验与场景（Feature）**，不在自研模型。

---

## 2. 设计原则（开发时勿偏离）

| 原则 | 说明 |
|------|------|
| **可爱但不幼稚** | 圆角、emoji  mascot、柔和色；消息区仍要清晰可读 |
| **主题是个人偏好** | 五套皮肤仅在「个人设置」切换，**不在**页面主体 / banner / 侧栏放切换器 |
| **玻璃态 + 动态壁纸** | 背景在 `html::before/::after`；侧栏/顶栏半透明 blur，露出壁纸 |
| **内容区滚动** | `body.app-layout` 占满视口，**只有** `.content` / `.chat-area` 滚动 |
| **移动优先适配** | 手机：抽屉侧栏 + 底栏；平板：场景横滑条；桌面：完整侧栏 |
| **Ant Design 落地** | 原型是 HTML/CSS；React 实现用 Ant Design 6，**视觉对齐 mockup**，不必 1:1 复制 class |
| **Key 永不出前端** | 模型、Provider 由管理员配置；用户只见模型列表与 Feature |

---

## 3. 原型文件地图

| Mockup | 路径 | 对应 React 路由（计划） | 主要能力 |
|--------|------|-------------------------|----------|
| 首页 / 落地 | `mockups/index.html` | `/` 或 `/chat` 入口 | 品牌展示、进入对话 |
| 登录 | `mockups/login.html` | `/login` | 邮箱密码、记住我 |
| **对话主界面** | `mockups/chat.html` | `/chat` | 会话侧栏、Feature、SSE 聊天、模型切换 |
| 文档生成 | `mockups/chat-doc-form.html` | `/chat`（Feature=doc-generate） | 表单型 Feature 子视图 |
| **个人设置** | `mockups/settings.html` | `/settings` | 五主题选择、偏好占位 |
| 管理后台 | `mockups/admin.html` | `/admin/*` | Provider / 模型 / Feature / 用户 |

**静态资源**

| 文件 | 职责 |
|------|------|
| `styles.css` | 布局、组件、响应式、猫狗默认 token |
| `themes.css` | 五主题变量、壁纸、玻璃面板、设置页主题卡片 |
| `themes.js` | 主题切换、`META` 文案、`localStorage` |
| `responsive.js` | 抽屉、底栏、移动菜单 |

**本地预览**：浏览器直接打开 `docs/mockups/index.html` 或 `settings.html`。

---

## 4. 布局规范

### 4.1 全屏 App 壳（对话 / 管理 / 设置）

```
body.app-layout          → flex 列, height: 100dvh, overflow: hidden
  mockup-banner          → 原型提示条（上线可删或改为环境条）
  app-shell              → flex:1; 侧栏 + main
    sidebar              → 288px；手机为抽屉
    main
      feature-scroll     → 平板/手机横滑场景（可选显隐）
      topbar             → 60px；左：菜单+标题；右：模型/配额/设置⚙️
      chat-area | content → 唯一滚动区
      composer-wrap      → 固定底（对话页）
  bottom-nav             → 手机四格：会话 / 聊天 / 场景 / 设置
```

### 4.2 响应式断点（与 mockup 一致）

| 场景 | 行为 |
|------|------|
| 桌面 ≥1024px | 侧栏常驻；顶栏完整模型名 + 配额 + 设置 |
| 平板 | 侧栏抽屉；`feature-scroll` 横滑 |
| 手机 | 底栏导航；顶栏精简；侧栏 `data-drawer-toggle` |

### 4.3 登录页

- 桌面：**左品牌区 + 右表单**（`login-shell`）
- 移动：仅表单卡片；品牌区折叠
- 右上角 **「⚙️ 外观」** → `/settings`（未登录也可改主题）

---

## 5. 五套主题系统

### 5.1 主题一览

| ID | 名称 | 气质 | 背景特征 |
|----|------|------|----------|
| `catdog` | 喵汪工坊 | 萌宠粉紫（**默认**） | 粉紫光斑 + 爪印纹理 |
| `anime` | 星语二次元 | 番剧樱花紫蓝 | pastel 流动渐变 + 花瓣/星点 |
| `guofeng` | 墨韵国风 | 宣纸墨色朱砂 | 水墨线 + 远山剪影 + 纸纹 |
| `neon` | 轻霓虹 | 深蓝灰终端 | 低饱和网格 + 角落 cyan/紫辉（**克制，无光污染**） |
| `conan` | 米花町 | 推理蓝红 | 明亮蓝灰 aurora + 放大镜纹理 |

### 5.2 技术实现

| 项 | 约定 |
|----|------|
| 存储 | `localStorage` key：`mascot-theme` |
| DOM | `document.documentElement.setAttribute('data-theme', id)` |
| 防闪屏 | 各 HTML `<head>` 首行脚本：读 localStorage 提前设 `data-theme` |
| 壁纸层 | **`html::before` / `html::after`**（fixed, z-index -2/-1），`body` 背景透明 |
| 面板 | `.sidebar` / `.topbar` ≈ 58%～68% 不透明白 + `backdrop-filter: blur` |
| 文案 | `themes.js` → `META[themeId]`；DOM 用 `data-theme-text="assistantLabel"` 等 |
| **唯一切换入口** | `settings.html` → `#theme-picker`（`renderThemePicker()`） |

### 5.3 React 迁移建议

```
src/theme/
  tokens.ts       ← 五主题 CSS 变量（或 CSS Modules 导入 themes.css）
  ThemeProvider   ← 读/写 localStorage，设 data-theme
  useTheme()      ← 当前 themeId + setTheme
  meta.ts         ← 从 themes.js META 迁为 TS 常量
pages/Settings    ← 主题卡片网格，对齐 mockup
```

- 全局样式：可继续 `@import` 改造后的 `themes.css`，或逐步转为 CSS-in-JS / Ant Design token 覆盖。
- **不要**在 ChatLayout 顶栏放主题切换；仅 Settings 页 + 可选用户菜单入口。

---

## 6. 核心页面 UI 要点

### 6.1 对话页 `chat.html`

| 区域 | 规格 |
|------|------|
| 侧栏 | 会话列表（emoji + 标题 + meta）；Feature 网格（6 项）；底部管理/设置链接 |
| 顶栏 | 场景标题 + `model-tag`；模型下拉；配额 badge；⚙️ 设置 |
| 消息 | user 右对齐渐变气泡；assistant 白底卡片 + Markdown；头像随主题 emoji |
| Composer | 工具栏（Feature badge、上传、场景）；textarea；发送按钮；今日剩余次数 |
| 空状态 | 新会话：Feature 快捷卡片（M4-09，v0.3） |

### 6.2 文档生成 `chat-doc-form.html`

- 与对话页共用壳；主区为 **Card + 表单**（标题、类型、要点…）
- 提交后走同一 `POST /api/chat`，`formData` 由 M3 拼入 user 消息
- 副标题文案随主题：`data-theme-text="formHelperDesc"`

### 6.3 个人设置 `settings.html`

- 资料卡（邮箱、角色、配额占位）
- **主题**：5 张 `theme-card`（预览条 + 名称 + 描述）
- 偏好区：占位（默认模型、快捷键等 v1.0+）

### 6.4 管理后台 `admin.html`

- 侧栏：概览 / Provider / 模型 / Feature / 用户 / 设置
- 概览：stat-card 网格（今日请求、活跃用户、模型数…）
- v0.2～v0.4 可先用 REST + 简单表格；v1.0 对齐 mockup 完整 CRUD

### 6.5 登录 `login.html`

- 表单：邮箱、密码、记住我、忘记密码（占位）
- 注册关闭提示（管理员开通）
- 文案全套走 `META`（各主题称呼不同：铲屎官 / 调查员 / 掌事…）

---

## 7. 组件清单（React 实施参考）

| 组件 | 职责 | Mockup 参考 |
|------|------|-------------|
| `AppLayout` | app-layout 壳 +  outlet | `chat.html` body |
| `Sidebar` | 会话 + Feature + 底链 | `.sidebar` |
| `SessionList` | 会话项 active 态 | `.session-item` |
| `FeatureGrid` / `FeaturePill` | 侧栏网格 + 顶栏横滑 | `.feature-chip` / `.feature-pill` |
| `ChatTopbar` | 菜单、标题、ModelSelect、Quota、SettingsLink | `.topbar` |
| `MessageList` | 滚动消息 + Markdown | `.chat-area` |
| `Composer` | 输入 + 工具栏 + 停止 | `.composer` |
| `ModelSelect` | 模型下拉 + tag | `.model-select` |
| `ThemePicker` | 五主题卡片 | `#theme-picker` |
| `DocGenerateForm` | 文档 Feature 表单 | `chat-doc-form.html` |
| `AdminLayout` | 管理侧栏 + 内容 | `admin.html` |
| `BottomNav` | 手机四格 | `.bottom-nav` |

---

## 8. 前端 API 与数据流（已实现部分）

> 详见 [API-PROTOCOL.md §9](./API-PROTOCOL.md#9-前端-api-封装完整实现)

| 模块 | 路径 | 用途 |
|------|------|------|
| HTTP 基座 | `client/src/api/http.ts` | token、request、ApiError |
| 类型 | `client/src/api/types.ts` | 与协议 §2 对齐 |
| 认证 | `auth.ts` | login / me / logout |
| 模型 | `models.ts` | GET /api/models |
| Feature | `features.ts` | GET /api/features |
| 会话 | `sessions.ts` | CRUD 会话 |
| 对话 | `chat.ts` | `streamChat`、`parseSseStream` |
| 管理 | `admin.ts` | /api/admin/* |

**页面级状态（待建）**

```
当前 sessionId、messages[]
当前 featureId、selectedModelId
streaming / abortController
user（me）、quota
themeId（localStorage，与 ThemeProvider 同步）
```

---

## 9. 开发计划（前端 × 里程碑）

与 [PRD-FEATURES.md §4](./PRD-FEATURES.md#4-版本与里程碑) 对齐；**建议顺序**：M4 → M2 → M3 → M5 → M1 → M7 → M6 → M8。

### Phase 2a — v0.1 对话 MVP（当前优先）

| 任务 | 说明 | 原型 |
|------|------|------|
| F-01 | `ChatPage` 路由 + `AppLayout` | `chat.html` |
| F-02 | `Composer` + 假数据/mock SSE | — |
| F-03 | `MessageList` Markdown 渲染（react-markdown + 代码高亮） | 消息区 |
| F-04 | 停止生成（AbortController） | 发送钮旁 |
| F-05 | 对接 `chat.ts` 真实 SSE（后端就绪后） | API-PROTOCOL §6 |

**验收**：发一条消息 → 流式输出 → Markdown 代码块 → 可停止。

### Phase 2b — v0.2 多模型

| 任务 | 说明 |
|------|------|
| F-06 | `ModelSelect` + `models.ts` |
| F-07 | 顶栏模型 tag（fast/code/vision） |

### Phase 2c — v0.3 Feature + 本地会话

| 任务 | 说明 |
|------|------|
| F-08 | `FeatureGrid` 切换 featureId |
| F-09 | `DocGenerateForm` 表单场景 |
| F-10 | 会话 localStorage（PRD M5 演进） |
| F-11 | 空状态 Feature 快捷入口 |

### Phase 2d — v0.4 登录与隔离

| 任务 | 说明 |
|------|------|
| F-12 | `LoginPage`（对齐 `login.html`） |
| F-13 | 路由守卫 + `auth.ts` |
| F-14 | 会话改 API + userId 隔离 |
| F-15 | 配额展示 + 429 提示 |

### Phase 2e — v1.0 完整体验

| 任务 | 说明 |
|------|------|
| F-16 | `SettingsPage` + `ThemeProvider` 五主题 |
| F-17 | `AdminLayout` + M2/M3/M7 管理页 |
| F-18 | 图片上传 + Vision UI |
| F-19 | 删除 mockup-banner；生产 polish |

---

## 10. 已交付 vs 待实现

| 类别 | 已交付 ✅ | 待实现 ⏳ |
|------|-----------|-----------|
| 文档 | PRD、API 协议、本文档 | — |
| 原型 | 6 页 HTML + 五主题 + 响应式 | — |
| 前端 API | `client/src/api/*` 全套 TS | 页面组件未接 |
| 后端 AI | — | `/api/chat` SSE、M2 Provider… |
| React UI | 现有 Home/About | Chat、Login、Settings、Admin |
| 主题 | mockup CSS/JS | React ThemeProvider |

---

## 11. 业务规则速查（UI 相关）

| ID | 规则 |
|----|------|
| BR-01 | API Key 永不出现在前端 |
| BR-02 | system prompt 由服务端按 featureId 注入，前端不传 |
| BR-03 | 同 session 换模型只影响后续回复 |
| BR-04 | Feature `locked` 时隐藏模型选择 |
| BR-05 | 非 vision 模型禁用图片上传 |
| 主题 | 切换仅 Settings；存 localStorage，**无后端同步**（v1.0 可保持） |

---

## 12. 开放项与后续迭代

| 项 | 说明 |
|----|------|
| 动态壁纸素材 | 当前为 CSS 渐变 + SVG；可后续换 GIF/视频 |
| 主题后端同步 | 可选：用户表 `themePreference` 字段 |
| Ant Design 主题 | 是否用 ConfigProvider 映射五主题，或保留独立 CSS |
| 导出会话、Fallback 模型 | PRD P2 |
| i18n | 首期仅中文；META 已预留多主题中文案 |

---

## 13. 开发时推荐阅读顺序

1. **本文档** — 设计思路与任务顺序  
2. **打开** `docs/mockups/chat.html` + `settings.html` — 视觉基准  
3. **[API-PROTOCOL.md](./API-PROTOCOL.md)** — 接口与 `client/src/api/`  
4. **[PRD-FEATURES.md](./PRD-FEATURES.md)** — 模块验收标准  
5. **[DESIGN.md](./DESIGN.md)** — 架构与栈变更留痕  

**Agent 研发**：在 Cursor 对话输入 **`ui-dev`**，执行 [`.cursor/skills/ui-dev/SKILL.md`](../.cursor/skills/ui-dev/SKILL.md)，按 F-01～F-19 推进并更新 [progress.md](../.cursor/skills/ui-dev/progress.md)。

---

**变更记录**

| 日期 | 版本 | 说明 |
|------|------|------|
| 2026-06-18 | v1.0 | 初版：UI 设计总结、五主题规范、原型映射、前端开发计划 |
