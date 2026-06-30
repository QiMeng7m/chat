import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  DEFAULT_THEME,
  THEME_META,
  THEME_STORAGE_KEY,
  isThemeId,
  type ThemeId,
  type ThemeMeta,
} from './meta'

type ThemeContextValue = {
  themeId: ThemeId
  meta: ThemeMeta
  setTheme: (id: ThemeId) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function readStoredTheme(): ThemeId {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY)
    if (isThemeId(saved)) return saved
  } catch {
    // ignore
  }
  return DEFAULT_THEME
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeIdState] = useState<ThemeId>(readStoredTheme)

  const setTheme = useCallback((id: ThemeId) => {
    setThemeIdState(id)
    document.documentElement.setAttribute('data-theme', id)
    localStorage.setItem(THEME_STORAGE_KEY, id)
    const meta = THEME_META[id]
    const themeMeta = document.querySelector('meta[name="theme-color"]')
    if (themeMeta) themeMeta.setAttribute('content', meta.themeColor)
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeId)
    const meta = THEME_META[themeId]
    const themeMeta = document.querySelector('meta[name="theme-color"]')
    if (themeMeta) themeMeta.setAttribute('content', meta.themeColor)
  }, [themeId])

  const value = useMemo(
    () => ({ themeId, meta: THEME_META[themeId], setTheme }),
    [themeId, setTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
