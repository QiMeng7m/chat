import type { FeaturePublic } from '../api/types'

/** 主界面优先展示的场景（Phase 4a：了解主人 + 自由对话） */
const PRIMARY_FEATURE_ORDER = ['ask-owner', 'free-chat'] as const

export function sortFeaturesForDisplay(features: FeaturePublic[]): FeaturePublic[] {
  return [...features].sort((a, b) => {
    const ai = PRIMARY_FEATURE_ORDER.indexOf(a.id as (typeof PRIMARY_FEATURE_ORDER)[number])
    const bi = PRIMARY_FEATURE_ORDER.indexOf(b.id as (typeof PRIMARY_FEATURE_ORDER)[number])
    const ap = ai === -1 ? 999 : ai
    const bp = bi === -1 ? 999 : bi
    if (ap !== bp) return ap - bp
    return a.name.localeCompare(b.name, 'zh-CN')
  })
}

export function pickDefaultFeatureId(features: FeaturePublic[]): string | null {
  if (!features.length) return null
  return (
    features.find((f) => f.id === 'free-chat')?.id ??
    features.find((f) => f.id === 'tech-qa')?.id ??
    features[0]!.id
  )
}

export function isPrimaryFeature(id: string): boolean {
  return (PRIMARY_FEATURE_ORDER as readonly string[]).includes(id)
}
