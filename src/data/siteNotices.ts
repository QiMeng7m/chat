import type { ThemeMeta } from '../theme/meta'

export type NoticeAudience = 'public' | 'user' | 'admin'

export type SiteNoticeItem = {
  id: string
  text: string
  audiences: NoticeAudience[]
}

export type SiteNoticeSection = {
  id: string
  icon: string
  title: string
  items: SiteNoticeItem[]
}

export type SiteNoticesContext = {
  quotaLabel: string
  adminRole: string
  brand: string
  audiences: NoticeAudience[]
}

function item(
  id: string,
  text: string,
  audiences: NoticeAudience[] = ['public', 'user', 'admin'],
): SiteNoticeItem {
  return { id, text, audiences }
}

/** 站点使用须知 — 单一真相源，供顶栏 icon、设置页、登录页复用 */
export function buildSiteNoticeSections(ctx: SiteNoticesContext): SiteNoticeSection[] {
  const { quotaLabel, adminRole, brand, audiences } = ctx
  const visible = (entry: SiteNoticeItem) =>
    entry.audiences.some((a) => audiences.includes(a))

  const sections: SiteNoticeSection[] = [
    {
      id: 'quota',
      icon: '🐟',
      title: `${quotaLabel}与额度`,
      items: [
        item(
          'quota-lifetime',
          '对话额度为终身累计总量，不会每天零点自动刷新；用完后需联系管理员开通更多次数。',
          ['user', 'admin'],
        ),
        item(
          'quota-cost',
          '每次 AI 对话在模型成功回复后消耗 1 次；顶栏与输入框会显示「剩余 / 总配额」。',
          ['user', 'admin'],
        ),
        item(
          'quota-exhausted',
          '配额用尽时将无法继续对话，请联系管理员在「用户管理」中提高该账号的总配额。',
          ['user', 'admin'],
        ),
        item(
          'quota-owner-free',
          '询问主人、柒梦、王鸿博等站主相关问题由小柒本地回答，不消耗 AI 对话额度。',
          ['user', 'admin'],
        ),
        item(
          'quota-ip',
          '同一网络 IP 设有累计对话次数上限，请勿通过反复注册小号等方式刷额度。',
          ['public', 'user', 'admin'],
        ),
      ],
    },
    {
      id: 'models',
      icon: '🤖',
      title: '模型与权限',
      items: [
        item(
          'model-flash',
          'DeepSeek V4 Flash：所有登录用户默认可用，适合日常快速问答。',
          ['user', 'admin'],
        ),
        item(
          'model-pro',
          'DeepSeek V4 Pro：旗舰模型，需管理员开通 Pro 权限后才可选用；无权限时在模型列表中呈灰色并不可选。',
          ['user', 'admin'],
        ),
        item(
          'model-vision',
          '仅带 vision 能力的模型支持图片分析；当前模型不支持图片时，请勿上传附件或先切换模型。',
          ['user', 'admin'],
        ),
        item(
          'model-locked',
          '部分场景会锁定或推荐特定模型；切换侧栏场景后，请关注顶部模型选择是否仍可更改。',
          ['user', 'admin'],
        ),
        item(
          'model-empty',
          '若提示「暂无可用模型」，说明管理员尚未配置 Provider 与模型，请联系站点管理员处理。',
          ['user', 'admin'],
        ),
      ],
    },
    {
      id: 'account',
      icon: '🔐',
      title: '账号与安全',
      items: [
        item(
          'captcha',
          '登录与注册可能需要完成 Cloudflare Turnstile 人机验证，请按页面提示操作。',
          ['public', 'user', 'admin'],
        ),
        item(
          'register-ip',
          '同一 IP 的注册次数有限制；若提示已达上限，请联系管理员手动创建账号。',
          ['public', 'user', 'admin'],
        ),
        item(
          'register-closed',
          '站点可能关闭公开注册（ALLOW_REGISTRATION=false），此时仅管理员可在后台创建账号。',
          ['public', 'user', 'admin'],
        ),
        item(
          'account-disabled',
          '账号被禁用或登录失效时，请重新登录或联系管理员恢复。',
          ['user', 'admin'],
        ),
      ],
    },
    {
      id: 'assistant',
      icon: '✨',
      title: '小柒与站主',
      items: [
        item(
          'greeting',
          '每次开启新对话，AI 助手小柒会自动发送问候；可直接在下方输入框开始聊天。',
          ['user', 'admin'],
        ),
        item(
          'owner-query',
          '在对话中询问主人、柒梦、王鸿博等信息，小柒会从站主资料库查找并回答；找不到时会说明「暂无」。',
          ['user', 'admin'],
        ),
        item(
          'owner-profile',
          `管理员可在「个人设置 → 主人资料」维护${brand}站主信息，保存后立即影响小柒的回答内容。`,
          ['admin'],
        ),
      ],
    },
    {
      id: 'admin',
      icon: '⚙️',
      title: `${adminRole}操作提示`,
      items: [
        item(
          'admin-quota',
          '「用户管理」可调整用户的总配额、已用次数、Pro 权限、启用状态；为用户加额度请提高「总配额」。',
          ['admin'],
        ),
        item(
          'admin-pro',
          '为普通用户开通 DeepSeek V4 Pro：编辑用户并开启「DeepSeek Pro 权限」。',
          ['admin'],
        ),
        item(
          'admin-provider',
          '模型不可用时可检查 Provider 管理、模型启用状态及 API Key 是否有效。',
          ['admin'],
        ),
      ],
    },
  ]

  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter(visible),
    }))
    .filter((section) => section.items.length > 0)
}

export function audiencesForUser(role?: 'admin' | 'user' | 'runner' | null): NoticeAudience[] {
  if (role === 'admin') return ['public', 'user', 'admin']
  if (role === 'user' || role === 'runner') return ['public', 'user']
  return ['public']
}

export function noticesContextFromMeta(
  meta: ThemeMeta,
  role?: 'admin' | 'user' | 'runner' | null,
): SiteNoticesContext {
  return {
    quotaLabel: meta.quotaLabel,
    adminRole: meta.adminRole,
    brand: meta.brand,
    audiences: audiencesForUser(role),
  }
}
