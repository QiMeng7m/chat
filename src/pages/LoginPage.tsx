import { Button, Form, Input, message } from 'antd'
import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { getCaptchaConfig } from '../api/auth'
import { useAuth } from '../context/AuthContext'
import { ApiError } from '../api/http'
import { postLoginPath } from '../lib/userRoles'
import { useTheme } from '../theme/ThemeProvider'
import TurnstileWidget from '../components/auth/TurnstileWidget'
import SiteNoticesButton from '../components/layout/SiteNoticesButton'
import '../styles/login.css'

export default function LoginPage() {
  const { meta } = useTheme()
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(false)
  const [captchaEnabled, setCaptchaEnabled] = useState(false)
  const [siteKey, setSiteKey] = useState<string | null>(null)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [captchaKey, setCaptchaKey] = useState(0)
  const from = (location.state as { from?: string } | null)?.from

  useEffect(() => {
    void (async () => {
      try {
        const config = await getCaptchaConfig()
        setCaptchaEnabled(config.enabled)
        setSiteKey(config.siteKey ?? null)
      } catch {
        setCaptchaEnabled(false)
      }
    })()
  }, [])

  const handleCaptchaToken = useCallback((token: string) => {
    setTurnstileToken(token)
  }, [])

  const handleCaptchaExpire = useCallback(() => {
    setTurnstileToken(null)
  }, [])

  if (user) {
    return <Navigate to={postLoginPath(user.role, from)} replace />
  }

  const onFinish = async (values: { username: string; password: string }) => {
    if (captchaEnabled && !turnstileToken) {
      message.warning('请先完成人机验证')
      return
    }
    setLoading(true)
    try {
      const loggedInUser = await login(values.username, values.password, turnstileToken ?? undefined)
      message.success('登录成功～')
      navigate(postLoginPath(loggedInUser.role, from), { replace: true })
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : '登录失败，请检查账号密码'
      message.error(msg)
      setTurnstileToken(null)
      setCaptchaKey((k) => k + 1)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <Link to="/login" className="login-back">
        <span>←</span>
        <span>首页</span>
      </Link>
      <Link to="/settings" className="login-settings-link">
        ⚙️ 外观
      </Link>

      <div className="login-shell">
        <aside className="login-brand" aria-hidden="true">
          <div className="login-brand-inner">
            <div className="login-brand-logo">
              <div className="logo-mascot">{meta.logoEmoji}</div>
              <div className="login-brand-logo-text">
                <strong>{meta.brand}</strong>
                <span>{meta.tagline}</span>
              </div>
            </div>
            <div className="login-mascot-row">
              <span className="login-mascot">{meta.logoEmoji}</span>
              <span className="login-mascot">{meta.logoEmojiAlt}</span>
            </div>
            <h2>
              {meta.loginHero.split('\n').map((line, i) => (
                <span key={i}>
                  {line}
                  {i === 0 ? <br /> : null}
                </span>
              ))}
            </h2>
            <p>{meta.loginHeroDesc}</p>
            <div className="login-features">
              <span className="login-feature-tag">💬 自由对话</span>
              <span className="login-feature-tag">🛠 技术问答</span>
              <span className="login-feature-tag">📄 文档生成</span>
              <span className="login-feature-tag">🖼 图片分析</span>
            </div>
          </div>
        </aside>

        <main className="login-form-panel">
          <div className="login-card">
            <div className="login-card-body">
              <div className="login-card-mobile-header">
                <div className="mini-mascots">
                  <span>{meta.logoEmoji}</span> <span>{meta.logoEmojiAlt}</span>
                </div>
              </div>
              <h1>{meta.loginTitle}</h1>
              <p className="subtitle">{meta.loginSubtitle}</p>

              <Form layout="vertical" onFinish={onFinish} initialValues={{ username: '' }}>
                <Form.Item
                  label="账号"
                  name="username"
                  rules={[
                    { required: true, message: '请输入账号' },
                    { min: 2, message: '账号至少 2 个字符' },
                  ]}
                >
                  <Input placeholder="你的账号" autoComplete="username" size="large" />
                </Form.Item>
                <Form.Item
                  label="密码"
                  name="password"
                  rules={[{ required: true, message: '请输入密码' }]}
                >
                  <Input.Password placeholder="••••••••" autoComplete="current-password" size="large" />
                </Form.Item>
                {captchaEnabled && siteKey ? (
                  <Form.Item label="人机验证">
                    <TurnstileWidget
                      key={captchaKey}
                      siteKey={siteKey}
                      onToken={handleCaptchaToken}
                      onExpire={handleCaptchaExpire}
                      onError={handleCaptchaExpire}
                    />
                  </Form.Item>
                ) : null}
                <Form.Item>
                  <Button type="primary" htmlType="submit" block size="large" loading={loading}>
                    {meta.loginSubmit}
                  </Button>
                </Form.Item>
              </Form>
              <p className="login-footer-hint">
                {meta.loginFooterPrompt}{' '}
                <Link to="/register">立即注册</Link>
                {' · '}
                <SiteNoticesButton mode="public" variant="link" />
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
