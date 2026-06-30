/**
 * 喵汪 AI 工坊 — 多端 UI 交互（抽屉 / 底部导航 / 安全区）
 */
(function () {
  const DRAWER_OPEN = 'drawer-open'
  const body = document.body

  function openDrawer() {
    body.classList.add(DRAWER_OPEN)
  }

  function closeDrawer() {
    body.classList.remove(DRAWER_OPEN)
  }

  function toggleDrawer() {
    body.classList.toggle(DRAWER_OPEN)
  }

  document.querySelectorAll('[data-drawer-toggle]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault()
      toggleDrawer()
    })
  })

  document.querySelectorAll('[data-drawer-close]').forEach((el) => {
    el.addEventListener('click', closeDrawer)
  })

  document.querySelectorAll('.sidebar a, .sidebar button[data-drawer-close-on-click]').forEach((el) => {
    el.addEventListener('click', () => {
      if (window.matchMedia('(max-width: 1023px)').matches) {
        closeDrawer()
      }
    })
  })

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDrawer()
  })

  window.addEventListener('resize', () => {
    if (window.matchMedia('(min-width: 1024px)').matches) {
      closeDrawer()
    }
  })

  /* 首页右侧导航面板 */
  const navToggle = document.querySelector('[data-nav-toggle]')
  const navPanel = document.querySelector('.mobile-nav-panel')
  const navOverlay = document.querySelector('[data-nav-overlay]')

  function closeNavPanel() {
    navPanel?.classList.remove('open')
    navOverlay?.classList.remove('open')
    body.style.overflow = ''
  }

  navToggle?.addEventListener('click', () => {
    navPanel?.classList.toggle('open')
    navOverlay?.classList.toggle('open')
    body.style.overflow = navPanel?.classList.contains('open') ? 'hidden' : ''
  })

  navOverlay?.addEventListener('click', closeNavPanel)
  navPanel?.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', closeNavPanel)
  })
})()
