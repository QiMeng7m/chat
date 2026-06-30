import ThemeButton from './ThemeButton'

export function adminModalFooter(
  onCancel: () => void,
  onOk: () => void,
  submitting: boolean,
  okLabel = '确定',
) {
  return (
    <div className="admin-modal-footer">
      <ThemeButton variant="ghost" onClick={onCancel}>
        取消
      </ThemeButton>
      <ThemeButton variant="primary" loading={submitting} onClick={onOk}>
        {okLabel}
      </ThemeButton>
    </div>
  )
}
