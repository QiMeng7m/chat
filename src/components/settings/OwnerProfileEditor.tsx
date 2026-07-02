import { Button, Input, Spin, message } from 'antd'
import { useCallback, useEffect, useState } from 'react'
import { getOwnerProfile, updateOwnerProfile } from '../../api/ownerProfile'
import type { OwnerFact, OwnerProfile } from '../../api/types'
import { getDefaultOwnerProfile } from '../../lib/ownerProfile'

function newFactId(): string {
  return `fact-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

export default function OwnerProfileEditor() {
  const [profile, setProfile] = useState<OwnerProfile | null>(null)
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
      const saved = await updateOwnerProfile(next)
      setProfile(saved)
      message.success('主人资料已保存到服务器，小柒会据此回答相关问题')
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
          placeholder="一段关于主人的介绍，用户问「介绍一下主人」时会用到"
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
              placeholder="主题，如：爱好、职业"
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
          <p className="owner-profile-empty">暂无条目，可点击「添加条目」补充爱好、职业等信息。</p>
        ) : null}
      </div>

      <div className="owner-profile-actions">
        <Button type="primary" loading={saving} onClick={() => void handleSave()}>
          保存主人资料
        </Button>
        <Button loading={saving} onClick={() => void handleReset()}>
          恢复默认
        </Button>
      </div>
    </div>
  )
}
