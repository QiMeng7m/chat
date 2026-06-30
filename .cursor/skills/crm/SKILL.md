---
name: crm
description: >-
  Git commit-rebase-push workflow skill — NOT customer relationship management.
  Use immediately when the user sends "crm" alone, or says commit-rebase-merge,
  git-commit-rebase, 提交并推送, or commit and push. Do NOT search the codebase for CRM.
  Before git push, runs stack-changelog gate in this project.
disable-model-invocation: true
---

# crm：提交、远程同步与冲突处理

## Overview

自动化 Git 提交→拉取→推送链路。**先对齐远程再写说明，先展示审阅再 commit**，中文为主，
冲突时分析后由用户按钮选择策略。

**本项目扩展**：阶段 4 push 前强制执行 [stack-changelog](stack-changelog/SKILL.md) 门禁（`npm run check:stack-changelog`）。

## Quick Reference

| 阶段 | 何时执行 | 核心动作 | 可跳过？ |
|------|---------|---------|---------|
| **1-前置** | 有未提交改动时 | `fetch` + `pull --rebase`，对齐远程 | 否（有改动时） |
| **1** | 有未提交改动时 | 生成中文说明 → TB（可选）→ **审阅按钮** → commit | TB 可跳过 |
| **2** | commit 后（或无改动时唯一拉取） | `fetch` + `pull --rebase` | 否 |
| **3** | 任一次拉取有冲突时 | 分析 → **按钮选择策略** → 解决 → continue | 否（有冲突时） |
| **4-前置** | 阶段 4 push 前 | `check:stack-changelog`；失败则执行 stack-changelog 并 commit 文档 | 否 |
| **4** | 4-前置通过后 | `git push`（自动化） | 无领先时跳过 |

**无未提交改动时**：跳过阶段 1-前置 与 1，从阶段 2 开始。

## When to Use

- 用户调用 **crm**、**commit-rebase-merge**、**git-commit-rebase**
- 用户要求「提交并推送」「commit and push」「同步到远程」
- 用户要求按链路完成从本地到远程的完整同步

**When NOT to use:**
- 用户只想 `git commit` 不推送 → 仅执行阶段 1
- 用户只想 `git pull` 不提交 → 仅执行阶段 2
- 用户明确要求 `git push --force` → 拒绝自动执行，走阶段 4 例外流程

## User Confirmation Rules

**必须用按钮（`AskQuestion`），禁止要求打字确认。** 数据输入（TB 单号/内容、修改标题正文）不算"打字确认"。

| 场景 | 确认方式 |
|------|---------|
| 提交前审阅 | `AskQuestion`：采用 / 修改 / 暂不提交 / 中止 |
| 上游未设置 | `AskQuestion`：列出远程分支选项 |
| 冲突策略 | `AskQuestion`：A 接入 / B 直接策略 → (若 B) ours / theirs / 中止 |
| 需 force-with-lease | `AskQuestion`：确认推送 / 取消 |
| stack-changelog 门禁失败 | 自动执行留痕 skill，文档 commit 后重试检查；不弹「是否跳过」除非用户已明确要求跳过 |
| 普通 `git push` | **4-前置通过后**自动执行，不弹确认 |

## Stage 1 — 本地提交

### 1-前置：先拉远程再写说明（有未提交改动时）

**为什么必须在写说明之前拉取：** 若先 commit 再 pull，会产生 `Merge branch '…' of … into …` 合并提交，
破坏线性历史。先拉后写 = 基于最新远程撰写说明 = 推送前无需额外 merge。

1. `git fetch` + `git pull --rebase`（规则同阶段 2）
2. 拉取失败或冲突 → 进入**阶段 3**；解决后回到此处继续
3. 脏工作区导致 pull 失败 → 可选 `git stash push` → pull → `git stash pop`，或 `AskQuestion` 让用户选择
4. 成功后进入「生成说明」

**快速模式例外：** 用户明确说「赶时间/快速/不要停顿」时，可将 1-前置 合并到阶段 2 一次完成
（仅 fetch + pull 一次，在 commit 之后），但须在输出中注明「已合并拉取步骤，若产生 merge 提交请知悉」。

### 生成说明（$S$ / $G$）

