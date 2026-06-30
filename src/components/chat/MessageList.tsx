import { useEffect, useRef } from 'react'
import { useTheme } from '../../theme/ThemeProvider'
import type { ChatMessage } from '../../types/chat'
import type { FeaturePublic } from '../../api/types'
import MarkdownContent from './MarkdownContent'
import { useChat } from './ChatContext'

type MessageListProps = {
  messages: ChatMessage[]
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

export default function MessageList({ messages }: MessageListProps) {
  const { meta } = useTheme()
  const { features, setFeatureId } = useChat()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (messages.length === 0) {
    const shortcuts = features.slice(0, 6)
    return (
      <div className="empty-state">
        <span className="empty-mascot">{meta.assistantEmoji}</span>
        <h2>开始新对话吧</h2>
        <p>选一个场景，或在下方输入框直接开聊～</p>
        <div className="empty-features">
          {shortcuts.map((feature: FeaturePublic) => (
            <button
              key={feature.id}
              type="button"
              className="empty-feature-card"
              onClick={() => setFeatureId(feature.id)}
            >
              <span className="efc-icon">{feature.icon}</span>
              <span className="efc-name">{feature.name}</span>
              <span className="efc-desc">{feature.description}</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      {messages.map((message) => (
        <article key={message.id} className={`message ${message.role}`}>
          <div className="message-avatar">
            {message.role === 'user' ? meta.userEmoji : meta.assistantEmoji}
          </div>
          <div className="message-body">
            <div className="message-header">
              {message.role === 'user' ? '你' : meta.assistantLabel} · {formatTime(message.createdAt)}
              {message.streaming ? <span className="typing-cursor">|</span> : null}
            </div>
            {message.attachments?.length ? (
              <div className="message-attachments">
                {message.attachments.map((att) => (
                  <img key={att.url} src={att.url} alt={att.name ?? '图片'} className="message-attachment-img" />
                ))}
              </div>
            ) : null}
            <div className={`message-content${message.role === 'assistant' ? ' message-content--md' : ''}`}>
              {message.role === 'assistant' ? (
                message.content ? (
                  <MarkdownContent content={message.content} />
                ) : message.streaming ? (
                  '…'
                ) : null
              ) : (
                message.content || (message.streaming ? '…' : '')
              )}
            </div>
          </div>
        </article>
      ))}
      <div ref={bottomRef} />
    </>
  )
}
