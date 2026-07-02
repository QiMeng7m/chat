export type ThemeId = 'catdog' | 'anime' | 'shuimo'

export const THEME_IDS: ThemeId[] = ['catdog', 'anime', 'shuimo']
export const DEFAULT_THEME: ThemeId = 'catdog'
export const THEME_STORAGE_KEY = 'mascot-theme'

/** 旧主题 ID 迁移映射（localStorage 兼容） */
export const LEGACY_THEME_MAP: Record<string, ThemeId> = {
  guofeng: 'shuimo',
  neon: DEFAULT_THEME,
  conan: DEFAULT_THEME,
}

export type ThemeMeta = {
  themeColor: string
  brand: string
  brandShort: string
  subtitle: string
  tagline: string
  assistantEmoji: string
  assistantLabel: string
  userEmoji: string
  logoEmoji: string
  logoEmojiAlt: string
  loginTitle: string
  loginSubtitle: string
  loginHero: string
  loginHeroDesc: string
  loginFooterPrompt: string
  registerTitle: string
  registerSubtitle: string
  registerSubmit: string
  registerFooterPrompt: string
  adminRole: string
  quotaLabel: string
  composerPlaceholder: string
  remember: string
  loginSubmit: string
  adminLink: string
  formHelperDesc: string
  adminConsole: string
  usersLabel: string
  sidebarAdminShort: string
}

export const THEME_CATALOG: { id: ThemeId; name: string; emoji: string; desc: string }[] = [
  { id: 'catdog', name: '喵汪工坊', emoji: '🐱', desc: '萌宠可爱风，粉紫 pastel，日常闲聊首选。' },
  { id: 'anime', name: '星语二次元', emoji: '🌸', desc: '番剧感 UI，樱花紫蓝，气泡与星芒动态背景。' },
  { id: 'shuimo', name: '水墨', emoji: '🖌', desc: '宣纸墨色，水墨晕染，适合文档与正式文稿。' },
]

export const THEME_META: Record<ThemeId, ThemeMeta> = {
  catdog: {
    themeColor: '#ff7eb3',
    brand: '柒梦的小破站',
    brandShort: '柒梦',
    subtitle: '喵汪工坊',
    tagline: '毛茸茸的智能小助手',
    assistantEmoji: '🐱',
    assistantLabel: '猫猫助手',
    userEmoji: '🧑',
    logoEmoji: '🐱',
    logoEmojiAlt: '🐶',
    loginTitle: '欢迎回来喵～',
    loginSubtitle: '登录后开始和 AI 玩耍吧',
    loginHero: '和小伙伴一起\n愉快地使用 AI 喵～',
    loginHeroDesc: '聊天、写文档、问技术、看图片——注册登录就能用。',
    loginFooterPrompt: '还没有账号？',
    registerTitle: '加入喵汪大家庭～',
    registerSubtitle: '注册后默认普通用户，开箱即用',
    registerSubmit: '🐾 注册',
    registerFooterPrompt: '已有账号？',
    adminRole: '铲屎官',
    quotaLabel: '小鱼干',
    composerPlaceholder: '输入问题喵～ 可以粘贴代码或报错信息 🐾',
    remember: '记住我 🐾',
    loginSubmit: '🐾 登录',
    adminLink: '铲屎官管理后台',
    formHelperDesc: '狗狗助手帮你生成美美的 Markdown～',
    adminConsole: '铲屎官控制台',
    usersLabel: '小伙伴',
    sidebarAdminShort: '铲屎官',
  },
  anime: {
    themeColor: '#a78bfa',
    brand: '柒梦的小破站',
    brandShort: '柒梦',
    subtitle: '星语二次元',
    tagline: '今日もよろしく～',
    assistantEmoji: '✨',
    assistantLabel: '星语助手',
    userEmoji: '🎀',
    logoEmoji: '🌸',
    logoEmojiAlt: '⭐',
    loginTitle: '欢迎回来～',
    loginSubtitle: '登录后开始和 AI 的每日对话',
    loginHero: '像番剧一样\n开启 AI 日常',
    loginHeroDesc: '聊天、创作、问答——在星芒闪闪的界面里慢慢聊。',
    loginFooterPrompt: '还没有账号？',
    registerTitle: '加入星语工房～',
    registerSubtitle: '注册后默认普通用户，立即开始对话',
    registerSubmit: '✨ 注册',
    registerFooterPrompt: '已有账号？',
    adminRole: '管理员',
    quotaLabel: '星尘额度',
    composerPlaceholder: '输入想说的话～ 代码和问题都可以哦 ✨',
    remember: '保持登录 ✨',
    loginSubmit: '✨ 进入工房',
    adminLink: '管理后台',
    formHelperDesc: '星语助手帮你整理成好看的 Markdown～',
    adminConsole: '工房控制台',
    usersLabel: '成员',
    sidebarAdminShort: '管理',
  },
  shuimo: {
    themeColor: '#4a5568',
    brand: '柒梦的小破站',
    brandShort: '柒梦',
    subtitle: '水墨',
    tagline: '研墨以待，落笔成章',
    assistantEmoji: '🖌',
    assistantLabel: '水墨助手',
    userEmoji: '🖋',
    logoEmoji: '🖌',
    logoEmojiAlt: '📜',
    loginTitle: '久违了',
    loginSubtitle: '登录后入席书斋',
    loginHero: '研墨铺纸\n静候佳章',
    loginHeroDesc: '问学、起草、润色——于素笺之上，借 AI 之力成文。',
    loginFooterPrompt: '还没有账号？',
    registerTitle: '入席书斋',
    registerSubtitle: '注册后默认普通用户，即可落笔成文',
    registerSubmit: '🖌 注册',
    registerFooterPrompt: '已有账号？',
    adminRole: '掌事',
    quotaLabel: '用墨',
    composerPlaceholder: '在此落笔… 可陈述疑义、粘贴文稿',
    remember: '记住此身',
    loginSubmit: '🖌 登录',
    adminLink: '书斋管理',
    formHelperDesc: '水墨助手按体例生成 Markdown 文稿',
    adminConsole: '书斋掌事台',
    usersLabel: '门生',
    sidebarAdminShort: '掌事',
  },
}

export function isThemeId(value: string | null): value is ThemeId {
  return value != null && THEME_IDS.includes(value as ThemeId)
}

export function resolveThemeId(value: string | null): ThemeId {
  if (isThemeId(value)) return value
  if (value != null && value in LEGACY_THEME_MAP) return LEGACY_THEME_MAP[value]
  return DEFAULT_THEME
}
