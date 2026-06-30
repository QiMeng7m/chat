import { Button } from 'antd'
import { Link } from 'react-router-dom'
import { useChat } from '../chat/ChatContext'
import { useTheme } from '../../theme/ThemeProvider'
import { useAuth } from '../../context/AuthContext'

type SidebarProps = {
  onNavigate?: () => void
  onCloseDrawer?: () => void
}

function formatMeta(featureName: string, updatedAt: number): string {
  const date = new Date(updatedAt)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()
  const timeStr = isToday
    ? `今天 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`
    : date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })
  return `${featureName} · ${timeStr}`
}

export default function Sidebar({ onNavigate, onCloseDrawer }: SidebarProps) {
  const { meta } = useTheme()
  const { user } = useAuth()
  const {
    sessions,
    features,
    featureId,
    currentSessionId,
    setFeatureId,
    selectSession,
    newSession,
  } = useChat()

  const handleNav = () => {
    onNavigate?.()
    onCloseDrawer?.()
  }

  const handleNewChat = () => {
    newSession()
    handleNav()
  }

  const handleSelectSession = (id: string) => {
    void selectSession(id)
    handleNav()
  }

  return (
    <aside className="sidebar">
      <button
        type="button"
        className="drawer-close-btn"
        aria-label="关闭菜单"
        onClick={onCloseDrawer}
      >
        ✕
      </button>

      <div className="sidebar-header">
        <Link to="/chat" className="sidebar-brand" onClick={handleNav}>
          <div className="logo-mascot">{meta.logoEmoji}</div>
          <div>
            <span>{meta.brandShort}</span>
            <span className="subtitle">{meta.subtitle}</span>
          </div>
        </Link>
        <Button type="primary" block style={{ marginTop: 16 }} onClick={handleNewChat}>
          ✨ 新对话
        </Button>
      </div>

      <div className="sidebar-body">
        <div className="sidebar-section-title">📝 最近会话</div>
        {sessions.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--text-muted)', padding: '0 4px' }}>
            暂无会话，开始新对话吧～
          </p>
        ) : (
          sessions.map((session) => {
            const featureName =
              features.find((f) => f.id === session.featureId)?.name ?? '对话'
            return (
              <button
                key={session.id}
                type="button"
                className={`session-item${session.id === currentSessionId ? ' active' : ''}`}
                onClick={() => handleSelectSession(session.id)}
              >
                <span className="session-emoji">{session.emoji ?? '💬'}</span>
                <div>
                  <div className="title">{session.title}</div>
                  <div className="meta">{formatMeta(featureName, session.updatedAt)}</div>
                </div>
              </button>
            )
          })
        )}

        <div className="sidebar-section-title" style={{ marginTop: 18 }}>
          🎀 场景功能
        </div>
        <div className="feature-grid">
          {features.map((feature) => (
            <button
              key={feature.id}
              type="button"
              className={`feature-chip${feature.id === featureId ? ' active' : ''}`}
              onClick={() => {
                setFeatureId(feature.id)
                handleNav()
              }}
            >
              <span className="icon">{feature.icon}</span>
              <span className="name">{feature.name}</span>
              <span className="desc">{feature.description}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="sidebar-footer">
        {user?.role === 'admin' ? (
          <Link to="/admin" onClick={handleNav}>
            🐾 {meta.adminLink}
          </Link>
        ) : null}
        <Link to="/settings" onClick={handleNav}>
          ⚙️ 个人设置
        </Link>
      </div>
    </aside>
  )
}
