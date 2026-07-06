# 抽奖奖品效果系统 — 设计文档

> **文档版本**：v1.1  
> **日期**：2026-07-06  
> **状态**：设计稿（待研发）  
> **关联**：[DESIGN.md](./DESIGN.md) · [API-PROTOCOL.md](./API-PROTOCOL.md) · [mockups/lottery.html](./mockups/lottery.html) · [mockups/lottery-admin.html](./mockups/lottery-admin.html)

---

## 1. 背景与目标

当前抽奖为「每日打卡 1 次 → 固定 1 次抽奖」，奖品仅有展示名称，无法表达「+1 次」「下次 ×2」等机制。

本设计在**不改变「随机抽奖由服务端执行」**的前提下，支持：

1. 管理员在奖池中配置 **奖励类型 + 运算符号 + 数量**
2. 用户抽中后由服务端自动改状态（次数、Buff、里程等）
3. **待生效 Buff** 在无抽奖机会时仍保留，直到下次 `draw` 消费
4. 三种效果类型均支持 **`+` 与 `×`**；下次抽奖奖励队列中 **`+` 相加、`×` 相乘**后合并计算转出个数

---

## 2. 产品规则（已确认）

| 规则 ID | 说明 |
|---------|------|
| R-01 | 随机结果与副作用必须在同一次 `POST /draw` 服务端事务内完成，前端不传 effect key |
| R-02 | 奖品配置存 DB：`effectTarget` + `effectOp` + `effectValue` + `effectTiming` |
| R-03 | **即时效果**（如抽奖次数 +N）：抽中后立刻改当日 `drawsGranted` |
| R-04 | **排队效果**（如下次奖励 ×N）：写入 `LotteryClientState.pendingEffects`，下次 `draw` 消费 |
| R-05 | 无抽奖机会时 **不消费 Buff**，`status` 仍返回 `pendingEffects` |
| R-06 | Buff **仅在 `draw` 成功时清除**，可跨日保留至下次有机会抽奖 |
| R-07 | `next_draw_reward` 队列：`+` **相加**、`×` **相乘**，合并公式见 §3.2（×2 再 ×2 → 4；+1 与 ×2 → 4） |
| R-08 | 单次 `draw` 仍只扣 **1** 次今日机会；`rollCount > 1` 时一次转出多个奖品 |
| R-09 | 运动里程加成（P2）在打卡时计算；本文档先定义奖品效果，加成规则见 §8 |

---

## 3. 奖励类型与运算语义

管理员配置三件套：**奖励类型 → 运算符号（`+` / `×`）→ 数量**。

三种效果类型**均支持 `+` 与 `×`**；`effectTiming` 由类型决定，管理员不手填。

| effectTarget | 中文名 | effectOp | effectTiming | 抽中后行为 |
|--------------|--------|--------|--------------|------------|
| `none` | 普通奖励 | — | — | 仅展示与记录 |
| `draw_chance` | 抽奖次数 | `+` 或 `×` | `immediate` | 见 §3.1 |
| `next_draw_reward` | 下次抽奖奖励 | `+` 或 `×` | `on_next_draw` | 入队 Buff，下次 `draw` 消费，见 §3.2 |
| `distance_km` | 运动里程 | `+` 或 `×` | `immediate` | 见 §3.1 |

**校验**：`effectValue` 为 ≥1 整数；`×` 时建议 value ≥ 2（×1 无意义，服务端可拒绝或当 1 处理）。

### 3.1 即时效果（`draw_chance` / `distance_km`）

抽中后**当场**改当日打卡记录：

**抽奖次数 `draw_chance`**

| op | 公式 | 示例 |
|----|------|------|
| `+` | `drawsGranted += value` | 剩余 1 次，+1 → 共 2 次 |
| `×` | `drawsGranted = max(1, drawsGranted) × value` | 共 2 次，×2 → 共 4 次 |

**运动里程 `distance_km`**

记 `total = distanceKm + bonusDistanceKm`（打卡填报 + 奖品累计）

