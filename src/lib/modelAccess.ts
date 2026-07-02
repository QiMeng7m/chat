import type { ModelPublic, UserPublic } from '../api/types'
import { MOCK_MODELS } from '../data/mockCatalog'

export const PRO_MODEL_ID = 'deepseek/deepseek-v4-pro'

export const PRO_MODEL_NO_ACCESS_HINT = '无权限使用，请联系管理员进行开通'

const PRO_MODEL_FALLBACK =
  MOCK_MODELS.find((m) => m.id === PRO_MODEL_ID) ??
  ({
    id: PRO_MODEL_ID,
    label: 'DeepSeek V4 Pro',
    description: '旗舰推理，需管理员授权',
    tags: ['strong'],
    supportsVision: false,
    supportsStream: true,
    costTier: 'high',
    requiresPermission: true,
  } satisfies ModelPublic)

export function hasProAccess(user: UserPublic | null | undefined): boolean {
  if (!user) return false
  return user.role === 'admin' || user.proAccess
}

export function modelRequiresPermission(model: ModelPublic): boolean {
  return model.requiresPermission === true || model.id === PRO_MODEL_ID
}

export function isModelAccessible(model: ModelPublic, user: UserPublic | null | undefined): boolean {
  if (!modelRequiresPermission(model)) return true
  return hasProAccess(user)
}

/** 补全需权限模型（后端可能对无权限用户过滤掉 Pro），并标记 requiresPermission */
export function enrichModelsForDisplay(models: ModelPublic[]): ModelPublic[] {
  const normalized = models.map((m) =>
    modelRequiresPermission(m) ? { ...m, requiresPermission: true } : m,
  )

  if (normalized.some((m) => m.id === PRO_MODEL_ID)) {
    return normalized
  }

  return [...normalized, { ...PRO_MODEL_FALLBACK, requiresPermission: true }]
}

export function pickAccessibleDefaultModel(
  models: ModelPublic[],
  user: UserPublic | null | undefined,
): string | null {
  const accessible = models.filter((m) => isModelAccessible(m, user))
  if (!accessible.length) return null
  return accessible.find((m) => m.recommended)?.id ?? accessible[0]!.id
}
