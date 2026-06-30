import { THEME_CATALOG } from '../../theme/meta'
import { useTheme } from '../../theme/ThemeProvider'

export default function ThemePicker() {
  const { themeId, setTheme } = useTheme()

  return (
    <div className="theme-picker-grid" role="group" aria-label="选择界面主题">
      {THEME_CATALOG.map((theme) => (
        <button
          key={theme.id}
          type="button"
          className={`theme-card${themeId === theme.id ? ' active' : ''}`}
          aria-pressed={themeId === theme.id}
          onClick={() => setTheme(theme.id)}
        >
          <div className={`theme-card-preview theme-card-preview--${theme.id}`} />
          <div className="theme-card-body">
            <strong>
              {theme.emoji} {theme.name}
            </strong>
            <span>{theme.desc}</span>
          </div>
        </button>
      ))}
    </div>
  )
}