| op | 公式 | 示例 |
|----|------|------|
| `+` | `bonusDistanceKm += value` | total 5km，+3 → 8km |
| `×` | `bonusDistanceKm = total × value - distanceKm` | total 5km，×2 → 10km |

周/月统计读取含 `bonusDistanceKm` 的合计。

### 3.2 排队效果（`next_draw_reward`）

抽中后写入 `LotteryClientState.pendingEffects`，**下次** `draw` 时消费；无机会时保留（R-05、R-06）。

单条 Buff 结构：

```typescript
interface PendingEffect {
  id: string
  target: 'next_draw_reward'
  op: '+' | '*'
  value: number
  sourcePrizeId: string
  createdAt: string
}
```

**多条 Buff 合并公式**（消费时一次性算 `rollCount`）：

```
addSum = Σ (op === '+' 的 value)
mulProduct = Π (op === '×' 的 value)，无 × 项时为 1

rollCount = (1 + addSum) × mulProduct
```

| 队列示例 | rollCount |
|----------|-----------|
| `[×2]` | (1+0)×2 = **2** |
| `[×2, ×2]` | (1+0)×2×2 = **4** |
| `[+1, ×2]` | (1+1)×2 = **4** |
| `[+2, +1, ×2]` | (1+2+1)×2 = **8** |

消费后**移除**队列中全部 `next_draw_reward` 条目；`rollCount` 建议上限 8。

### 3.3 展示文案

```
none             → —
draw_chance      → 抽奖次数 {op}{value}
next_draw_reward → 下次奖励 {op}{value}
distance_km      → 运动里程 {op}{value}km
```

`status` 可返回合并预览 `nextRollCount`（按 §3.2 预算），供 Buff 条展示「下次转出 N 个奖品」。

---

## 4. 数据模型

### 4.1 LotteryPrize（扩展）

```prisma
model LotteryPrize {
  id           String   @id @default(cuid())
  label        String
  color        String
  sortOrder    Int      @default(0)
  effectTarget String   @default("none")
  effectOp     String   @default("")
  effectValue  Int      @default(0)
  effectTiming String   @default("immediate")
  createdAt    DateTime @default(now())
}
```

### 4.2 LotteryCheckIn（每日次数）

`drawUsed: Boolean` 迁移为计数：

```prisma
model LotteryCheckIn {
  id              String   @id @default(cuid())
  clientKey       String
  date            String   // YYYY-MM-DD
  imageUrl        String
  distanceKm      Float
  bonusDistanceKm Float    @default(0)  // 奖品赠送的虚拟里程
  drawsGranted    Int      @default(1)
  drawsUsed       Int      @default(0)
  bonusDetail     String?  // JSON：打卡加成明细（P2）
  createdAt       DateTime @default(now())

  @@unique([clientKey, date])
  @@index([date])
}
```

### 4.3 LotteryClientState（跨日 Buff）

```prisma
model LotteryClientState {
  clientKey       String   @id
  pendingEffects  String?  // JSON: PendingEffect[]
  updatedAt       DateTime @updatedAt
}
```

```typescript
interface PendingEffect {
  id: string
  target: 'next_draw_reward'
  op: '+' | '*'
  value: number
  sourcePrizeId: string
  createdAt: string
}
```

（字段语义与合并公式见 §3.2。）

### 4.4 身份键 clientKey

与现网一致：登录用户 `user:{userId}`，访客 `cid:{cookie}`。

---

## 5. API 契约

### 5.1 GET `/api/lottery/status`

```typescript
interface LotteryStatus {
  checkedInToday: boolean
  drawsGranted: number
  drawsUsed: number
  chancesRemaining: number        // max(0, drawsGranted - drawsUsed)
  canCheckIn: boolean
  canDraw: boolean                // chancesRemaining > 0
  weekDistanceKm: number          // 含 bonusDistanceKm
  monthDistanceKm: number
  pendingEffects: PendingEffectView[]
  nextRollCount: number           // 按 §3.2 预算，无 Buff 时为 1
}

interface PendingEffectView {
  label: string                   // 「下次奖励 +1」「下次奖励 ×2」
  op: '+' | '*'
  value: number
}
```

