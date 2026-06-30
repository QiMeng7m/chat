/**
 * 五套 UI 主题 · 切换逻辑
 * localStorage key: mascot-theme
 * 切换入口：个人设置 settings.html（不在页面主体）
 */
(function () {
  const STORAGE_KEY = 'mascot-theme'
  const DEFAULT = 'catdog'
  const THEME_IDS = ['catdog', 'anime', 'guofeng', 'neon', 'conan']

  const CATALOG = [
    { id: 'catdog', name: '喵汪工坊', emoji: '🐱', desc: '萌宠可爱风，粉紫 pastel，日常闲聊首选。' },
    { id: 'anime', name: '星语二次元', emoji: '🌸', desc: '番剧感 UI，樱花紫蓝，气泡与星芒动态背景。' },
    { id: 'guofeng', name: '墨韵国风', emoji: '🏮', desc: '宣纸墨色，朱砂点缀，适合文档与正式文稿。' },
    { id: 'neon', name: '轻霓虹', emoji: '💠', desc: '深蓝灰底，低饱和光边，克制不刺眼。' },
    { id: 'conan', name: '米花町', emoji: '🔍', desc: '推理悬疑气质，蓝红配色，侦探工房。' },
  ]

  const META = {
    catdog: {
      themeColor: '#ff7eb3',
      brand: '喵汪 AI 工坊',
      brandShort: '喵汪 AI',
      subtitle: 'AI 工坊',
      tagline: '毛茸茸的智能小助手',
      assistantEmoji: '🐱',
      assistantLabel: '猫猫助手',
      userEmoji: '🧑',
      logoEmoji: '🐱',
      logoEmojiAlt: '🐶',
      loginTitle: '欢迎回来喵～',
      loginSubtitle: '用管理员分配的账号登录，开始和 AI 玩耍吧',
      loginHero: '和小伙伴一起<br />愉快地使用 AI 喵～',
      loginHeroDesc: '聊天、写文档、问技术、看图片——管理员配置好模型，你登录就能用。',
      footerHint: '注册已关闭，请联系铲屎官管理员开通账号',
      adminRole: '铲屎官',
      quotaLabel: '小鱼干',
      composerPlaceholder: '输入问题喵～ 可以粘贴代码或报错信息 🐾',
      remember: '记住我 🐾',
      loginSubmit: '🐾 登录',
      adminLink: '铲屎官管理后台',
      indexHero: '和猫猫狗狗一起用 AI',
      indexLead: '手机、iPad、电脑都能聊～ 模型由铲屎官配置，小伙伴开箱即用喵',
      indexHeroEmoji: '🌸',
      loginHintIcon: '🌸',
      formHelperDesc: '狗狗助手帮你生成美美的 Markdown～',
      adminConsole: '铲屎官控制台',
      usersLabel: '小伙伴',
      sidebarAdminShort: '铲屎官',
    },
    anime: {
      themeColor: '#a78bfa',
      brand: '星语 AI 工房',
      brandShort: '星语 AI',
      subtitle: '二次元工房',
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
      footerHint: '注册已关闭，请联系管理员开通账号',
      adminRole: '管理员',
      quotaLabel: '星尘额度',
      composerPlaceholder: '输入想说的话～ 代码和问题都可以哦 ✨',
      remember: '保持登录 ✨',
      loginSubmit: '✨ 进入工房',
      adminLink: '管理后台',
      indexHero: '像番剧一样开启 AI 日常',
      indexLead: '手机、平板、电脑都能聊～ 星芒界面里慢慢创作与问答',
      indexHeroEmoji: '⭐',
      loginHintIcon: '✨',
      formHelperDesc: '星语助手帮你整理成好看的 Markdown～',
      adminConsole: '工房控制台',
      usersLabel: '成员',
      sidebarAdminShort: '管理',
    },
    guofeng: {
      themeColor: '#b91c1c',
      brand: '墨韵 AI 书斋',
      brandShort: '墨韵 AI',
      subtitle: '书斋',
      tagline: '研墨以待，落笔成章',
      assistantEmoji: '📜',
      assistantLabel: '书斋助手',
      userEmoji: '🖋',
      logoEmoji: '🏮',
      logoEmojiAlt: '📜',
      loginTitle: '久违了',
      loginSubtitle: '凭管理员所赐账号，入席书斋',
      loginHero: '研墨铺纸<br />静候佳章',
      loginHeroDesc: '问学、起草、润色——于素笺之上，借 AI 之力成文。',
      footerHint: '注册已关闭，请向管理员申请入斋',
      adminRole: '掌事',
      quotaLabel: '用墨',
      composerPlaceholder: '在此落笔… 可陈述疑义、粘贴文稿',
      remember: '记住此身',
      loginSubmit: '🏮 入斋',
      adminLink: '书斋管理',
      indexHero: '研墨铺纸，静候佳章',
      indexLead: '问学、起草、润色——于素笺之上借 AI 之力成文',
      indexHeroEmoji: '📜',
      loginHintIcon: '🏮',
      formHelperDesc: '书斋助手按体例生成 Markdown 文稿',
      adminConsole: '书斋掌事台',
      usersLabel: '门生',
      sidebarAdminShort: '掌事',
    },
    neon: {
      themeColor: '#334155',
      brand: '轻霓虹终端',
      brandShort: '霓虹',
      subtitle: '终端',
      tagline: '低噪模式 · 在线',
      assistantEmoji: '💠',
      assistantLabel: '终端',
      userEmoji: '👤',
      logoEmoji: '💠',
      logoEmojiAlt: '▸',
      loginTitle: '终端登录',
      loginSubtitle: '凭授权凭证接入本地终端',
      loginHero: '静默连接<br />低光运行',
      loginHeroDesc: '技术问答与文档处理——克制光效，长时间使用更舒适。',
      footerHint: '注册已关闭，请联系系统管理员',
      adminRole: '管理员',
      quotaLabel: '请求额',
      composerPlaceholder: '输入指令或问题… 支持代码块',
      remember: '记住会话',
      loginSubmit: '▸ 接入',
      adminLink: '系统管理',
      indexHero: '静默连接，低光运行',
      indexLead: '技术问答与文档处理——克制光效，长时间使用更舒适',
      indexHeroEmoji: '▸',
      loginHintIcon: '💠',
      formHelperDesc: '终端按模板输出结构化 Markdown',
      adminConsole: '系统控制台',
      usersLabel: '用户',
      sidebarAdminShort: '系统',
    },
    conan: {
      themeColor: '#1e3a6e',
      brand: '米花町 AI 事务所',
      brandShort: '米花町 AI',
      subtitle: '侦探工房',
      tagline: '真相只有一个',
      assistantEmoji: '🔍',
      assistantLabel: '推理助手',
      userEmoji: '🕵',
      logoEmoji: '👓',
      logoEmojiAlt: '🔎',
      loginTitle: '欢迎回来，侦探',
      loginSubtitle: '用管理员账号登录，开始推理与创作',
      loginHero: '疑点逐一排查<br />真相近在眼前',
      loginHeroDesc: '技术问答、文档整理、图像分析——借 AI 之力，理清每一条线索。',
      footerHint: '注册已关闭，请联系管理员开通调查员账号',
      adminRole: '管理员',
      quotaLabel: '推理次数',
      composerPlaceholder: '输入线索或问题… 可粘贴代码、报错与案发现场描述',
      remember: '保持登录',
      loginSubmit: '🔍 开始调查',
      adminLink: '事务所管理',
      indexHero: '米花町 AI 推理助手',
      indexLead: '多端同步调查笔记 · 管理员配置模型 · 调查员登录即用',
      indexHeroEmoji: '🔍',
      loginHintIcon: '🔍',
      formHelperDesc: '整理线索，生成调查报告式 Markdown',
      adminConsole: '事务所控制台',
      usersLabel: '调查员',
      sidebarAdminShort: '管理',
    },
  }

  function getTheme() {
    const saved = localStorage.getItem(STORAGE_KEY)
    return THEME_IDS.includes(saved) ? saved : DEFAULT
  }

  function applyTheme(name) {
    const theme = THEME_IDS.includes(name) ? name : DEFAULT
    const meta = META[theme]

    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem(STORAGE_KEY, theme)

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
