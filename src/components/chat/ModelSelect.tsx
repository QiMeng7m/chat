import { Dropdown, Tooltip } from 'antd'
import type { ModelPublic } from '../../api/types'
import { PRO_MODEL_NO_ACCESS_HINT } from '../../lib/modelAccess'

type ModelSelectProps = {
  models: ModelPublic[]
  value: string
  onChange: (id: string) => void
  disabled?: boolean
  compact?: boolean
  isModelDisabled?: (model: ModelPublic) => boolean
}

function primaryTag(model: ModelPublic): string | undefined {
  return model.tags[0]
}

function ModelOptionLabel({
  model,
  locked,
}: {
  model: ModelPublic
  locked: boolean
}) {
  const content = (
    <span className={locked ? 'model-select-item model-select-item--locked' : 'model-select-item'}>
      {model.label}{' '}
      {model.tags[0] ? <span className="model-tag">{model.tags[0]}</span> : null}
    </span>
  )

  if (!locked) return content

  return (
    <Tooltip title={PRO_MODEL_NO_ACCESS_HINT} mouseEnterDelay={0.2}>
      {content}
    </Tooltip>
  )
}

export default function ModelSelect({
  models,
  value,
  onChange,
  disabled,
  compact,
  isModelDisabled,
}: ModelSelectProps) {
  const accessibleModels = models.filter((m) => !isModelDisabled?.(m))
  const current =
    models.find((m) => m.id === value) ??
    accessibleModels[0] ??
    models[0]

  const items = models.map((model) => {
    const locked = isModelDisabled?.(model) ?? false
    return {
      key: model.id,
      disabled: locked,
      label: <ModelOptionLabel model={model} locked={locked} />,
      onClick: () => {
        if (!locked) onChange(model.id)
      },
    }
  })

  if (!current) return null

  const currentLocked = isModelDisabled?.(current) ?? false

  const trigger = (
    <div
      className={`model-select${currentLocked ? ' model-select--locked' : ''}`}
      title={currentLocked ? PRO_MODEL_NO_ACCESS_HINT : '切换模型'}
      role="button"
      tabIndex={0}
      style={disabled ? { opacity: 0.6, pointerEvents: 'none' } : undefined}
    >
      <span className="dot" />
      <span>{compact ? current.label.split(' ')[0] : current.label}</span>
      {primaryTag(current) ? <span className="model-tag">{primaryTag(current)}</span> : null}
      <span style={{ color: 'var(--text-muted)' }}>▾</span>
    </div>
  )

  return (
    <Dropdown menu={{ items }} disabled={disabled} trigger={['click']}>
      {currentLocked ? (
        <Tooltip title={PRO_MODEL_NO_ACCESS_HINT} mouseEnterDelay={0.2}>
          {trigger}
        </Tooltip>
      ) : (
        trigger
      )}
    </Dropdown>
  )
}
