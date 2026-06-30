---
name: stack-changelog
description: >-
  Records technology stack and architecture changes into project design docs for
  traceability. Use when the user says stack-changelog, 技术栈留痕, 记录技术栈变更,
  设计留痕, 栈变更同步, or after adopting/replacing frameworks, dependencies, DB,
  ORM, deployment, or API contracts — sync updates to docs/DESIGN.md (or equivalent).
disable-model-invocation: true
---

# stack-changelog：技术栈与设计变更留痕

## 目标

每次执行时：**发现变更 → 提炼理由 → 同步到设计文档**，在 `§9 设计变更记录` 留痕，并更新栈表与版本号，方便日后 review 追溯当初设计与变更原因。

## 触发词

- **stack-changelog**（单独一词，优先）
- 技术栈留痕 / 记录技术栈变更 / 设计留痕 / 栈变更同步

## 设计文档定位（按优先级）

1. `docs/DESIGN.md`（本项目标准）
2. 工作区 `**/DESIGN.md`
3. `docs/ARCHITECTURE.md` 或 `docs/design.md`
4. 以上皆无 → 询问用户目标文档路径；仍无则在工作区 `docs/DESIGN.md` 按 [reference.md](reference.md) 骨架创建

**禁止**把变更只写在对话里而不落盘。

---

## 执行流程

### 阶段 0 — 收集事实

并行执行：

```bash
git status
git diff
git diff --staged
```

并读取（存在则读）：

| 文件 | 用途 |
|------|------|
| `package.json` | 依赖与脚本 |
| `package-lock.json` / `pnpm-lock.yaml` / `yarn.lock` | 锁定版本 |
| `prisma/schema.prisma` | 数据库 / ORM |
| `vite.config.*` / `tsconfig*.json` / `docker-compose*.yml` | 构建与部署 |
| 目标设计文档全文 | 当前栈表与 §9 |

**变更信号**（任一即视为需留痕）：

- `dependencies` / `devDependencies` 增删改
- 框架、ORM、数据库、部署方式替换
- `docs/` 内 API 契约或 Roadmap 相关改动
- 用户对话中已说明的选型决策（即使尚未 commit）

无实质变更 → 告知「无可记录的技术栈变更」，**结束**。

### 阶段 1 — 归纳变更草稿

产出内部草稿（先不写入文档），包含：

| 字段 | 说明 |
|------|------|
| **变更类型** | `新增` / `升级` / `替换` / `移除` / `否决` / `暂缓` / `架构` / `API` |
| **影响层级** | 前端 / 后端 / 全栈 / 运维 / 文档 |
| **变更摘要** | 一行，≤80 字，动词开头 |
| **理由** | 1～3 句：为什么选它、为什么不选别的（从对话或 diff 提取） |
| **影响范围** | 如 `client/`、`server/prisma/`、`docs §5` |
| **关联文件** | 实际改动的路径列表 |

**理由来源优先级**：用户当轮说明 > 设计文档 §2.2 既有结论 > diff 上下文推断。

若理由不明确，用 `AskQuestion` 一次收集（可合并为一道多选 + Other）：

- 性能 / 成本 / 熟悉度 / 生态统一 / MVP 简化 / 安全合规 / 其他（请补充）

### 阶段 2 — 版本号

读取文档头 `文档版本`（如 `v0.1.0`），按变更幅度 bump：

| 幅度 | 规则 | 示例 |
|------|------|------|
| **patch** | 同栈内版本升级、小依赖、文档同步 | v0.1.0 → v0.1.1 |
| **minor** | 新接入组件（DB、ORM、新框架层） | v0.1.1 → v0.2.0 |
| **major** | 主栈替换（如 Express→Fastify、React→Vue） | v0.2.0 → v1.0.0 |

同时更新文档头 **`最后更新`** 为当天 `YYYY-MM-DD`。

### 阶段 3 — 写入设计文档

严格 **只追加、不删改** §9 历史行；其余章节 **增量更新**。

#### 3.1 文档头