1. 执行 `git status`、`git diff`；有暂存区则 `git diff --staged`
2. **无改动** → 说明「无待提交变更」，跳过 TB 与 commit，**直接进入阶段 2**
3. **有改动** → 产出初稿：
   - **标题 $S$**：≤72 字符，祈使语气，优先 `类型(范围): 中文摘要`（Conventional Commits 前缀可保留英文，冒号后须中文）
   - **正文 $G$**：1~5 句中文，归纳改了什么、为什么；从对话提取需求/根因
   - **反例**：`fix(shelf): keep tag_type as number in params and on save`
   - **正例**：`fix(shelf): 保持 tag_type 在参数与保存时为数字类型`
   - 专有名词（API、字段名、文件名等）保留英文

### TB 单关联（可跳过）

1. **TB 信息来源仅限于当前对话中用户明确提供的消息**。**禁止从 git log、历史提交记录中读取 TB 信息**——
   git 历史中的 TB 单号是过去提交附带的，不代表本次提交也需要关联同一个单号。
   若用户在当前对话中提供了 TB 信息（匹配 `TB-\d+`、`[A-Z]+-\d+` 等单号格式，或链接/说明）：**不再弹按钮**，
   直接提取为 $T$，进入「定稿」步骤。

   **Teambition 任务链接自动摘要**：若用户提供了 Teambition 任务链接（匹配
   `https?://[^/]*teambition\.(com|net)/task/([0-9a-fA-F]+)`），先提取 taskId
   （URL 路径中 `/task/` 后的最后一段），再调用 `tb_fetch.py` 自动获取任务摘要：

   执行方式：
   ```
   python3 ".cursor/skills/crm/tb_fetch.py" <taskId> <原始URL>
   ```
   Windows 下 `python3` 不可用时改用 `python`。

   该脚本输出一行 JSON，包含四个字段：`url`（原始链接）、`display_id`（项目简称-编号，
   如 `jzbug-6654`）、`title`（任务标题全文）、
   `comments`（评论列表，可能为空数组）。

   - **成功**：解析 JSON 输出，根据 `title` 和 `comments` 生成一句话摘要
     （控制在 60 字内，无评论时直接用 `title`），按以下格式构造 TB 信息块：
     ```
     TB链接：<url>
     TB正文：[<display_id>] <摘要>
     ```
   - **API 调用失败**（脚本以非零退出码退出）：保持原始链接作为 $T$，
     继续执行（不阻塞提交流程）
   - **多个链接**：每个 Teambition URL 独立调用 `tb_fetch.py`，各自生成独立的
     TB 信息块；多项之间以空行分隔合并为 $T$
   - **链接 + 其他文本**：URL 部分走自动摘要生成 TB 信息块，其余文本照常提取；
     合并为 $T$
   - **非 Teambition 链接或纯文本单号**：直接作为 $T$ 内容，不调用脚本

   提取规则（适用于所有 TB 信息来源，包括自动摘要结果）：
   - **保留**：单号、自动摘要结果（TB 信息块）、非 URL 链接、实质性说明文字
   - **去掉**：对话性前缀（如「I have TB ticket」「我的单号是」）和命令性语句
     （如「用 crm」「提交一下」「commit and push」）
   - **多个单号/摘要**：以空行分隔写入同一 $T$
   - 若去掉外围后 trim 为空，视为未提供，回退到步骤 2
2. **若用户未提供 TB 信息**：`AskQuestion` 提供 **「跳过」** / **「填写 TB 信息」**；
   若选填写，请用户在下一则消息中粘贴内容，收到后作为 $T$。
   **快速模式**：自动跳过 TB 步骤（不弹按钮），视为无 $T$。
3. **定稿规则**（简化版）：
   - **无 $T$**：`git commit -m "$S"`（$G$ 非空时追加 `-m "$G$"`）
   - **有 $T$**：标题 $S$ 不变；正文 = $G$ + 空行 + $T$（$G$ 在前，$T$ 在后）
   - $T$ 中每个 Teambition 自动摘要项使用固定两行格式：
     ```
     TB链接：<原始URL>
     TB正文：[<displayId>] <内容摘要>
     ```
     非 Teambition 的单号或文本保持原样；多项之间以空行分隔
   - 若需调整 $T$ 位置或格式，用户会在修改环节说明
   - $T$ 可混合中文（自动摘要结果）与英文（单号/链接），$G$ 为中文，混合语言正文属正常现象

### 提交前审阅（必须，不可跳过）

