import { Modal } from 'antd'
import { useMemo, useState } from 'react'
import {
  buildSiteNoticeSections,
  noticesContextFromMeta,
  type NoticeAudience,
} from '../../data/siteNotices'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../theme/ThemeProvider'

type SiteNoticesButtonProps = {
  /** public：未登录；user：登录用户视角（含 public） */
  mode?: 'auto' | NoticeAudience
  variant?: 'icon' | 'link'
  className?: string
}

export default function SiteNoticesButton({
  mode = 'auto',
  variant = 'icon',
  className,
}: SiteNoticesButtonProps) {
  const { meta } = useTheme()
  const { user } = useAuth()
  const [open, setOpen] = useState(false)

  const sections = useMemo(() => {
    const ctx =
      mode === 'auto'
        ? noticesContextFromMeta(meta, user?.role ?? null)
        : {
            ...noticesContextFromMeta(meta, mode === 'admin' ? 'admin' : mode === 'user' ? 'user' : null),
            audiences:
              mode === 'admin'
                ? (['public', 'user', 'admin'] as NoticeAudience[])
                : mode === 'user'
                  ? (['public', 'user'] as NoticeAudience[])
                  : (['public'] as NoticeAudience[]),
          }
    return buildSiteNoticeSections(ctx)
  }, [meta, user?.role, mode])

  const trigger =
    variant === 'link' ? (
      <button
        type="button"
        className={`site-notices-link${className ? ` ${className}` : ''}`}
        onClick={() => setOpen(true)}
        aria-label="查看使用须知"
      >
        📋 使用须知
      </button>
    ) : (
      <button
        type="button"
        className={`site-notices-btn${className ? ` ${className}` : ''}`}
        onClick={() => setOpen(true)}
        aria-label="注意事项"
        title="注意事项"
      >
        📋
      </button>
    )

  return (
    <>
      {trigger}
      <Modal
        title="📋 使用须知"
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
        width={520}
        centered
        className="site-notices-modal"
        destroyOnHidden
        styles={{
          body: { padding: '0 24px 24px', overflow: 'hidden' },
        }}
      >
        <div className="site-notices-card">
          <p className="site-notices-lead">
            以下内容汇总了{meta.brand}的额度、模型权限与账号相关说明，使用前建议了解。
          </p>
          <div className="site-notices-scroll">
            <div className="site-notices-body">
              {sections.map((section) => (
                <section key={section.id} className="site-notices-section">
                  <h3 className="site-notices-section-title">
                    <span aria-hidden="true">{section.icon}</span>
                    {section.title}
                  </h3>
                  <ul className="site-notices-list">
                    {section.items.map((entry) => (
                      <li key={entry.id}>{entry.text}</li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </>
  )
}

/** 设置页等内嵌展示，无弹窗 */
export function SiteNoticesPanel({ mode = 'auto' }: { mode?: SiteNoticesButtonProps['mode'] }) {
  const { meta } = useTheme()
  const { user } = useAuth()

  const sections = useMemo(() => {
    const ctx =
      mode === 'auto'
        ? noticesContextFromMeta(meta, user?.role ?? null)
        : noticesContextFromMeta(meta, mode === 'admin' ? 'admin' : mode === 'user' ? 'user' : null)
    return buildSiteNoticeSections(ctx)
  }, [meta, user?.role, mode])

  return (
    <div className="site-notices-panel site-notices-panel--embedded">
      {sections.map((section) => (
        <section key={section.id} className="site-notices-section">
          <h3 className="site-notices-section-title">
            <span aria-hidden="true">{section.icon}</span>
            {section.title}
          </h3>
          <ul className="site-notices-list">
            {section.items.map((entry) => (
              <li key={entry.id}>{entry.text}</li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
