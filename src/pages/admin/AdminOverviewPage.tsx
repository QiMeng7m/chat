import { Spin } from 'antd'
import { useEffect, useState } from 'react'
import { getAdminStats } from '../../api/admin'
import type { AdminStats } from '../../api/types'
import { AdminPageHeader } from '../../components/layout/AdminLayout'

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void (async () => {
      try {
        setStats(await getAdminStats())
      } catch {
        setStats({
          date: new Date().toISOString().slice(0, 10),
          totalRequests: 0,
          activeUsers: 0,
          errorCount: 0,
          topModels: [],
        })
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (loading) return <Spin />

  return (
    <section>
      <AdminPageHeader title="🌸 今日概览" desc={`${stats?.date ?? ''} · 平台运行概况`} />
      <div className="stats-grid">
        <div className="stat-card" data-emoji="💬">
          <div className="value">{stats?.totalRequests ?? 0}</div>
          <div className="label">今日请求</div>
        </div>
        <div className="stat-card" data-emoji="🐱">
          <div className="value">{stats?.activeUsers ?? 0}</div>
          <div className="label">活跃用户</div>
        </div>
        <div className="stat-card" data-emoji="🤖">
          <div className="value">{stats?.topModels?.length ?? 0}</div>
          <div className="label">热门模型</div>
        </div>
        <div className="stat-card" data-emoji="😿">
          <div className="value" style={{ color: 'var(--warning)' }}>
            {stats?.errorCount ?? 0}
          </div>
          <div className="label">今日错误</div>
        </div>
      </div>
    </section>
  )
}
