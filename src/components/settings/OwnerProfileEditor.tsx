import { Button, Input, Spin, message } from 'antd'
import { useCallback, useEffect, useState } from 'react'
import {
  getOwnerProfile,
  updateOwnerProfile,
  updateOwnerResume,
} from '../../api/ownerProfile'
import { ApiError } from '../../api/http'
import type { OwnerFact, OwnerProfile } from '../../api/types'
import { getDefaultOwnerProfile } from '../../lib/ownerProfile'

function newFactId(): string {
  return `fact-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

function formatSyncMessage(status: string, chunkCount?: number): string {
  if (status === 'indexed') {
    return chunkCount
      ? `索引完成，共 ${chunkCount} 段。访客可在「了解主人」中提问。`
      : '索引完成。访客可在「了解主人」中提问。'
  }
  if (status === 'failed') {
    return '索引失败，请稍后重试或联系管理员。'
  }
  return '资料已保存，正在建立索引…完成后可在「了解主人」中提问。'
}

export default function OwnerProfileEditor() {
  const [profile, setProfile] = useState<OwnerProfile | null>(null)
  const [resume, setResume] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    void (async () => {
      setLoading(true)
      try {
        const data = await getOwnerProfile()
        setProfile(data)
      } catch {
        message.error('加载主人资料失败，已使用本地默认内容')
        setProfile(getDefaultOwnerProfile())
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const updateField = useCallback(<K extends keyof OwnerProfile>(key: K, value: OwnerProfile[K]) => {
    setProfile((prev) => (prev ? { ...prev, [key]: value } : prev))
  }, [])

  const updateFact = useCallback((id: string, patch: Partial<OwnerFact>) => {
    setProfile((prev) =>
      prev
        ? {
            ...prev,
            facts: prev.facts.map((f) => (f.id === id ? { ...f, ...patch } : f)),
          }
        : prev,
    )
  }, [])

  const addFact = useCallback(() => {
    setProfile((prev) =>
      prev
        ? {
            ...prev,
            facts: [...prev.facts, { id: newFactId(), topic: '', content: '' }],
          }
        : prev,
    )
  }, [])

  const removeFact = useCallback((id: string) => {
    setProfile((prev) =>
      prev
        ? {
            ...prev,
            facts: prev.facts.filter((f) => f.id !== id),
          }
        : prev,
    )
  }, [])

  const handleSave = async () => {
    if (!profile) return
    const nicknames = profile.nicknames.map((n) => n.trim()).filter(Boolean)
    if (!nicknames.length) {
      message.warning('请至少填写一个昵称')
      return
    }
    if (!profile.summary.trim()) {
      message.warning('请填写总体介绍')
      return
    }

    const next: OwnerProfile = {
      ...profile,
      nicknames,
      summary: profile.summary.trim(),
      realName: profile.realName?.trim() || undefined,
      title: profile.title.trim() || '主人',
      facts: profile.facts
        .map((f) => ({ ...f, topic: f.topic.trim(), content: f.content.trim() }))
        .filter((f) => f.topic && f.content),
    }

    setSaving(true)
    try {
      const saved = await updateOwnerProfile({ ...next, syncKb: true })
      setProfile(saved)

      let syncNote = '资料已保存，正在同步至知识库《基本信息》…'

      if (resume.trim()) {
        try {
          const resumeSync = await updateOwnerResume(resume.trim())
          syncNote = `资料已保存。${formatSyncMessage(resumeSync.status, resumeSync.chunkCount)}`
        } catch (err) {
          const apiErr = err instanceof ApiError ? err : null
          if (apiErr?.status === 404) {
            syncNote += ' 简历索引接口暂未就绪。'
          } else {
            throw err
          }
        }
      }

      message.success(syncNote)
    } catch (err) {
      message.error(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    const defaults = getDefaultOwnerProfile()
    setSaving(true)
    try {
      const saved = await updateOwnerProfile(defaults)
      setProfile(saved)
      setResume('')
      message.info('已恢复默认主人资料')
    } catch (err) {
      message.error(err instanceof Error ? err.message : '恢复默认失败')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !profile) {
    return (
      <div className="owner-profile-editor owner-profile-loading">
        <Spin tip="加载主人资料…" />
      </div>
    )
  }

  return (
    <div className="owner-profile-editor">
      <div className="owner-profile-field">
        <label htmlFor="owner-nicknames">昵称（逗号分隔）</label>
        <Input
          id="owner-nicknames"
          value={profile.nicknames.join('，')}
          onChange={(e) =>
            updateField(
              'nicknames',
              e.target.value.split(/[,，]/).map((s) => s.trim()),
            )
          }
          placeholder="柒梦"
        />
      </div>

      <div className="owner-profile-row">
        <div className="owner-profile-field">
          <label htmlFor="owner-realname">本名</label>
          <Input
            id="owner-realname"
            value={profile.realName ?? ''}
            onChange={(e) => updateField('realName', e.target.value)}
            placeholder="王鸿博"
          />
        </div>
        <div className="owner-profile-field">
          <label htmlFor="owner-title">小柒的称呼</label>
          <Input
            id="owner-title"
            value={profile.title}
            onChange={(e) => updateField('title', e.target.value)}
            placeholder="主人"
          />
        </div>
      </div>

      <div className="owner-profile-field">
        <label htmlFor="owner-summary">总体介绍</label>
        <Input.TextArea
          id="owner-summary"
          value={profile.summary}
          onChange={(e) => updateField('summary', e.target.value)}
          rows={4}
          placeholder="一段关于主人的介绍，将同步至知识库《基本信息》"
        />
      </div>

      <div className="owner-profile-facts">
        <div className="owner-profile-facts-head">
          <span>详细条目</span>
          <Button type="link" size="small" onClick={addFact}>
            + 添加条目
          </Button>
        </div>
        {profile.facts.map((fact) => (
          <div key={fact.id} className="owner-profile-fact-card">
            <Input
              value={fact.topic}
              onChange={(e) => updateFact(fact.id, { topic: e.target.value })}
              placeholder="主题，如：身高、爱好、职业"
              aria-label="条目主题"
            />
            <Input.TextArea
              value={fact.content}
              onChange={(e) => updateFact(fact.id, { content: e.target.value })}
              placeholder="具体内容"
              rows={2}
              aria-label="条目内容"
            />
            <Button type="text" danger size="small" onClick={() => removeFact(fact.id)}>
              删除
            </Button>
          </div>
        ))}
        {!profile.facts.length ? (
          <p className="owner-profile-empty">暂无条目，可点击「添加条目」补充身高、爱好、职业等信息。</p>
        ) : null}
      </div>

      <div className="owner-profile-field owner-profile-resume">
        <label htmlFor="owner-resume">简历 / 经历（Markdown）</label>
        <p className="owner-profile-hint">
          粘贴工作经历、项目与技术栈。保存后将写入知识库《简历》，供「了解主人」场景 RAG 检索。
        </p>
        <Input.TextArea
          id="owner-resume"
          value={resume}
          onChange={(e) => setResume(e.target.value)}
          rows={8}
          placeholder={'# 工作经历\n\n## 2022–2024 …\n\n- 项目 A\n- 技术栈：…'}
        />
      </div>

      <div className="owner-profile-actions">
        <Button type="primary" loading={saving} onClick={() => void handleSave()}>
          保存并更新索引
        </Button>
        <Button loading={saving} onClick={() => void handleReset()}>
          恢复默认
        </Button>
      </div>
    </div>
  )
}