**目的：** commit 前让用户看见完整拟定内容，可选择采用、修改或中止。

1. **展示**：用代码块列出当前拟定的**标题**和**正文**
2. **`AskQuestion`（按钮）**：
   - **「采用并提交」** → 执行 commit，继续链路
   - **「修改标题或正文」** → 用户在下一则消息贴修订内容，覆盖后回到步骤 1 重新展示
   - **「暂不提交，仅同步远程」** → 跳过 commit，进入阶段 2
   - **「中止」** → 结束，不 commit、不进入后续阶段

**快速模式：** 用户说「赶时间/直接提交/不用审阅」时，审阅退化为**双按钮**：
「确认提交并推送」/ 「修改」。仍须展示拟定内容，不得完全跳过展示。
注意：快速模式下阶段 4 自动推送的是阶段 2 拉取后的最终状态，可能与审阅时展示的 diff 有差异（若远程在期间有更新）。

### 执行 commit

仅当用户点选「采用并提交」后执行：选择性 `git add` 相关文件（避免 `git add .` 误加无关文件），
再 `git commit -m "标题" -m "正文"`。commit 失败则停止链路。

---

## Stage 2 — 再次拉取远程

commit 后（或无 commit 场景的唯一拉取）执行，保证推送前与远程一致：

1. `git fetch`
2. `git branch --show-current` + 确认上游
3. **已设上游**：`git pull --rebase`
4. **未设上游**：`AskQuestion` 列出可选远程分支或「中止」
5. 成功无冲突 → **进入阶段 4**（先 4-前置，再 4-推送）
6. 有冲突 → **进入阶段 3**

**为什么需要两次拉取：** 1-前置保证基于最新远程写说明，阶段 2 保证推送前远程未变。
两次之间可能相隔数分钟（撰写说明 + TB + 审阅），远程可能已有新提交。

---

## Stage 3 — 冲突处理

当出现 `CONFLICT` 或 rebase/merge 中止时：

### 收集信息
- `git status`
- `git diff --name-only --diff-filter=U`
- 查看冲突标记，分析后给出推荐

### 输出《冲突分析》
每个冲突文件：**路径**、**冲突类型**、**推荐处理**、**风险**（可选）

### 用户选择（`AskQuestion`，两轮）
- **第一轮**：**A — 接入**（按分析逐文件解决）/ **B — 直接策略**
- **若选 B，第二轮**：**全仓 ours** / **全仓 theirs** / **中止 merge/rebase**
  - 题干须注明：rebase 下 ours/theirs 与 merge 下含义相反

解决后 `git add` + `git rebase --continue`（或完成 merge）。
- 若冲突发生在 **1-前置** → 回到阶段 1 继续
- 若冲突发生在 **阶段 2** → 进入阶段 4（先 4-前置）

---

## Stage 4 — 推送（自动化）

### 4-前置：stack-changelog 门禁（本项目必做）

**在任意 `git push` 之前执行**，与 `.githooks/pre-push`、Cursor `beforeShellExecution` 一致。

1. 运行 `npm run check:stack-changelog`（即 `node scripts/check-stack-changelog.mjs`，`STACK_CHECK_MODE=pending`）
2. **退出码 0** → 进入 **4-推送**
3. **退出码非 0**（技术栈文件已改但 `docs/DESIGN.md` 未同步）：
   - **停止推送**，向用户说明拦截原因
   - **读取并执行** [`.cursor/skills/stack-changelog/SKILL.md`](stack-changelog/SKILL.md)，完成 `docs/DESIGN.md` 同步（§2.1、§9 等）
   - 若有文档变更：`git add docs/DESIGN.md`（及 README 等若 skill 改过）→ `git commit`（如 `docs: 技术栈变更留痕`）
   - **再次**运行 `npm run check:stack-changelog`；仍失败则继续修文档，**不得 push**
   - **禁止**擅自 `git push --no-verify` 或 `SKIP_STACK_CHANGELOG=1`，除非用户在本轮对话**明确要求**跳过并注明风险
4. 文档留痕 commit 后若需与远程对齐，可再执行阶段 2 的 fetch + pull --rebase（有冲突进阶段 3），通过后回到 4-前置

### 4-推送

**4-前置通过后**自动 `git push`，不弹确认：

