import { Link } from 'react-router-dom'

type BottomNavProps = {
  onDrawerToggle?: () => void
}

export default function BottomNav({ onDrawerToggle }: BottomNavProps) {
  return (
    <nav className="bottom-nav" aria-label="主导航">
      <div className="bottom-nav-inner">
        <button type="button" className="bottom-nav-item" onClick={onDrawerToggle}>
          <span className="bn-icon">💬</span>
          <span>会话</span>
        </button>
        <Link to="/chat" className="bottom-nav-item active">
          <span className="bn-icon">🐱</span>
          <span>聊天</span>
        </Link>
        <button type="button" className="bottom-nav-item" onClick={onDrawerToggle}>
          <span className="bn-icon">🎀</span>
          <span>场景</span>
        </button>
        <Link to="/settings" className="bottom-nav-item">
          <span className="bn-icon">⚙️</span>
          <span>设置</span>
        </Link>
      </div>
    </nav>
  )
}
