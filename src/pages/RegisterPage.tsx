import { Button, Form, Input, message } from 'antd'
import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { getCaptchaConfig } from '../api/auth'
import { useAuth } from '../context/AuthContext'
import { ApiError } from '../api/http'
import { postLoginPath } from '../lib/userRoles'
import { useTheme } from '../theme/ThemeProvider'
import TurnstileWidget from '../components/auth/TurnstileWidget'
import SiteNoticesButton from '../components/layout/SiteNoticesButton'
import '../styles/login.css'

export default function RegisterPage() {
  const { meta } = useTheme()
  const { user, register } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [captchaEnabled, setCaptchaEnabled] = useState(false)
  const [siteKey, setSiteKey] = useState<string | null>(null)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [captchaKey, setCaptchaKey] = useState(0)

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
    return <Navigate to={postLoginPath(user.role)} replace />
  }

  const onFinish = async (values: { username: string; password: string; confirm: string }) => {
    if (values.password !== values.confirm) {
      message.error('两次输入的密码不一致')
      return
    }
    if (values.password.length < 6) {
      message.error('密码至少 6 位')
      return
    }
    if (captchaEnabled && !turnstileToken) {
      message.warning('请先完成人机验证')
      return
    }
    setLoading(true)
    try {
      await register(values.username, values.password, turnstileToken ?? undefined)
      message.success('注册成功～')
      navigate('/chat', { replace: true })
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : '注册失败，请稍后重试'
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
        <span>返回登录</span>
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
              <h1>{meta.registerTitle}</h1>
              <p className="subtitle">{meta.registerSubtitle}</p>

              <Form layout="vertical" onFinish={onFinish} initialValues={{ username: '' }}>
                <Form.Item
                  label="账号"
                  name="username"
                  rules={[
                    { required: true, message: '请输入账号' },
                    { min: 2, message: '账号至少 2 个字符' },
                    { max: 32, message: '账号最多 32 个字符' },
                  ]}
                >
                  <Input placeholder="取一个账号名" autoComplete="username" size="large" />
                </Form.Item>
                <Form.Item
                  label="密码"
                  name="password"
                  rules={[
                    { required: true, message: '请输入密码' },
                    { min: 6, message: '密码至少 6 位' },
                  ]}
                >
                  <Input.Password placeholder="至少 6 位" autoComplete="new-password" size="large" />
                </Form.Item>
                <Form.Item
                  label="确认密码"
                  name="confirm"
                  dependencies={['password']}
                  rules={[
                    { required: true, message: '请再次输入密码' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('password') === value) {
                          return Promise.resolve()
                        }
                        return Promise.reject(new Error('两次输入的密码不一致'))
                      },
                    }),
                  ]}
                >
                  <Input.Password placeholder="再次输入密码" autoComplete="new-password" size="large" />
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
                    {meta.registerSubmit}
                  </Button>
                </Form.Item>
              </Form>
              <p className="login-footer-hint">
                {meta.registerFooterPrompt}{' '}
                <Link to="/login">去登录</Link>
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
