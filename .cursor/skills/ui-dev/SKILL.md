---
name: ui-dev
description: >-
  Drives AI workbench UI implementation from docs/UI-DESIGN-PLAN.md and mockups.
  Use when the user sends ui-dev alone, or says 按文档研发, UI研发, 继续研发,
  UI 设计计划开发, or asks to implement chat/settings/login per the design docs.
disable-model-invocation: true
---

# ui-dev：按设计文档推进 UI 研发

## Overview

按 **[docs/UI-DESIGN-PLAN.md](../../../docs/UI-DESIGN-PLAN.md)** 的任务顺序（F-01～F-19）实施 React UI。
**视觉对齐** `docs/mockups/`；**接口对齐** [docs/API-PROTOCOL.md](../../../docs/API-PROTOCOL.md) 与 `src/api/`。

进度真相源：本目录 **[progress.md](progress.md)**（每轮结束必须更新）。

## When to Use

- 用户：**ui-dev**（单独一词）、**按文档研发**、**UI研发**、**继续研发**、**UI 设计计划开发**
- 用户要求按 mockup / UI-DESIGN-PLAN 实现对话页、设置页、主题等

**When NOT to use:**

- 仅问设计思路、不写代码 → 读文档回答即可
- 用户明确只做后端 / 只做 crm → 不启动本 skill
- 用户指定与 F 清单无关的大范围重构 → 先确认范围

## 权威文档（按序读取）

| 顺序 | 文件 | 用途 |
|------|------|------|
| 1 | [progress.md](progress.md) | 下一任务、已完成项 |
| 2 | [docs/UI-DESIGN-PLAN.md](../../../docs/UI-DESIGN-PLAN.md) | 原则、组件清单、验收 |
| 3 | 对应 `docs/mockups/*.html` + `themes.css` | 视觉基准 |
| 4 | [docs/API-PROTOCOL.md](../../../docs/API-PROTOCOL.md) § 相关节 | 接口契约 |
| 5 | [docs/PRD-FEATURES.md](../../../docs/PRD-FEATURES.md) | 模块验收（需要时） |

## Quick Reference

| 阶段 | 动作 | 可跳过？ |
|------|------|---------|
| **0 启动** | 读 progress + UI-DESIGN-PLAN；扫 `src/src/` 现状 | 否 |
| **1 定任务** | 默认做「下一任务」；用户指定 F-xx / 页面则优先 | 否 |
| **2 对齐** | 打开 mockup；列出本任务文件清单与验收点 | 否 |
| **3 实现** | 写代码；遵循设计原则（见下） | 否 |
| **4 验证** | `npm run build`；必要时 lint | 否 |
| **5 留痕** | 更新 progress.md；简短会话笔记 | 否 |
| **6 汇报** | 完成了什么、下一项、是否阻塞 | 否 |

## 设计原则（不可违反）

摘自 UI-DESIGN-PLAN §2，实现时必须遵守：

1. **主题切换仅在 `/settings`**，不在 Chat 顶栏/侧栏/banner 放切换器
2. **`app-layout`**：`100dvh`，仅 `.content` / 消息区滚动
3. **Ant Design 6** 落地，视觉对齐 mockup，不必复制 HTML class 名
4. **API Key 永不出前端**；system prompt 由服务端注入（BR-02）
5. **五主题**：`localStorage` key `mascot-theme`；壁纸逻辑见 `docs/mockups/themes.css`
6. **最小 diff**：只改本任务相关文件，不顺手重构无关模块

## 代码约定

| 项 | 约定 |
|----|------|
| 目录 | `src/src/pages/` 页面；`src/src/components/chat/` 对话组件；`src/src/theme/` 主题 |
| 路由 | `/chat`、`/login`、`/settings`、`/admin/*`（随任务逐步注册） |
| API | 复用 `src/src/api/*`，不重复造 fetch |
| 样式 | 优先 Ant Design token + 少量 CSS；可逐步迁入 mockup 的 themes.css |
| 后端未就绪 | F-05 前用 **mock SSE** / 假数据，不阻塞 F-01～F-04 |

## 阶段 0 — 启动

1. 读取 [progress.md](progress.md) 的 **下一任务** 与任务清单
2. 读取 UI-DESIGN-PLAN 中该任务所在 Phase 的说明
3. `Glob` / `Grep` 检查是否已有部分实现（避免重复建文件）
4. 若用户消息含 **F-xx**、页面名或「只做 xxx」，以用户为准并仍更新 progress

