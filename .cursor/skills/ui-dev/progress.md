# UI 研发进度

> 由 **ui-dev** skill 维护。每完成一项任务更新本文件；用户手动修正进度时注明原因。

## 当前阶段

**Phase 4a** — Owner Bio RAG（前后端 P4-01 / P4-02 done）

## 下一任务

P4-03：联调验收（站长保存 → 了解主人问答）；P4-04 citations UI（Phase 4b）

## 任务清单

### Phase 1～2e（v1.0 UI）

| ID | 状态 | 说明 | 完成日期 |
|----|------|------|----------|
| F-01 | done | ChatPage 路由 + AppLayout | 2026-06-18 |
| F-02 | done | Composer + mock SSE | 2026-06-18 |
| F-03 | done | MessageList Markdown 渲染 | 2026-06-18 |
| F-04 | done | 停止生成 AbortController | 2026-06-18 |
| F-05 | done | 对接 chat.ts 真实 SSE（失败回退 mock） | 2026-06-18 |
| F-06 | done | ModelSelect + models.ts | 2026-06-18 |
| F-07 | done | 顶栏模型 tag | 2026-06-18 |
| F-08 | done | FeatureGrid 切换 featureId | 2026-06-18 |
| F-09 | done | DocGenerateForm 表单场景 | 2026-06-18 |
| F-10 | done | 会话 localStorage | 2026-06-18 |
| F-11 | done | 空状态 Feature 快捷入口 | 2026-06-18 |
| F-12 | done | LoginPage | 2026-06-18 |
| F-13 | done | 路由守卫 + auth.ts | 2026-06-18 |
| F-14 | done | 会话 API + userId 隔离（API 优先，local 回退） | 2026-06-18 |
| F-15 | done | 配额展示 + 429 提示 | 2026-06-18 |
| F-16 | done | SettingsPage + ThemeProvider 五主题 | 2026-06-18 |
| F-17 | done | AdminLayout + 管理页 | 2026-06-18 |
| F-18 | done | 图片上传 + Vision UI | 2026-06-18 |
| F-19 | done | 删除 mockup-banner；生产 polish | 2026-06-18 |

### Phase 4a（Owner Bio · 前端）

| ID | 状态 | 说明 | 完成日期 |
|----|------|------|----------|
| P4-01 | done | 前端：free-chat 默认、ask-owner 跳过 Path A、设置页 sync | 2026-07-06 |
| P4-02 | done | 后端 node：RAG 模块、owner-public KB、ask-owner、chat.ts 接入 | 2026-07-07 |
| P4-03 | pending | 联调验收 §14.1 | — |
| P4-04 | pending | SSE citations 展示（Phase 4b） | — |

## 已完成文件（累计）

- `src/lib/featureOrder.ts` — 场景排序与默认 free-chat
- `src/api/types.ts` — ragEnabled、CitationItem、OwnerKbSyncResponse
- `src/api/ownerProfile.ts` — sync-kb、resume API
- `src/api/chat.ts` — citations SSE 事件解析
- `src/components/chat/ChatContext.tsx` — ask-owner 路由例外、场景排序
- `src/components/settings/OwnerProfileEditor.tsx` — 简历 + 保存并更新索引
- `src/components/layout/FeatureScroll.tsx` — 主场景高亮
- `src/data/mockCatalog.ts` — ask-owner / free-chat mock
- `src/lib/ownerProfile.ts` — 问候语指向了解主人
- `src/pages/SettingsPage.tsx` — 站长公开资料文案
- `src/styles/admin.css` / `app-layout.css` — 简历区与主场景 pill 样式
- （Phase 1～2e 文件见历史记录）

## 会话笔记

| 日期 | 摘要 |
|------|------|
| 2026-06-18 | 初始化 progress；下一项 F-01 |
| 2026-06-18 | F-01～F-19 全部完成；build 通过 |
| 2026-07-06 | 按 Phase 4 设计文档推进：P4-01 前端路由与 Owner Bio 设置页；待 node 后端 RAG |
| 2026-07-07 | node 后端 P4-02：KB 模型、lib/rag、site sync-kb/resume、chat RAG、seed ask-owner；build+seed 通过 |
