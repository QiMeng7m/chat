import { useCallback, useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import Composer from '../chat/Composer'
import BottomNav from './BottomNav'
import ChatTopbar from './ChatTopbar'
import FeatureScroll from './FeatureScroll'
import Sidebar from './Sidebar'
import '../../styles/app-layout.css'

export default function AppLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false)

  const closeDrawer = useCallback(() => setDrawerOpen(false), [])
  const toggleDrawer = useCallback(() => setDrawerOpen((open) => !open), [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeDrawer()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [closeDrawer])

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const onChange = () => {
      if (mq.matches) closeDrawer()
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [closeDrawer])

  return (
    <div className={`app-layout has-bottom-nav${drawerOpen ? ' drawer-open' : ''}`}>
      <button
        type="button"
        className="drawer-overlay"
        aria-hidden={!drawerOpen}
        aria-label="关闭菜单"
        onClick={closeDrawer}
      />

      <div className="app-shell">
        <Sidebar onCloseDrawer={closeDrawer} />
        <div className="main">
          <ChatTopbar onMenuClick={toggleDrawer} />
          <FeatureScroll />
          <div className="chat-area">
            <Outlet />
          </div>
          <Composer />
        </div>
      </div>

      <BottomNav onDrawerToggle={toggleDrawer} />
    </div>
  )
}
