import { Button } from 'antd'
import { useState } from 'react'
import type { FeaturePublic, UiField } from '../../api/types'
import { useTheme } from '../../theme/ThemeProvider'
import { useChat } from './ChatContext'

type DocGenerateFormProps = {
  feature: FeaturePublic
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: UiField
  value: string
  onChange: (v: string) => void
}) {
  if (field.type === 'textarea') {
    return (
      <textarea
        className="doc-form-textarea"
        rows={6}
        placeholder={field.placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    )
  }
  if (field.type === 'select') {
    return (
      <select className="doc-form-select" value={value} onChange={(e) => onChange(e.target.value)}>
        {field.options?.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    )
  }
  return (
    <input
      className="doc-form-input"
      type={field.type === 'number' ? 'number' : 'text'}
      placeholder={field.placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

export default function DocGenerateForm({ feature }: DocGenerateFormProps) {
  const { meta } = useTheme()
  const { streaming, sendMessage, canChat, modelsEmpty } = useChat()
  const fields = feature.uiSchema?.fields ?? []
  const [formData, setFormData] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    for (const f of fields) {
      if (f.type === 'select' && f.options?.length) {
        init[f.key] = f.options[0]!.value
      } else {
        init[f.key] = ''
      }
    }
    return init
  })

  const handleSubmit = () => {
    if (!canChat) return
    for (const f of fields) {
      if (f.required && !formData[f.key]?.trim()) {
        return
      }
    }
    const summary = [
      `请根据以下信息生成${feature.name}：`,
      ...fields.map((f) => `- ${f.label.replace(/^[^\s]+\s/, '')}: ${formData[f.key]}`),
    ].join('\n')
    void sendMessage(summary, formData)
  }

  return (
    <div className="doc-form-wrap">
      <div className="doc-form-card">
        <div className="doc-form-header">
          <span className="doc-form-icon">{feature.icon ?? '📝'}</span>
          <div>
            <strong>填写文档小要点</strong>
            <div className="doc-form-subtitle">{meta.formHelperDesc}</div>
          </div>
        </div>
        <div className="doc-form-body">
          {fields.map((field) => (
            <div key={field.key} className="doc-form-group">
              <label className="doc-form-label">
                {field.label}
                {field.required ? ' *' : ''}
              </label>
              <FieldInput
                field={field}
                value={formData[field.key] ?? ''}
                onChange={(v) => setFormData((prev) => ({ ...prev, [field.key]: v }))}
              />
            </div>
          ))}
          {!canChat && modelsEmpty ? (
            <div className="quota-error-banner" role="status">
              暂无可用模型，无法生成文档
            </div>
          ) : null}
          <Button type="primary" block loading={streaming} disabled={!canChat} onClick={handleSubmit}>
            ✨ 生成文档
          </Button>
        </div>
      </div>
    </div>
  )
}
