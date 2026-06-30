import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../theme/ThemeProvider'
import ModelSelect from '../chat/ModelSelect'
import { useChat } from '../chat/ChatContext'

type ChatTopbarProps = {
  onMenuClick?: () => void
}

export default function ChatTopbar({ onMenuClick }: ChatTopbarProps) {
  const { meta } = useTheme()
  const { user, quotaRemaining, quotaTotal } = useAuth()
  const {
    currentFeature,
    models,
    modelId,
    setModelId,
    modelLocked,
    quotaError,
    modelsEmpty,
    catalogLoading,
  } = useChat()

  const title = currentFeature ? `${currentFeature.icon} ${currentFeature.name}` : '💬 对话'
  const primaryTag = models.find((m) => m.id === modelId)?.tags[0]

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button type="button" className="menu-btn" aria-label="打开菜单" onClick={onMenuClick}>
          ☰
        </button>
        <span className="topbar-title">{title}</span>
        {primaryTag ? <span className="model-tag">{primaryTag}</span> : null}
      </div>

      <div className="topbar-right topbar-compact">
        {modelsEmpty && !catalogLoading ? (
          <span className="model-empty-hint">暂无模型</span>
        ) : (
          <ModelSelect
            models={models}
            value={modelId}
            onChange={setModelId}
            disabled={modelLocked}
            compact
          />
        )}
      </div>

      <div className="topbar-right topbar-desktop-only">
        {modelsEmpty && !catalogLoading ? (
          <span className="model-empty-hint">暂无可用模型</span>
        ) : (
          <ModelSelect
            models={models}
            value={modelId}
            onChange={setModelId}
            disabled={modelLocked}
          />
        )}
        <span className={`quota-badge${quotaError ? ' quota-badge--warn' : ''}`}>
          🐟 {meta.quotaLabel} {quotaRemaining}/{quotaTotal}
        </span>
        {user ? (
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
            {user.email}
          </span>
        ) : null}
        <Link to="/settings" className="user-settings-link" aria-label="个人设置">
          ⚙️
        </Link>
      </div>
    </header>
  )
}
