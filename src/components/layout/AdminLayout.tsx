import { Link, NavLink, Outlet } from 'react-router-dom'
import { useTheme } from '../../theme/ThemeProvider'
import '../../styles/app-layout.css'
import '../../styles/admin.css'

type AdminLayoutProps = {
  drawerOpen?: boolean
  onMenuClick?: () => void
  onCloseDrawer?: () => void
}

export default function AdminLayout({
  drawerOpen = false,
  onMenuClick,
  onCloseDrawer,
}: AdminLayoutProps) {
  const { meta } = useTheme()

  return (
    <div className={`app-layout admin-layout${drawerOpen ? ' drawer-open' : ''}`}>
      <button
        type="button"
        className="drawer-overlay"
        aria-hidden={!drawerOpen}
        onClick={onCloseDrawer}
      />

      <div className="app-shell">
        <aside className="sidebar admin-sidebar">
          <button type="button" className="drawer-close-btn" aria-label="关闭" onClick={onCloseDrawer}>
            ✕
          </button>
          <div className="sidebar-header">
            <div className="sidebar-brand">
              <div className="logo-mascot">{meta.logoEmojiAlt}</div>
              <div>
                管理后台
                <span className="subtitle">{meta.adminConsole}</span>
              </div>
            </div>
          </div>
          <nav className="sidebar-body admin-nav">
            <NavLink to="/admin" end className="admin-nav-item">
              📊 概览
            </NavLink>
            <NavLink to="/admin/providers" className="admin-nav-item">
              🔌 Provider
            </NavLink>
            <NavLink to="/admin/models" className="admin-nav-item">
              🤖 模型
            </NavLink>
            <NavLink to="/admin/features" className="admin-nav-item">
              🎀 Feature
            </NavLink>
            <NavLink to="/admin/users" className="admin-nav-item">
              👥 {meta.usersLabel}
            </NavLink>
            <NavLink to="/settings" className="admin-nav-item">
              ⚙️ 个人设置
            </NavLink>
          </nav>
          <div className="admin-sidebar-footer">
            <Link to="/chat">← 返回聊天</Link>
          </div>
        </aside>

        <div className="main">
          <header className="topbar">
            <div className="topbar-left">
              <button type="button" className="menu-btn" aria-label="菜单" onClick={onMenuClick}>
                ☰
              </button>
              <span className="topbar-title">📊 管理后台</span>
            </div>
            <div className="topbar-right topbar-desktop-only">
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--secondary)' }}>
                🐾 {meta.adminRole}
              </span>
              <Link to="/settings" className="user-settings-link">
                ⚙️
              </Link>
            </div>
          </header>
          <div className="content admin-content">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}

export function AdminPageHeader({
  title,
  desc,
  action,
}: {
  title: string
  desc?: string
  action?: React.ReactNode
}) {
  return (
    <div className="page-header page-header-row">
      <div>
        <h1>{title}</h1>
        {desc ? <p>{desc}</p> : null}
      </div>
      {action}
    </div>
  )
}