1. 阶段 2 无冲突或阶段 3 已解决；工作区干净；4-前置已通过
2. 已配置上游 → `git push`（**不要**加 `--no-verify`）
3. 未配置上游 → `AskQuestion`：**「git push -u origin <分支名>」** / **「仅本地结束」**
4. 无领先提交 → 「与远程无差异，无需推送」
5. 推送被拒（非快进）→ **不自动强推**；`AskQuestion`：**「force-with-lease」** / **「取消」**
6. 若 hook 仍拦截 push → 回到 **4-前置**，勿用 `--no-verify` 硬推

---

## Common Mistakes

| 错误 | 为什么会犯 | 正确做法 |
|------|-----------|---------|
| 跳过 1-前置直接写说明 | 感觉与阶段 2 重复，赶时间时最先被省略 | 两次拉取间隔可能数分钟，远程可能已更新；跳过 = merge 提交风险 |
| 跳过 4-前置直接 push | 以为 hook 会自动留痕 | crm 须在 push 前主动跑 check；失败则执行 stack-changelog |
| 门禁失败后用 `--no-verify` 强推 | 想省事 | 先 stack-changelog + 文档 commit；仅用户明确要求才可跳过 |
| TB 信息写入标题 | 许多团队习惯标题中放单号 | 本 skill **默认不改动标题**，TB 信息仅写入正文 |
| 从 git log 提取 TB 单号自动填入 | 上次提交带了 TB 信息，log 里有 | TB 信息只从当前对话用户消息获取，**禁止读 git log** |
| 用户已给 TB 信息仍弹按钮 | 机械执行规则 | 用户已在当前对话中提供时直接提取 $T$，不重复询问 |
| 跳过审阅直接 commit | 用户已看过/赶时间/消息显而易见 | 始终展示 + AskQuestion；快速模式可退化为双按钮但不可完全跳过 |
| `git add .` 误加无关文件 | 图快 | 选择性 `git add` 相关文件 |
| 冲突时擅自 `--ours`/`--theirs` | 以为用户会选某个方向 | 必须通过按钮确认后再执行 |

## Red Flags — STOP and Re-evaluate

- 「用户已经看过这个消息了，不用再展示审阅」→ 仍须展示 + 按钮
- 「赶时间，跳过 TB 和审阅直接 commit 吧」→ 可用快速模式，但不可完全跳过
- 「改动很小，不用先拉取了」→ 小改动也可能冲突，1-前置不可跳过（快速模式除外，但须注明已合并拉取步骤）
- 「用户说了『提交并推送』，等于批准了所有步骤」→ 不等于批准了具体 commit 内容
- 「技术栈改了但 DESIGN 晚点再写，先 push」→ **禁止**；走 4-前置 + stack-changelog
- 「hook 拦了，加 --no-verify 就行」→ 除非用户明确要求，否则回到 stack-changelog
- 「这个英文消息更好写，就用英文吧」→ 标题摘要须中文（专有名词除外）
- 「上次提交里有 TB 单号，直接用那个」→ **禁止从 git log 读取 TB 信息**，TB 来源仅限于当前对话用户消息

**以上所有都意味着：回到规则，走完整流程。**

---

## 安全约束

- 不默认 `--no-verify`；仅用户明确要求时使用并注明风险（含绕过 stack-changelog 门禁的风险）
- 不默认 `push --force` / `force-with-lease`；需改写远程历史时 `AskQuestion`
- 默认 `git pull --rebase`，降低 merge 提交出现概率
- 子模块、LFS、大文件冲突在阶段 3 分析中单列

## 执行检查清单

- [ ] 1-前置：有改动时已在写说明前 fetch + pull --rebase；冲突已处理并回到阶段 1
- [ ] 1：已看 status/diff；无改动跳过 commit 进阶段 2；中文为主；TB 已处理（或跳过）；
  已审阅展示 + AskQuestion 后才 commit
- [ ] 2：commit 后已 fetch + pull；上游缺失已按钮选择
- [ ] 3：有冲突已输出分析 + 按钮选择后才改文件并 continue；已回到正确后续阶段
- [ ] 4-前置：`npm run check:stack-changelog` 已通过；若失败已执行 stack-changelog 并 commit 文档后重试
- [ ] 4：已 git push 或判定无需推送；异常已 AskQuestion 处理

## 相关 Skills

- [stack-changelog](stack-changelog/SKILL.md) — 技术栈/设计变更留痕（阶段 4-前置联动）
