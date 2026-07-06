import type { UserRole } from '../api/types'

export const USER_ROLE_LABEL = '普通用户'
export const RUNNER_ROLE_LABEL = '打卡运动'

export function userRoleLabel(role: UserRole, adminLabel: string): string {
  if (role === 'admin') return adminLabel
  if (role === 'runner') return RUNNER_ROLE_LABEL
  return USER_ROLE_LABEL
}

export function userRoleSelectOptions(adminLabel: string) {
  return [
    { label: USER_ROLE_LABEL, value: 'user' as const },
    { label: adminLabel, value: 'admin' as const },
    { label: RUNNER_ROLE_LABEL, value: 'runner' as const },
  ]
}

export function postLoginPath(role: UserRole, from?: string): string {
  if (role === 'runner') return '/lottery'
  if (from && from !== '/login') return from
  return '/chat'
}
