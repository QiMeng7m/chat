import { Button } from 'antd'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../theme/ThemeProvider'
import ThemePicker from '../components/theme/ThemePicker'
import OwnerProfileEditor from '../components/settings/OwnerProfileEditor'
import SiteNoticesButton, { SiteNoticesPanel } from '../components/layout/SiteNoticesButton'
import '../styles/app-layout.css'
import '../styles/admin.css'

export default function SettingsPage() {
  const { meta } = useTheme()
  const { user, logout, quotaRemaining, quotaTotal } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="app-layout">
      <div className="app-shell">
        <div className="main" style={{ width: '100%' }}>
          <header className="topbar">
            <div className="topbar-left">
              <Link to="/chat" className="settings-back-link">
                ← 返回
              </Link>
              <span className="topbar-title">⚙️ 个人设置</span>
            </div>
            <div className="topbar-right topbar-desktop-only">
              <SiteNoticesButton />
              {user ? (
                <>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {user.username}
                  </span>
                  <Button type="link" onClick={() => void handleLogout()}>
                    退出
                  </Button>
                </>
              ) : (
                <Link to="/login">登录</Link>
              )}
            </div>
          </header>

          <div className="content settings-page">
            {user ? (
              <div className="card settings-profile-card">
                <div className="settings-avatar">{meta.userEmoji}</div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 16 }}>{user.username}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                    {meta.adminRole} · 总配额 🐟 {quotaRemaining}/{quotaTotal}
                  </div>
                </div>
              </div>
            ) : null}

            <section className="settings-section" aria-labelledby="theme-heading">
              <h2 id="theme-heading">🎨 界面主题</h2>
              <p>选择视觉风格，会在所有页面生效并保存在本机浏览器中。</p>
              <ThemePicker />
            </section>

            {user?.role === 'admin' ? (
              <section className="settings-section" aria-labelledby="owner-heading">
                <h2 id="owner-heading">👑 站长公开资料（知识库）</h2>
                <p>
                  维护基本信息与简历，保存后自动索引至 <code>owner-public</code> 知识库。访客在「了解主人」场景中通过
                  RAG 检索回答；「自由对话」不会查询此资料。
                </p>
                <OwnerProfileEditor />
              </section>
            ) : null}

            <section className="settings-section" aria-labelledby="notices-heading">
              <div className="settings-section-head">
                <div>
                  <h2 id="notices-heading">📋 使用须知</h2>
                  <p>额度、模型权限与账号相关说明（与顶栏 📋 图标内容一致）。</p>
                </div>
                <SiteNoticesButton />
              </div>
              <div className="site-notices-panel-card">
                <SiteNoticesPanel />
              </div>
            </section>

            <section className="settings-section" aria-labelledby="pref-heading">
              <h2 id="pref-heading">🔔 偏好（占位）</h2>
              <p>正式版可在此配置默认模型、消息密度等。</p>
              <div className="settings-pref-placeholder">
                默认场景、Composer 快捷键等待产品定稿后接入。
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