**仅查进度**：用户说 **ui-dev status** / **研发进度** → 只读 progress + 代码现状，输出表格，**不写代码**。

## 阶段 1 — 定任务

默认从 progress 中第一个 `pending` 的 F-xx 开始。

| 用户意图 | 行为 |
|----------|------|
| 无具体说明 | 做「下一任务」 |
| `F-03` / 「做 Markdown」 | 做指定 ID |
| 「继续」 | 下一 pending |
| 「跳到登录」 | F-12（若依赖未满足，**AskQuestion** 是否先补依赖） |

**依赖提示**（软约束，可 mock 跳过）：

- F-05 需要后端 `/api/chat` SSE
- F-13～F-15 需要 M1 后端
- F-17 需要 admin API

## 阶段 2 — 对齐 mockup

1. 打开 UI-DESIGN-PLAN 任务表中的 **原型** 列
2. 列出将创建/修改的文件（≤10 个为宜）
3. 写出 **本任务验收**（3～5 条 checkbox，来自 UI-DESIGN-PLAN / PRD）

## 阶段 3 — 实现

按任务 ID 参考（细节见 UI-DESIGN-PLAN §9）：

| 任务 | 核心交付 |
|------|----------|
| F-01 | `/chat` 路由、`AppLayout`（侧栏+顶栏+滚动区）、占位内容 |
| F-02 | `Composer`、发送 mock、假流式 append |
| F-03 | `MessageList`、`react-markdown`、代码块样式 |
| F-04 | AbortController 停止按钮 |
| F-05 | 接 `streamChat` / `parseSseStream` |
| F-06～F-07 | `ModelSelect`、models API |
| F-08～F-11 | Feature、DocForm、localStorage 会话 |
| F-12～F-15 | Login、守卫、会话 API、配额 |
| F-16 | Settings + ThemeProvider（五主题） |
| F-17～F-19 | Admin、Vision、收尾 |

**新增 npm 依赖**（如 react-markdown）：安装后若改 `package.json`，提醒用户 push 前可能需要 **stack-changelog**（若触及栈门禁）。

## 阶段 4 — 验证

```bash
npm run build
```

失败则修复后重跑。可选：`npm run lint`。

## 阶段 5 — 更新 progress.md

1. 将完成任务标为 `done`，填 **完成日期**（YYYY-MM-DD）
2. 更新 **下一任务** 为下一项 `pending`
3. **已完成文件** 追加路径列表
4. **会话笔记** 追加一行摘要

若 Phase 内全部 done，更新 **当前阶段** 为下一 Phase（如 2a → 2b）。

**不要**改 UI-DESIGN-PLAN 的任务定义；仅 progress 记状态。

## 阶段 6 — 汇报

输出结构：

```markdown
## ui-dev 本轮完成
- 任务：F-xx …
- 变更：…
- 验收：…

## 下一项
- F-xx …

## 阻塞（如有）
- …
```

## AskQuestion 场景

| 场景 | 选项示例 |
|------|----------|
| 指定任务缺依赖 | 先补依赖 / 用 mock 继续 / 中止 |
| mockup 与 Ant Design 冲突 | 跟 mockup / 简化 AD 默认 / 中止 |
| 一次做多条 F | 只做一条（推荐）/ 连续 F-xx～F-yy |

默认 **一次 ui-dev 只做一条 F-xx**，保证可 review。

## 与 crm / stack-changelog 关系

- 本 skill **不自动 commit/push**
- 用户随后说 **crm** 时按 crm skill 提交
- 改了 `package.json`、vite 等栈文件 → push 前 **stack-changelog**

## Red Flags

- 跳过读 progress 直接写 ChatPage → 可能重复或顺序错
- 在顶栏加主题切换 → 违反设计原则
- 一次提交整 Phase 全部任务 → 范围过大
- 未跑 build 就标 done → 禁止
- 未更新 progress.md 就结束 → 禁止

## 相关文件

- [progress.md](progress.md) — 进度
- [docs/UI-DESIGN-PLAN.md](../../../docs/UI-DESIGN-PLAN.md) — 设计与计划
- [docs/mockups/](../../../docs/mockups/) — HTML 原型