`nextRollCount` 由服务端对 `pendingEffects` 中全部 `next_draw_reward` 按 **加和 × 连乘** 公式计算，供 Buff 条展示「下次转出 N 个奖品」。

### 5.2 POST `/api/lottery/draw`

**请求**：无 body（身份靠 cookie / 登录态）。

**响应**：

```typescript
interface LotteryDrawResult {
  prizes: LotteryPrize[]          // 长度 = rollCount
  appliedEffects: AppliedEffect[]
  status: LotteryStatus
}

interface AppliedEffect {
  action: 'immediate' | 'queued' | 'consumed'
  target: string
  op: string
  value: number
  label: string
}
```

**draw 内部顺序**（固定）：

1. 校验 `chancesRemaining > 0`，否则 403（**Buff 不动**）
2. 读 `LotteryClientState.pendingEffects`
3. `rollCount = calcNextRollCount(pending)`，默认 1（公式见 §3.2）
4. 移除所有 `next_draw_reward` 条目（消费 Buff）
5. 循环 `rollCount` 次 `pickRandomPrize()` → `prizes[]`
6. `drawsUsed += 1`，写 `rollCount` 条 `LotteryWinRecord`
7. 对 `prizes` 中每个奖品执行 `applyPrizeEffect`（即时 ± / 新挂 Buff）
8. 返回结果

```typescript
function calcNextRollCount(pending: PendingEffect[]): number {
  const list = pending.filter((e) => e.target === 'next_draw_reward')
  if (list.length === 0) return 1
  const addSum = list.filter((e) => e.op === '+').reduce((s, e) => s + e.value, 0)
  const mul = list.filter((e) => e.op === '*').reduce((p, e) => p * e.value, 1)
  return (1 + addSum) * mul
}
```

**软上限（建议）**：`rollCount = Math.min(calcNextRollCount(pending), 8)`。

### 5.3 POST `/api/lottery/prizes`（管理员）

```typescript
// Request
{
  label: string
  effectTarget: 'none' | 'draw_chance' | 'next_draw_reward' | 'distance_km'
  effectOp?: '+' | '*'
  effectValue?: number
}

// Response: { prize: LotteryPrize }
```

`effectTiming` 由服务端按 target 推导，不由管理员填写。

### 5.4 POST `/api/lottery/check-in`

打卡响应 `status` 结构与 §5.1 一致；`bonusDetail` 可选返回打卡加成明细（P2）。

---

## 6. 核心场景时序

### 6.1 抽中「下次奖励 ×2」，今日次数用完

```
T1  POST /draw
    → prizes: [幸运加倍]
    → appliedEffects: [{ action: 'queued', ... }]
    → chancesRemaining: 0
    → pendingEffects: [×2], nextRollCount: 2

T2  GET /status（刷新页面）
    → canDraw: false
    → pendingEffects 仍在，nextRollMultiplier: 2

T3  次日 POST /check-in
    → drawsGranted: 1, drawsUsed: 0
    → pendingEffects 不变

T4  POST /draw
    → rollCount = 2
    → prizes: [一等奖, 谢谢参与]
    → pendingEffects: []
    → appliedEffects: [{ action: 'consumed', value: 2 }]
```

### 6.2 混合叠加：+1 与 ×2

```
队列 pending = [{op:'+', value:1}, {op:'*', value:2}]
nextRollCount = (1+1)×2 = 4

POST /draw → 随机 4 个奖品，清空全部 next_draw_reward Buff
```

### 6.3 纯乘法 ×2 再 ×2

```
队列 pending = [{×2}, {×2}]
nextRollCount = 4
```

### 6.4 即时 ×2 与 Buff 并存

```
drawsGranted: 2 → 抽中「抽奖次数 ×2」→ drawsGranted: 4
同时 pending [下次奖励 ×2]

下一次 draw：rollCount=2，drawsUsed 仅 +1
```

---

## 7. UI 设计要点

详见 mockup：