```markdown
> **最后更新**：YYYY-MM-DD
> **文档版本**：vX.Y.Z
```

#### 3.2 §2.1 栈总览

- 新增行：填层级、选型、版本（从 `package.json` 取 semver 范围）、状态 `✅ 已采用`
- 升级：只改版本列与表头「版本（截至 YYYY-MM-DD）」
- 替换：旧行标 `🔄 已替换为 XXX` 或删除行并加新行（须在 §9 写明替换关系）
- 计划落地： `⏳` → `✅`

#### 3.3 §2.2 已否决 / 暂缓（若适用）

替换或放弃某选型时追加一行：选项、结论、**理由**、复评条件。

#### 3.4 §1.3 Roadmap（若适用）

阶段切换或目标变化时更新，并在 §9 摘要中提及 Phase。

#### 3.5 §5 API 契约（若本次含接口变更）

先文档后代码；在 §9「影响范围」写明端点。

#### 3.6 §9 设计变更记录 — **必做**

在表格**最后一行后追加**（不改动既有行）：

```markdown
| vX.Y.Z | YYYY-MM-DD | 【摘要】；理由：【一句话】 | client/server/docs/... | — |
```

摘要须自包含：后人不看 diff 也能懂「改了什么、为什么」。

#### 3.7 README.md（可选）

若首段技术栈一句话描述已过时，同步更新（如 `React + Vite + Node` 部分）。

### 阶段 4 — 审阅输出

向用户展示：

1. **§9 新增行**（原文）
2. **§2.1  diff 要点**（改了哪些行）
3. **新版本号**与 bump 理由
4. **未自动覆盖**、需人工确认的章节（若有）

**不要**代替用户执行 `git commit`，除非用户另行要求。

---

## 与实现任务的关系

| 场景 | 行为 |
|------|------|
| 用户刚做完技术栈改动，说「留痕」 | 以 diff + 对话为准，执行全流程 |
| 用户只说 stack-changelog，无近期改动 | 扫描工作区与文档差异；仍无则报告无变更 |
| 用户边改代码边留痕 | 记录「进行中」决策，状态列可用 `🚧 接入中`，落地后改 `✅` 并再记一条 §9 |
| 否决某技术 | 写 §2.2 + §9，不必改 §2.1 |

---

## 质量检查（完成前自检）

- [ ] §9 已追加且含 **理由**
- [ ] §2.1 版本与 `package.json` 一致
- [ ] 文档头日期、版本已更新
- [ ] 未删除 §9 历史记录
- [ ] 摘要独立可读，不依赖当前会话上下文

---

## Push 门禁（自动）

本项目在 **`git push` 前**强制检查留痕是否完成（Agent 在 Cursor 内 push 同样生效）：

| 机制 | 路径 | 行为 |
|------|------|------|
| **crm 阶段 4-前置** | `.cursor/skills/crm/SKILL.md` | `crm` 推送前主动跑检查；失败则执行本 skill 再 push |
| Git pre-push | `.githooks/pre-push` → `scripts/check-stack-changelog.mjs` | 终端 / IDE / crm 推送均拦截 |
| Cursor hook | `.cursor/hooks.json` → `beforeShellExecution` | Agent 执行 `git push` 时拦截并提示执行本 skill |
| 手动自检 | `npm run check:stack-changelog` | 推送前本地验证 |

**判定逻辑**：待推送提交中若出现 `package.json`、`prisma/schema.prisma`、`vite.config.*` 等技术栈文件变更，且 **未**同时修改 `docs/DESIGN.md` → 拒绝 push。

**用户须先**：执行本 skill 完成 §2.1、§9 同步，再 `git push`。

**紧急跳过**（不推荐）：`SKIP_STACK_CHANGELOG=1 git push` 或 `git push --no-verify`。

首次 `git init` 后运行 `npm install`（`prepare` 脚本）会将 `core.hooksPath` 指向 `.githooks`。

## 附加资源

- 文档章节映射与骨架：[reference.md](reference.md)
