import { Dropdown } from 'antd'
import type { ModelPublic } from '../../api/types'

type ModelSelectProps = {
  models: ModelPublic[]
  value: string
  onChange: (id: string) => void
  disabled?: boolean
  compact?: boolean
}

function primaryTag(model: ModelPublic): string | undefined {
  return model.tags[0]
}

export default function ModelSelect({
  models,
  value,
  onChange,
  disabled,
  compact,
}: ModelSelectProps) {
  const current = models.find((m) => m.id === value) ?? models[0]

  const items = models.map((model) => ({
    key: model.id,
    label: (
      <span>
        {model.label}{' '}
        {model.tags[0] ? <span className="model-tag">{model.tags[0]}</span> : null}
      </span>
    ),
    onClick: () => onChange(model.id),
  }))

  if (!current) return null

  return (
    <Dropdown menu={{ items }} disabled={disabled} trigger={['click']}>
      <div
        className="model-select"
        title="切换模型"
        role="button"
        tabIndex={0}
        style={disabled ? { opacity: 0.6, pointerEvents: 'none' } : undefined}
      >
        <span className="dot" />
        <span>{compact ? current.label.split(' ')[0] : current.label}</span>
        {primaryTag(current) ? <span className="model-tag">{primaryTag(current)}</span> : null}
        <span style={{ color: 'var(--text-muted)' }}>▾</span>
      </div>
    </Dropdown>
  )
}
