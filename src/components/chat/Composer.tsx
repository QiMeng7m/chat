import { Button } from 'antd'
import { useCallback, useRef, useState } from 'react'
import { useTheme } from '../../theme/ThemeProvider'
import { useAuth } from '../../context/AuthContext'
import { useChat } from './ChatContext'

export default function Composer() {
  const { meta } = useTheme()
  const { quotaRemaining } = useAuth()
  const {
    streaming,
    sendMessage,
    stopGeneration,
    currentFeature,
    attachments,
    addAttachment,
    removeAttachment,
    supportsVision,
    quotaError,
    canChat,
    modelsEmpty,
    catalogLoading,
  } = useChat()
  const [draft, setDraft] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const isFormFeature = currentFeature?.uiSchema?.type === 'form'

  const handleSend = useCallback(async () => {
    const text = draft.trim()
    if ((!text && attachments.length === 0) || streaming || !canChat) return
    setDraft('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
    await sendMessage(text)
  }, [draft, streaming, sendMessage, canChat, attachments.length])

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void handleSend()
    }
  }

  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDraft(event.target.value)
    const el = event.target
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) void addAttachment(file)
    event.target.value = ''
  }

  if (isFormFeature) {
    return null
  }

  return (
    <div className="composer-wrap">
      {quotaError ? (
        <div className="quota-error-banner" role="alert">
          {quotaError}
        </div>
      ) : null}
      {!catalogLoading && modelsEmpty ? (
        <div className="quota-error-banner" role="status">
          暂无可用模型，请在后端项目 `.env` 配置 LLM_API_KEY 后执行 `npm run db:seed`
        </div>
      ) : null}
      <div className="composer">
        <div className="composer-toolbar">
          <span>当前场景</span>
          <span className="feature-badge">
            {currentFeature?.icon} {currentFeature?.name ?? '对话'}
          </span>
          <span className="composer-toolbar-hint">Enter 发送 · Shift+Enter 换行</span>
        </div>
        {attachments.length > 0 ? (
          <div className="composer-attachments">
            {attachments.map((att, i) => (
              <div key={`${att.url}-${i}`} className="composer-attachment">
                <img src={att.url} alt={att.name ?? '上传图片'} />
                <button type="button" aria-label="移除图片" onClick={() => removeAttachment(i)}>
                  ✕
                </button>
              </div>
            ))}
          </div>
        ) : null}
        <textarea
          ref={textareaRef}
          className="composer-input"
          rows={2}
          placeholder={
            modelsEmpty
              ? '暂无可用模型，无法对话'
              : meta.composerPlaceholder
          }
          value={draft}
          disabled={streaming || !canChat}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
        />
        <div className="composer-footer">
          <div className="composer-footer-left">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handleFileChange}
            />
            <button
              type="button"
              className="btn-icon"
              title={supportsVision ? '上传图片' : '需 vision 模型'}
              disabled={!supportsVision || streaming}
              onClick={() => fileRef.current?.click()}
            >
              🖼
            </button>
          </div>
          <div className="composer-footer-right">
            <span className="composer-hint">
              今日还剩 {quotaRemaining} 次{meta.quotaLabel === '小鱼干' ? '喵' : ''}
            </span>
            {streaming ? (
              <Button danger onClick={stopGeneration}>
                ⏹ 停止
              </Button>
            ) : (
              <Button type="primary" disabled={(!draft.trim() && attachments.length === 0) || !canChat} onClick={() => void handleSend()}>
                发送 🐾
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