| 页面 | 文件 | 说明 |
|------|------|------|
| 用户抽奖 | [mockups/lottery.html](./mockups/lottery.html) | 三栏布局、机会徽章、Buff 条、多奖品结果 |
| 奖池管理 | [mockups/lottery-admin.html](./mockups/lottery-admin.html) | 效果列、添加奖品表单（类型+符号+数量） |

### 7.1 用户端组件

| 组件 | 职责 |
|------|------|
| `LotteryChancesBadge` | `剩余 {remaining} / 共 {granted} 次` |
| `LotteryPendingBuffBar` | `nextRollCount > 1` 时显示，文案含「下次转出 N 个奖品」 |
| `LotteryResultBanner` | 支持 1～N 个奖品横向/纵向排列 |
| `LotteryCheckInForm` | 打卡成功展示 `bonusDetail`（P2） |

### 7.2 管理端组件

| 组件 | 职责 |
|------|------|
| 奖池表格 | 列：颜色、名称、**效果**、排序、时间、操作 |
| `PrizeEffectForm` | 类型 Select → 符号 Select（`+` / `×` 均可选）→ 数量 InputNumber |
| 效果预览 | 表单下方实时显示 `抽奖次数 +1` 等 |

### 7.3 UI 状态矩阵

| drawsRemaining | nextRollCount | 抽奖按钮 | Buff 条 |
|----------------|---------------|----------|---------|
| >0 | 1 | 可点「开始抽奖」 | 隐藏 |
| >0 | 4 | 可点 | `待生效：下次转出 4 个奖品（+1 ×2）` |
| 0 | 4 | 禁用 | `待生效：下次转出 4 个奖品（获得机会后自动生效）` |
| 0 | 1 | 禁用「请先打卡」 | 隐藏 |

---

## 8. 运动里程加成（P2 预留）

打卡时根据 `LotteryBonusRule` 增加 `drawsGranted`，与奖品效果独立。

```prisma
model LotteryBonusRule {
  id          String  @id @default(cuid())
  name        String
  scope       String  // daily | weekly | monthly
  thresholdKm Float
  bonusDraws  Int
  enabled     Boolean @default(true)
  sortOrder   Int     @default(0)
}
```

周/月规则需 `LotteryBonusClaim` 防重复领取。本期设计文档仅预留，实现排在 P2。

---

## 9. 研发分期

| 阶段 | 范围 | 仓库 |
|------|------|------|
| **P0** | Schema 迁移、`drawsGranted/drawsUsed`、`draw`/`status` 改造 | `node/` |
| **P1** | `LotteryClientState`、`pendingEffects`、×N 连乘、`LotteryPrize` 效果字段 | `node/` + `chat/` |
| **P1-UI** | 按 mockup 改 `LotteryPage`、`AdminLotteryPage` | `chat/` |
| **P2** | `LotteryBonusRule` 运动加成 + 管理页 | `node/` + `chat/` |

**迁移**：`drawUsed=true` → `drawsGranted=1, drawsUsed=1`；`drawUsed=false` → `drawsGranted=1, drawsUsed=0`。

---

## 10. 验收清单

- [ ] 三种效果类型均可配置 `+` 与 `×`；`×` 的 value 建议 ≥2
- [ ] 抽奖次数：`+` 增加、`×` 倍增，当场生效
- [ ] 运动里程：`+` 加公里、`×` 倍增总里程，当场生效
- [ ] 下次奖励：`+` / `×` 均入队，合并公式 `(1+Σ+)×Π×` 正确
- [ ] 抽中下次奖励后 `canDraw=false` 时 Buff 不丢；跨日仍有效
- [ ] 两个 ×2 Buff → nextRollCount=4；+1 与 ×2 → nextRollCount=4
- [ ] 单次 draw 只扣 1 次机会
- [ ] 前端不传 effect key；所有副作用仅来自服务端

---

## 11. 设计变更记录

| 日期 | 版本 | 摘要 |
|------|------|------|
| 2026-07-06 | v1.1 | 三种类型均支持 `+`/`×`；下次奖励合并公式 `(1+Σ+)×Π×` |
| 2026-07-06 | v1.0 | 初稿：奖品效果三件套、ClientState Buff、UI mockup |
