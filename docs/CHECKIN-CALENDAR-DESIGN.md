# 打卡日历与补卡 — 设计说明

> 状态：**UI 原型 + 前端 mock**（后端 API 待 M2）  
> 关联页面：`/lottery` 左侧「运动打卡」面板  
> 视觉基准：`docs/mockups/lottery.html` § 打卡日历

---

## 1. 目标

在抽奖页左侧打卡区增加**月历视图**，让用户：

1. 一眼看到本月哪些天已打卡、哪些是补卡
2. 对**过去未打卡的日期**发起补卡（需消耗补卡机会）
3. 理解补卡机会如何获得与剩余数量

---

## 2. 业务规则

| ID | 规则 |
|----|------|
| R-01 | 每人每天最多 **1 次**有效打卡（正常打卡或补卡二选一，不可重复） |
| R-02 | **正常打卡**：当天上传图片 + 填写里程，与现有 `/api/lottery/check-in` 一致 |
| R-03 | **补卡**：针对**今天之前**且**未打卡**的日期；同样需图片 + 里程 |
| R-04 | 补卡机会：**每累计 2 次正常打卡，获得 1 次补卡机会** |
| R-05 | 仅统计 **正常打卡** 计入「2 天 1 次」；补卡本身不再产生新的补卡机会 |
| R-06 | 补卡消耗 1 次机会；机会不足时，日历上不可补卡的日期仅展示为「缺卡」，不可点击 |
| R-07 | 补卡成功后发放 **1 次抽奖机会**（与正常打卡相同，可立即抽奖） |
| R-08 | 补卡机会按 **累计** 正常打卡计算：每 2 次正常打卡 → 1 次补卡机会 |

### 2.1 补卡机会公式

```
makeupEarned  = floor(normalCheckInCount / 2)
makeupUsed    = makeupCheckInCount
makeupAvailable = max(0, makeupEarned - makeupUsed)
```

示例：正常打卡 5 天 → 获得 2 次补卡机会；已补卡 1 天 → 剩余 1 次。

---

## 3. 日历 UI

### 3.1 布局（嵌入左侧面板，位于标题与运动统计之间）

```
┌─────────────────────────────┐
│ 运动打卡          [今日已打卡] │
│ 每日打卡一次…                  │
├─────────────────────────────┤
│  ‹   2026 年 7 月   ›         │
│  日 一 二 三 四 五 六          │
│  ·  ·  1  2  3  4  5          │
│  6  7  8  9 10 11 12          │
│ ...                           │
│ 本月打卡 12 天 · 补卡机会 1/2  │
│ ● 已打卡  ◐ 补卡  ○ 可补卡    │
├─────────────────────────────┤
│ 本周/本月运动统计…             │
│ 打卡表单…                     │
└─────────────────────────────┘
```

### 3.2 日期格状态

| 状态 | 视觉 | 交互 |
|------|------|------|
| `checked` | 实心圆点 + 主题色底 | 悬停 tooltip：「7月3日 · 已打卡 · 5.2 km」 |
| `makeup` | 虚线圆 + 琥珀色 | tooltip 含「补卡」 |
| `missed` | 浅灰字 | 有机会 → 可点击，打开补卡弹窗；无机会 → 禁用 |
| `today` | 外圈高亮 | 未打卡且可走主表单；已打卡仅展示 |
| `future` | 更浅灰 | 不可点 |
| `empty` | 占位（月初前） | — |

### 3.3 补卡弹窗

- 标题：`补卡 · YYYY-MM-DD`
- 字段：打卡图片（必填）、运动公里数（必填）
- 副文案：`将消耗 1 次补卡机会（剩余 N 次）`
- 确认：`提交补卡`；取消关闭

---

## 4. 数据模型（后端草案）

### 4.1 CheckInRecord

```ts
type CheckInKind = 'normal' | 'makeup'

interface CheckInDayRecord {
  date: string        // YYYY-MM-DD，业务日（按服务器时区）
  kind: CheckInKind
  distanceKm: number
  imageUrl: string
  createdAt: string   // ISO
}
```

### 4.2 LotteryStatus 扩展（计划）

```ts
interface LotteryStatus {
  // ...existing
  checkInCalendar?: {
    month: string              // YYYY-MM
    days: CheckInDayRecord[]
    monthCheckInCount: number
    normalCheckInTotal: number
    makeupEarned: number
    makeupUsed: number
    makeupAvailable: number
  }
}
```

---

## 5. API 草案

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/lottery/check-ins?month=YYYY-MM` | 返回该月打卡记录 + 补卡机会汇总 |
| POST | `/api/lottery/check-in` | 现有：当日正常打卡 |
| POST | `/api/lottery/check-in/makeup` | body: `{ date, imageUrl, distanceKm }` |

错误码建议：

- `409` 该日已有打卡
- `403` 补卡机会不足
- `400` 不能补未来日期 / 不能补今天（今天走正常打卡）

---

## 6. 前端实现（当前阶段）

| 文件 | 职责 |
|------|------|
| `src/lib/checkInCalendar.ts` | 日期工具、补卡机会计算 |
| `src/data/mockCheckInCalendar.ts` | ~~mock~~ 已移除，改接 `/api/lottery/check-ins` |
| `src/components/lottery/CheckInCalendar.tsx` | 月历网格 |
| `src/components/lottery/MakeupCheckInModal.tsx` | 补卡弹窗 |
| `src/styles/lottery.css` | 日历样式 |
| `docs/mockups/lottery.html` | 静态原型 |

后端就绪后：替换 mock 为 `getCheckInCalendar` / `submitMakeupCheckIn`，`LotteryCheckInForm` 打卡成功时刷新日历。

---

## 7. 验收清单

- [ ] 月历正确渲染当月天数与周起始（周日）
- [ ] 已打卡 / 补卡 / 缺卡 / 今日 / 未来 五种状态可区分
- [ ] 展示「本月打卡 X 天 · 补卡机会 剩余/累计」
- [ ] 有机会时可点击缺卡日打开补卡弹窗；成功后该日变为补卡态
- [ ] 机会为 0 时缺卡日不可点
- [ ] 移动端左侧面板日历不溢出、可换月
- [ ] `npm run build` 通过
