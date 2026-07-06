import type { LotteryEffectOp, LotteryEffectTarget, LotteryPrize } from '../api/types'

const TARGET_LABELS: Record<LotteryEffectTarget, string> = {
  none: '普通奖励',
  draw_chance: '抽奖次数',
  next_draw_reward: '下次奖励',
  distance_km: '运动里程',
}

export function formatPrizeEffectLabel(prize: Pick<LotteryPrize, 'effectTarget' | 'effectOp' | 'effectValue'>): string {
  if (prize.effectTarget === 'none' || prize.effectValue <= 0) return '—'
  const op = prize.effectOp === '*' ? '×' : '+'
  const unit = prize.effectTarget === 'distance_km' ? 'km' : ''
  return `${TARGET_LABELS[prize.effectTarget]} ${op}${prize.effectValue}${unit}`
}

export function formatPendingBuffSummary(nextRollCount: number, canDraw: boolean): string {
  if (nextRollCount <= 1) return ''
  const base = `待生效：下次转出 ${nextRollCount} 个奖品`
  return canDraw ? base : `${base}（获得机会后自动生效）`
}

export const EFFECT_TARGET_OPTIONS: { value: LotteryEffectTarget; label: string }[] = [
  { value: 'none', label: '普通奖励（无效果）' },
  { value: 'draw_chance', label: '抽奖次数' },
  { value: 'next_draw_reward', label: '下次抽奖奖励' },
  { value: 'distance_km', label: '运动里程' },
]

export const EFFECT_OP_OPTIONS: { value: LotteryEffectOp; label: string }[] = [
  { value: '+', label: '+ 加' },
  { value: '*', label: '× 乘' },
]
