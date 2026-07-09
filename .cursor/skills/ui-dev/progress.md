# UI 研发进度

> 由 **ui-dev** skill 维护。每完成一项任务更新本文件；用户手动修正进度时注明原因。

## 当前阶段

**Phase 2e 完成** — v1.0 完整体验（F-01～F-19 全部 done）

## 下一任务

无（全部完成）。后续迭代见 UI-DESIGN-PLAN §12 开放项。

## 任务清单

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

## 已完成文件（累计）

- `vite.config.ts` — `@mockups` 别名引用原型 CSS
- `index.html` — 主题防闪屏脚本、中文 title
- `src/main.tsx` — ThemeProvider + AuthProvider
- `src/App.tsx` — 全路由（/chat、/login、/settings、/admin/*）
- `src/styles/app-layout.css` — 全屏壳层、消息、Composer、空状态、表单
- `src/styles/login.css` — 登录页样式
- `src/styles/admin.css` — 管理后台样式
- `src/types/chat.ts` — 消息与会话类型
- `src/theme/meta.ts` — 五主题 META
- `src/theme/ThemeProvider.tsx`
- `src/data/mockCatalog.ts` — 模型/Feature mock 回退
- `src/lib/localSessions.ts` — 本地会话存储
- `src/context/AuthContext.tsx`
- `src/components/auth/RequireAuth.tsx` / `RequireAdmin.tsx`
- `src/components/chat/ChatContext.tsx` — 完整对话状态
- `src/components/chat/mockStream.ts`
- `src/components/chat/Composer.tsx` — 停止/上传/配额
- `src/components/chat/MessageList.tsx` — Markdown + 空状态快捷入口
- `src/components/chat/MarkdownContent.tsx`
- `src/components/chat/ModelSelect.tsx`
- `src/components/chat/DocGenerateForm.tsx`
- `src/components/theme/ThemePicker.tsx`
- `src/components/layout/AppLayout.tsx`
- `src/components/layout/Sidebar.tsx`
- `src/components/layout/ChatTopbar.tsx`
- `src/components/layout/FeatureScroll.tsx`
- `src/components/layout/BottomNav.tsx`
- `src/components/layout/AdminLayout.tsx`
- `src/pages/ChatPage.tsx`
- `src/pages/LoginPage.tsx`
- `src/pages/SettingsPage.tsx`
- `src/pages/admin/*.tsx` — 概览/Provider/模型/Feature/用户
- `package.json` — react-markdown 等依赖

## 会话笔记

| 日期 | 摘要 |
|------|------|
| 2026-06-18 | 初始化 progress；下一项 F-01 |
| 2026-06-18 | F-01 完成：AppLayout 壳（侧栏/顶栏/滚动区/底栏）、/chat 路由、占位空状态；build 通过 |
| 2026-06-18 | F-02 完成：Composer + ChatContext mock 流式；发送后逐字 append 助手回复；build 通过 |
| 2026-06-18 | F-03 完成：MarkdownContent（react-markdown + remark-gfm + rehype-highlight）；助手消息渲染 MD/代码块；mock 回复含代码块示例；build 通过 |
| 2026-07-09 | 打卡日历 UI：设计文档 CHECKIN-CALENDAR-DESIGN.md、mockup 日历、CheckInCalendar + 补卡弹窗（mock localStorage）；tsc 通过 |
