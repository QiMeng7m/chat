/**
 * 三套 UI 主题 · 切换逻辑
 * localStorage key: mascot-theme
 * 切换入口：个人设置 settings.html（不在页面主体）
 */
(function () {
  const STORAGE_KEY = 'mascot-theme'
  const DEFAULT = 'catdog'
  const THEME_IDS = ['catdog', 'anime', 'shuimo']
  const LEGACY_MAP = { guofeng: 'shuimo', neon: DEFAULT, conan: DEFAULT }

  const CATALOG = [
    { id: 'catdog', name: '喵汪工坊', emoji: '🐱', desc: '萌宠可爱风，粉紫 pastel，日常闲聊首选。' },
    { id: 'anime', name: '星语二次元', emoji: '🌸', desc: '番剧感 UI，樱花紫蓝，气泡与星芒动态背景。' },
    { id: 'shuimo', name: '水墨', emoji: '🖌', desc: '宣纸墨色，水墨晕染，适合文档与正式文稿。' },
  ]

  const META = {
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
      loginHero: '和小伙伴一起<br />愉快地使用 AI 喵～',
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
      indexHero: '柒梦的小破站',
      indexLead: '手机、iPad、电脑都能聊～ 注册登录即可使用',
      indexHeroEmoji: '🌸',
      loginHintIcon: '🌸',
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
      loginHero: '像番剧一样<br />开启 AI 日常',
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
      indexHero: '柒梦的小破站',
      indexLead: '手机、平板、电脑都能聊～ 星芒界面里慢慢创作与问答',
      indexHeroEmoji: '⭐',
      loginHintIcon: '✨',
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
      loginHero: '研墨铺纸<br />静候佳章',
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
      indexHero: '柒梦的小破站',
      indexLead: '问学、起草、润色——于素笺之上借 AI 之力成文',
      indexHeroEmoji: '📜',
      loginHintIcon: '🖌',
      formHelperDesc: '水墨助手按体例生成 Markdown 文稿',
      adminConsole: '书斋掌事台',
      usersLabel: '门生',
      sidebarAdminShort: '掌事',
    },
  }

  function resolveTheme(saved) {
    if (THEME_IDS.includes(saved)) return saved
    if (saved && LEGACY_MAP[saved]) return LEGACY_MAP[saved]
    return DEFAULT
  }

  function getTheme() {
    const saved = localStorage.getItem(STORAGE_KEY)
    return resolveTheme(saved)
  }

  function applyTheme(name) {
    const theme = resolveTheme(name)
    const meta = META[theme]

    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem(STORAGE_KEY, theme)
    document.title = meta.brand

    const themeMeta = document.querySelector('meta[name="theme-color"]')
    if (themeMeta) themeMeta.setAttribute('content', meta.themeColor)

    document.querySelectorAll('[data-theme-set]').forEach((btn) => {
      const active = btn.getAttribute('data-theme-set') === theme
      btn.classList.toggle('active', active)
      btn.setAttribute('aria-pressed', active ? 'true' : 'false')
    })

    document.querySelectorAll('[data-theme-text]').forEach((el) => {
      const key = el.getAttribute('data-theme-text')
      if (meta[key] == null) return
      if (el.getAttribute('data-theme-html') === 'true') {
        el.innerHTML = meta[key]
      } else {
        el.textContent = meta[key]
      }
    })

    document.querySelectorAll('[data-theme-logo]').forEach((el) => {
      el.textContent = meta.logoEmoji
    })

    document.querySelectorAll('[data-theme-logo-alt]').forEach((el) => {
      el.textContent = meta.logoEmojiAlt
    })

    document.querySelectorAll('[data-theme-assistant]').forEach((el) => {
      el.textContent = meta.assistantEmoji
    })

    document.querySelectorAll('[data-theme-user]').forEach((el) => {
      el.textContent = meta.userEmoji
    })

    document.querySelectorAll('[data-theme-placeholder]').forEach((el) => {
      const key = el.getAttribute('data-theme-placeholder')
      if (meta[key] != null && 'placeholder' in el) {
        el.placeholder = meta[key]
      }
    })

    THEME_IDS.forEach((id) => {
      document.querySelectorAll(`.theme-only-${id}`).forEach((el) => {
        el.hidden = theme !== id
      })
    })

    document.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }))
  }

  function renderThemePicker(container) {
    if (!container) return
    const current = getTheme()
    container.innerHTML = CATALOG.map(
      (t) => `
      <button type="button" class="theme-card ${current === t.id ? 'active' : ''}" data-theme-set="${t.id}" aria-pressed="${current === t.id}">
        <div class="theme-card-preview theme-card-preview--${t.id}" aria-hidden="true"></div>
        <div class="theme-card-body">
          <strong>${t.emoji} ${t.name}</strong>
          <span>${t.desc}</span>
        </div>
      </button>`,
    ).join('')

    container.querySelectorAll('[data-theme-set]').forEach((btn) => {
      btn.addEventListener('click', () => applyTheme(btn.getAttribute('data-theme-set')))
    })
  }

  function init() {
    applyTheme(getTheme())

    document.querySelectorAll('[data-theme-set]').forEach((btn) => {
      if (btn.closest('#theme-picker')) return
      btn.addEventListener('click', () => applyTheme(btn.getAttribute('data-theme-set')))
    })

    renderThemePicker(document.getElementById('theme-picker'))
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }

  window.MascotTheme = { applyTheme, getTheme, META, CATALOG, renderThemePicker }
})()
